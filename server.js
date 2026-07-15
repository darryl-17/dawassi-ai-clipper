/**
 * Clip Studio — local Twitch/YouTube stream & VOD clipping tool.
 *
 * Live mode : records the live stream into a rolling buffer of small .ts
 *             segments, so "clip the last N seconds" is an instant copy.
 * VOD mode  : downloads just the requested section of a YouTube/Twitch VOD.
 *
 * Everything runs locally. Clips land in ./clips.
 */
const express = require('express');
const { spawn, execFile, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const IS_WIN = process.platform === 'win32';
// Python interpreter for pip-installed yt-dlp: python3 on mac/linux, python/py on Windows.
const PYTHONS = IS_WIN ? ['python', 'py'] : ['python3'];

// Locate a working ffmpeg: ./bin copy > system install > ffmpeg-static > imageio-ffmpeg (pip).
function findFfmpeg() {
  const candidates = [];
  if (process.env.CLIP_FFMPEG) candidates.push(process.env.CLIP_FFMPEG);
  candidates.push(path.join(ROOT, 'bin', IS_WIN ? 'ffmpeg.exe' : 'ffmpeg')); // copy made by setup script
  candidates.push(IS_WIN ? 'ffmpeg.exe' : 'ffmpeg'); // whatever is on PATH
  for (const p of ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg']) candidates.push(p);
  try { candidates.push(require('ffmpeg-static')); } catch (_) {}
  candidates.push(path.join(ROOT, 'node_modules', '@ffmpeg-installer', 'darwin-arm64', 'ffmpeg'));
  for (const py of PYTHONS) {
    try {
      const p = execFileSync(py, ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'],
        { timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
      if (p) { candidates.push(p); break; }
    } catch (_) {}
  }
  for (const c of candidates) {
    if (!c) continue;
    if (path.isAbsolute(c) && !fs.existsSync(c)) continue;
    try { execFileSync(c, ['-version'], { timeout: 10000, stdio: 'pipe' }); return c; } catch (_) {}
  }
  return null;
}

// Locate yt-dlp: standalone binary in ./bin > pip-installed module.
// Returns {cmd, baseArgs} so both call styles work transparently.
function findYtdlp() {
  if (process.env.CLIP_YTDLP) {
    try {
      execFileSync(process.env.CLIP_YTDLP, ['--version'], { timeout: 20000, stdio: 'pipe' });
      return { cmd: process.env.CLIP_YTDLP, baseArgs: [] };
    } catch (_) {}
  }
  const bin = path.join(ROOT, 'bin', IS_WIN ? 'yt-dlp.exe' : 'yt-dlp');
  if (fs.existsSync(bin)) {
    try {
      execFileSync(bin, ['--version'], { timeout: 20000, stdio: 'pipe' });
      return { cmd: bin, baseArgs: [] };
    } catch (_) {}
  }
  for (const py of PYTHONS) {
    try {
      execFileSync(py, ['-m', 'yt_dlp', '--version'], { timeout: 20000, stdio: 'pipe' });
      return { cmd: py, baseArgs: ['-m', 'yt_dlp'] };
    } catch (_) {}
  }
  try {
    execFileSync(IS_WIN ? 'yt-dlp.exe' : 'yt-dlp', ['--version'], { timeout: 20000, stdio: 'pipe' });
    return { cmd: IS_WIN ? 'yt-dlp.exe' : 'yt-dlp', baseArgs: [] }; // on PATH
  } catch (_) {}
  return null;
}

// yt-dlp and ffmpeg tooling expect a binary literally named "ffmpeg";
// imageio-ffmpeg ships one named e.g. "ffmpeg-macos-arm64-v7.1", so alias it.
function stableFfmpegPath(found) {
  if (!found) return null;
  if (path.basename(found) === 'ffmpeg') return found;
  const link = path.join(ROOT, 'bin', 'ffmpeg');
  try {
    fs.mkdirSync(path.join(ROOT, 'bin'), { recursive: true });
    try { fs.unlinkSync(link); } catch (_) {}
    fs.symlinkSync(found, link);
    return link;
  } catch (_) { return found; }
}

const FFMPEG = stableFfmpegPath(findFfmpeg());
const YTDLP_INFO = findYtdlp();
if (!FFMPEG || !YTDLP_INFO) {
  console.error('Missing tools:' + (FFMPEG ? '' : ' ffmpeg') + (YTDLP_INFO ? '' : ' yt-dlp'));
  console.error('Run the setup again (npm install / pip install yt-dlp imageio-ffmpeg) and restart.');
  process.exit(1);
}
const ytdlp = (args, opts, cb) => execFile(YTDLP_INFO.cmd, [...YTDLP_INFO.baseArgs, ...args], opts, cb);
const ytdlpSpawn = (args) => spawn(YTDLP_INFO.cmd, [...YTDLP_INFO.baseArgs, ...args]);
const BUFFER_DIR = path.join(ROOT, 'buffer');
const CLIPS_DIR = path.join(ROOT, 'clips');
const ASSETS_DIR = path.join(BUFFER_DIR, 'assets'); // uploaded overlays / music (gitignored)
const SEG_SECONDS = 4;            // segment length of the live buffer
const BUFFER_MINUTES = Number(process.env.CLIP_BUFFER_MINUTES) || 600; // live history kept on disk
const PORT = Number(process.env.PORT) || 3547;

for (const d of [BUFFER_DIR, CLIPS_DIR, ASSETS_DIR]) fs.mkdirSync(d, { recursive: true });

const app = express();
app.use(express.json());
app.use(express.static(path.join(ROOT, 'public')));
app.use('/clips', express.static(CLIPS_DIR));
app.use('/assets', express.static(ASSETS_DIR));

// Resolve an uploaded asset filename to an on-disk path (basename-guarded).
function assetPath(name) {
  const b = path.basename(String(name || ''));
  if (!b) return null;
  const p = path.join(ASSETS_DIR, b);
  return fs.existsSync(p) ? p : null;
}

// ---------------------------------------------------------------- helpers

function sanitizeName(name) {
  return (name || '').replace(/[^a-zA-Z0-9 _\-\.]/g, '').trim().slice(0, 120);
}

function tsName(suffix) {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `clip_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}${suffix ? '_' + suffix : ''}`;
}

// "1:23:45", "12:34", "95", "1h2m3s" -> seconds
function parseTime(t) {
  if (t == null) return null;
  t = String(t).trim();
  if (!t) return null;
  const hms = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s?)?$/i);
  if (t.includes(':')) {
    const parts = t.split(':').map(Number);
    if (parts.some(isNaN)) return null;
    return parts.reduce((acc, v) => acc * 60 + v, 0);
  }
  if (hms && (hms[1] || hms[2] || hms[3])) {
    return (Number(hms[1] || 0) * 3600) + (Number(hms[2] || 0) * 60) + Number(hms[3] || 0);
  }
  const n = Number(t);
  return isNaN(n) ? null : n;
}

function fmtTime(s) {
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(sec).padStart(2, '0');
}

function runFfmpeg(args, onLine) {
  return new Promise((resolve, reject) => {
    const p = spawn(FFMPEG, args);
    let err = '';
    p.stderr.on('data', (d) => {
      err += d.toString();
      if (onLine) d.toString().split('\n').forEach((l) => l && onLine(l));
      if (err.length > 60000) err = err.slice(-30000);
    });
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error('ffmpeg exited ' + code + '\n' + err.slice(-2000)))));
  });
}

// ---------------------------------------------------------------- jobs

const jobs = []; // {id, kind, label, status: running|done|error, progress, detail, output, startedAt}
let jobSeq = 1;

function newJob(kind, label) {
  const job = { id: jobSeq++, kind, label, status: 'running', progress: null, detail: '', output: null, startedAt: Date.now() };
  jobs.unshift(job);
  if (jobs.length > 50) jobs.pop();
  return job;
}

// ---------------------------------------------------------------- live recorder

const MAX_STREAMS = 5;             // buffer up to this many streams at once
const streams = new Map();         // id -> live session
let streamSeq = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function newStream(url, quality) {
  const id = String(++streamSeq);
  const st = {
    id, status: 'resolving', url, title: null, quality: quality || 'best',
    error: null, proc: null, segDir: path.join(BUFFER_DIR, `live_${id}_${Date.now()}`),
    startedAt: null, markAt: null, restarts: 0, stopRequested: false, nextSegStart: 0,
    hypeSpikeAt: null, hypeBaseline: null, volHistory: [], analyzedUpTo: -1, analyzing: false,
  };
  fs.mkdirSync(st.segDir, { recursive: true });
  streams.set(id, st);
  return st;
}

// Short label from the stream title, used in default clip filenames so clips
// from different streams don't collide and are easy to tell apart.
function shortName(st) {
  const t = sanitizeName((st.title || 'stream').split(/[\s|:\-]+/).filter(Boolean).slice(0, 3).join('_'));
  return (t || 'stream').slice(0, 40);
}

// ---------------------------------------------------------------- hype detection
// Loud moments (crowd pops, screaming, hype) sit well above a stream's normal
// loudness. We measure each buffered segment's mean volume and flag spikes.

function segIndex(file) {
  const m = path.basename(file).match(/(\d+)/);
  return m ? Number(m[1]) : -1;
}

function segmentVolume(fp) {
  return new Promise((resolve) => {
    execFile(FFMPEG, ['-hide_banner', '-i', fp, '-vn', '-af', 'volumedetect', '-f', 'null', '-'],
      { timeout: 15000 }, (e, so, se) => {
        const m = String(se).match(/mean_volume:\s*(-?[\d.]+)\s*dB/);
        resolve(m ? Number(m[1]) : null);
      });
  });
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : null;
}

setInterval(async () => {
  for (const st of streams.values()) {
    if (st.status !== 'recording' || st.analyzing) continue;
    st.analyzing = true;
    try {
      const segs = listSegments(st).slice(0, -1);
      const fresh = segs.filter((s) => segIndex(s.file) > st.analyzedUpTo).slice(-5);
      for (const s of fresh) {
        st.analyzedUpTo = Math.max(st.analyzedUpTo, segIndex(s.file));
        const db = await segmentVolume(s.file);
        if (db == null || db < -70) continue; // silence/failed reads don't count
        st.volHistory.push(db);
        if (st.volHistory.length > 150) st.volHistory.shift();
        st.hypeBaseline = median(st.volHistory);
        if (st.volHistory.length >= 12 && db > st.hypeBaseline + 6) st.hypeSpikeAt = Date.now();
      }
    } catch (_) {} finally { st.analyzing = false; }
  }
}, 15000);

function resolveStream(url, quality) {
  // Prints title on line 1, media URL(s) after. "best" = single muxed stream,
  // which is what we want for -c copy segment recording.
  const fmt = quality && quality !== 'best' ? `best[height<=?${quality}]/best` : 'best';
  return new Promise((resolve, reject) => {
    ytdlp(['--no-warnings', '--no-playlist', '-f', fmt, '-e', '-g', url],
      { timeout: 60000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) return reject(new Error((stderr || err.message).split('\n').filter(Boolean).slice(-3).join(' ')));
        const lines = stdout.trim().split('\n').filter(Boolean);
        if (lines.length < 2) return reject(new Error('could not resolve stream URL'));
        resolve({ title: lines[0], mediaUrl: lines[lines.length - 1] });
      });
  });
}

function listSegments(st) {
  if (!st || !st.segDir || !fs.existsSync(st.segDir)) return [];
  return fs.readdirSync(st.segDir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => {
      const s = fs.statSync(path.join(st.segDir, f));
      return { file: path.join(st.segDir, f), mtime: s.mtimeMs, size: s.size };
    })
    .sort((a, b) => a.mtime - b.mtime);
}

function spawnRecorder(st, mediaUrl) {
  const args = [
    '-hide_banner', '-loglevel', 'warning',
    '-reconnect', '1', '-reconnect_streamed', '1', '-reconnect_delay_max', '10',
    '-i', mediaUrl,
    '-map', '0', '-c', 'copy',
    '-f', 'segment',
    '-segment_time', String(SEG_SECONDS),
    '-reset_timestamps', '1',
    '-segment_start_number', String(st.nextSegStart),
    '-segment_format', 'mpegts',
    path.join(st.segDir, 'seg_%08d.ts'),
  ];
  const proc = spawn(FFMPEG, args);
  st.proc = proc;
  proc.stderr.on('data', () => {});
  proc.on('close', async () => {
    st.proc = null;
    if (st.stopRequested) return;
    // Stream hiccup or expired playlist token: re-resolve and resume.
    if (st.restarts >= 20) {
      st.status = 'error';
      st.error = 'recorder stopped too many times — stream probably ended';
      return;
    }
    st.restarts++;
    const segs = listSegments(st);
    st.nextSegStart = segs.length ? Number(path.basename(segs[segs.length - 1].file).match(/(\d+)/)[1]) + 1 : 0;
    await sleep(3000);
    if (st.stopRequested) return;
    try {
      const { mediaUrl: fresh } = await resolveStream(st.url, st.quality);
      spawnRecorder(st, fresh);
    } catch (e) {
      st.status = 'error';
      st.error = 'stream ended or unreachable: ' + e.message;
    }
  });
}

async function startLive(url, quality) {
  if (streams.size >= MAX_STREAMS) throw new Error(`max ${MAX_STREAMS} streams at once — stop one first`);
  for (const s of streams.values()) if (s.url === url) throw new Error('that stream is already buffering');
  const st = newStream(url, quality);
  try {
    const { title, mediaUrl } = await resolveStream(url, st.quality);
    st.title = title;
    st.startedAt = Date.now();
    st.status = 'recording';
    spawnRecorder(st, mediaUrl);
    return st;
  } catch (e) {
    try { fs.rmSync(st.segDir, { recursive: true, force: true }); } catch (_) {}
    streams.delete(st.id);
    throw new Error(e.message);
  }
}

function stopLive(id) {
  const st = streams.get(id);
  if (!st) return;
  st.stopRequested = true;
  if (st.proc) st.proc.kill('SIGINT');
  setTimeout(() => { try { fs.rmSync(st.segDir, { recursive: true, force: true }); } catch (_) {} }, 1500);
  streams.delete(id);
}

// Trim old segments (all streams) so the buffer doesn't eat the disk.
setInterval(() => {
  const cutoff = Date.now() - BUFFER_MINUTES * 60 * 1000;
  for (const st of streams.values())
    for (const s of listSegments(st)) if (s.mtime < cutoff) { try { fs.unlinkSync(s.file); } catch (_) {} }
}, 60 * 1000);

// Clean abandoned buffer dirs from previous runs on boot (keep uploaded assets
// and the persisted YouTube connection).
for (const d of fs.readdirSync(BUFFER_DIR)) {
  if (d === 'assets' || d === 'youtube.json') continue;
  const full = path.join(BUFFER_DIR, d);
  try { fs.rmSync(full, { recursive: true, force: true }); } catch (_) {}
}

async function clipLive(id, { seconds, fromMark, name }) {
  const st = streams.get(id);
  if (!st || st.status !== 'recording') throw new Error('not recording that stream');
  const segs = listSegments(st);
  if (segs.length < 2) throw new Error('buffer is still warming up — wait a few seconds');
  const usable = segs.slice(0, -1); // last segment is still being written
  // Segment mtimes are unreliable on slow links (data arrives in bursts), but
  // each segment holds ~SEG_SECONDS of video — so select by count, not clock.
  let wantSeconds;
  if (fromMark) {
    if (!st.markAt) throw new Error('no mark set');
    wantSeconds = (Date.now() - st.markAt) / 1000;
  } else {
    wantSeconds = seconds || 60;
  }
  const count = Math.min(usable.length, Math.ceil(wantSeconds / SEG_SECONDS) + 1);
  const chosen = usable.slice(-count);
  if (!chosen.length) throw new Error('no buffered video in that window yet');

  const base = sanitizeName(name) || tsName(`${shortName(st)}_${fromMark ? 'marked' : 'last' + seconds + 's'}`);
  const out = path.join(CLIPS_DIR, base + '.mp4');
  const listFile = path.join(BUFFER_DIR, `concat_${id}_${Date.now()}.txt`);
  fs.writeFileSync(listFile, chosen.map((s) => `file '${s.file.replace(/'/g, "'\\''")}'`).join('\n'));

  const job = newJob('live-clip', `Clip: ${base}.mp4 (${st.title ? st.title.slice(0, 22) + ' · ' : ''}${fromMark ? 'from mark' : 'last ' + seconds + 's'})`);
  try {
    // Long-running streams carry huge PTS; copying would give the clip a giant
    // duration/gap. Re-encode with fresh timestamps so every clip is clean,
    // zero-based, and ready to edit/upload. (Take A/V only — TS timed_id3 can't go in MP4.)
    await runFfmpeg(['-hide_banner', '-loglevel', 'error', '-fflags', '+genpts', '-f', 'concat', '-safe', '0',
      '-i', listFile, '-map', '0:v', '-map', '0:a',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '160k',
      '-movflags', '+faststart', '-y', out]);
    job.status = 'done';
    job.output = base + '.mp4';
    if (fromMark) st.markAt = null;
  } catch (e) {
    job.status = 'error';
    job.detail = e.message;
    throw e;
  } finally {
    try { fs.unlinkSync(listFile); } catch (_) {}
  }
  return base + '.mp4';
}

// ---------------------------------------------------------------- VOD clipping

function vodClip({ url, start, end, name, precise }) {
  const s = parseTime(start), e = parseTime(end);
  if (s == null || e == null || e <= s) throw new Error('invalid start/end time');
  const base = sanitizeName(name) || tsName(`vod_${fmtTime(s).replace(/:/g, '-')}_${fmtTime(e).replace(/:/g, '-')}`);
  const out = path.join(CLIPS_DIR, base + '.%(ext)s');
  const job = newJob('vod-clip', `VOD clip: ${base}.mp4 (${fmtTime(s)} → ${fmtTime(e)})`);

  const args = [
    '--no-warnings', '--no-playlist',
    '--ffmpeg-location', FFMPEG,
    '--download-sections', `*${s}-${e}`,
    '-f', 'bv*[height<=?1080]+ba/b[height<=?1080]/b',
    '--merge-output-format', 'mp4',
    '--newline', '--progress',
    '-o', out,
    url,
  ];
  if (precise !== false) args.splice(4, 0, '--force-keyframes-at-cuts');

  const p = ytdlpSpawn(args);
  const onData = (d) => {
    for (const line of d.toString().split('\n')) {
      const m = line.match(/\[download\]\s+([\d.]+)%/);
      if (m) job.progress = Number(m[1]);
      if (line.trim()) job.detail = line.trim().slice(0, 200);
    }
  };
  p.stdout.on('data', onData);
  p.stderr.on('data', onData);
  p.on('close', (code) => {
    if (code === 0 && fs.existsSync(path.join(CLIPS_DIR, base + '.mp4'))) {
      job.status = 'done';
      job.progress = 100;
      job.output = base + '.mp4';
    } else {
      job.status = 'error';
      if (!job.detail.toLowerCase().includes('error')) job.detail = 'yt-dlp exited with code ' + code + ' — ' + job.detail;
    }
  });
  return job;
}

// ---------------------------------------------------------------- vertical export

function verticalExport(file) {
  const src = path.join(CLIPS_DIR, file);
  if (!fs.existsSync(src)) throw new Error('clip not found');
  const base = file.replace(/\.mp4$/i, '') + '_vertical';
  const out = path.join(CLIPS_DIR, base + '.mp4');
  const job = newJob('vertical', `Vertical 9:16: ${base}.mp4`);
  runFfmpeg([
    '-hide_banner', '-loglevel', 'error', '-i', src,
    '-vf', 'crop=min(iw\\,ih*9/16):ih,scale=1080:1920:flags=lanczos,setsar=1',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-y', out,
  ]).then(() => {
    job.status = 'done';
    job.progress = 100;
    job.output = base + '.mp4';
  }).catch((e) => {
    job.status = 'error';
    job.detail = e.message.slice(0, 300);
  });
  return job;
}

// ---------------------------------------------------------------- gif / thumbnail / trim

function gifExport(file) {
  const src = path.join(CLIPS_DIR, file);
  if (!fs.existsSync(src)) throw new Error('clip not found');
  const base = file.replace(/\.mp4$/i, '');
  const out = path.join(CLIPS_DIR, base + '.gif');
  const job = newJob('gif', `GIF: ${base}.gif (first 8s, 480px)`);
  runFfmpeg([
    '-hide_banner', '-loglevel', 'error', '-t', '8', '-i', src,
    '-vf', 'fps=12,scale=480:-2:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse',
    '-y', out,
  ]).then(() => { job.status = 'done'; job.progress = 100; job.output = base + '.gif'; })
    .catch((e) => { job.status = 'error'; job.detail = e.message.slice(0, 300); });
  return job;
}

function thumbExport(file, at) {
  const src = path.join(CLIPS_DIR, file);
  if (!fs.existsSync(src)) throw new Error('clip not found');
  const base = file.replace(/\.mp4$/i, '');
  const out = path.join(CLIPS_DIR, base + '_thumb.jpg');
  const job = newJob('thumb', `Thumbnail: ${base}_thumb.jpg`);
  runFfmpeg(['-hide_banner', '-loglevel', 'error', '-ss', String(at || 1), '-i', src,
    '-frames:v', '1', '-q:v', '2', '-y', out])
    .then(() => { job.status = 'done'; job.progress = 100; job.output = base + '_thumb.jpg'; })
    .catch((e) => { job.status = 'error'; job.detail = e.message.slice(0, 300); });
  return job;
}

function clamp01(v) { v = Number(v); return isNaN(v) ? 0 : Math.max(0, Math.min(1, v)); }

// Caption fonts (macOS system .ttf files) → drawtext fontfile paths.
const CAP_FONT_FILES = {
  arial: 'Supplemental/Arial.ttf', arialblack: 'Supplemental/Arial Black.ttf',
  impact: 'Supplemental/Impact.ttf', verdana: 'Supplemental/Verdana.ttf',
  trebuchet: 'Supplemental/Trebuchet MS.ttf', georgia: 'Supplemental/Georgia.ttf',
  times: 'Supplemental/Times New Roman.ttf', comic: 'Supplemental/Comic Sans MS.ttf',
  courier: 'Supplemental/Courier New.ttf', sf: 'SFNS.ttf',
};
function capFontFile(id) {
  const rel = CAP_FONT_FILES[id] || CAP_FONT_FILES.arial;
  return '/System/Library/Fonts/' + rel;
}

// Probe a video file's pixel dimensions via `ffmpeg -i` (no ffprobe in our toolchain).
function probeDims(absPath) {
  return new Promise((resolve) => {
    execFile(FFMPEG, ['-i', absPath], { timeout: 10000 }, (err, so, se) => {
      const m = String(se).match(/Video:.*?,\s*(\d{2,5})x(\d{2,5})/);
      resolve(m ? { w: Number(m[1]), h: Number(m[2]) } : null);
    });
  });
}
// Probe any file's duration in seconds via `ffmpeg -i`.
function probeDuration(absPath) {
  return new Promise((resolve) => {
    execFile(FFMPEG, ['-i', absPath], { timeout: 10000 }, (err, so, se) => {
      const m = String(se).match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
      resolve(m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null);
    });
  });
}

// Full web-editor render: trim + reframe(crop) + text layers + speed + mute +
// fade transitions + image/video overlays + background music, one pass.
// Simple edits use -vf; overlays/music switch to -filter_complex.
function editClip(file, o) {
  const src = path.join(CLIPS_DIR, file);
  if (!fs.existsSync(src)) throw new Error('clip not found');
  const base = sanitizeName(o.name) || (file.replace(/\.mp4$/i, '') + '_edit');
  const out = path.join(CLIPS_DIR, base + '.mp4');
  const job = newJob('edit', `Edit: ${base}.mp4`);
  const capFiles = [];

  (async () => {
    const s = o.start != null && o.start !== '' ? Math.max(0, Number(o.start)) : null;
    const e = o.end != null && o.end !== '' ? Number(o.end) : null;
    const trimDur = (e != null && e > (s || 0)) ? e - (s || 0) : null;
    const speed = [0.5, 1, 1.5, 2].includes(Number(o.speed)) ? Number(o.speed) : 1;

    // --- resolve overlay + music assets up front (need their inputs / dims) ---
    const overlays = (Array.isArray(o.overlays) ? o.overlays : [])
      .map((ov) => ({ ...ov, path: assetPath(ov && ov.file) }))
      .filter((ov) => ov.path);
    const music = (o.music && assetPath(o.music.file)) ? { ...o.music, path: assetPath(o.music.file) } : null;
    const useComplex = overlays.length > 0 || !!music;

    // Output frame size — needed to scale overlays proportionally.
    const scaleMap = { '9:16': [1080, 1920], '1:1': [1080, 1080], '16:9': [1920, 1080] };
    const hasText = (Array.isArray(o.texts) && o.texts.length) || (o.caption && String(o.caption).trim());
    let outW = 0, outH = 0;
    if (scaleMap[o.aspect]) { [outW, outH] = scaleMap[o.aspect]; }
    else if (useComplex || hasText) { const d = await probeDims(src); if (d) { outW = d.w; outH = d.h; } }

    // Fade timings live in the OUTPUT timebase (after the speed change).
    const fadeIn = Math.max(0, Number(o.fadeIn) || 0);
    let fadeOut = Math.max(0, Number(o.fadeOut) || 0);
    let outDur = trimDur != null ? trimDur : await probeDuration(src);
    if (outDur != null) outDur = outDur / speed;
    const fadeOutSt = (fadeOut > 0 && outDur) ? Math.max(0, outDur - fadeOut) : null;
    if (fadeOutSt == null) fadeOut = 0;

    // --- build the base video filter chain (shared by both paths) ---
    const vf = [];
    const R = { '9:16': 9 / 16, '1:1': 1, '16:9': 16 / 9 }[o.aspect];
    if (R) {
      const cx = clamp01(o.cropX), cy = clamp01(o.cropY);
      vf.push(`crop='min(iw,ih*${R})':'min(ih,iw/${R})':'(iw-ow)*${cx}':'(ih-oh)*${cy}'`);
      vf.push(`scale=${scaleMap[o.aspect][0]}:${scaleMap[o.aspect][1]}:flags=lanczos`, 'setsar=1');
    }
    if (speed !== 1) vf.push(`setpts=PTS/${speed}`);

    // Text layers: multiple on-screen texts (CapCut-style). Back-compat with
    // the old single { caption, captionPos }.
    const layers = Array.isArray(o.texts) && o.texts.length
      ? o.texts
      : (o.caption && String(o.caption).trim() ? [{ text: o.caption, pos: o.captionPos, color: 'white', size: 'medium' }] : []);
    const SIZE_PCT = { small: 1 / 22, medium: 1 / 14, large: 1 / 9 };
    const POSY = { top: 'h*0.06', middle: '(h-text_h)/2', bottom: 'h*0.84' };
    const H = outH || 1080;
    for (const t of layers) {
      const txt = String(t.text || '').trim();
      if (!txt) continue;
      const cf = path.join(BUFFER_DIR, `cap_${Date.now()}_${capFiles.length}.txt`);
      fs.writeFileSync(cf, txt.slice(0, 300));
      capFiles.push(cf);
      const sizePct = t.sizePct != null ? Math.max(0.02, Math.min(0.4, Number(t.sizePct)))
        : (SIZE_PCT[t.size] || 1 / 14);
      const fontsize = `h*${sizePct.toFixed(4)}`;
      const font = capFontFile(t.font);
      const color = /^#?[a-zA-Z0-9]+$/.test(String(t.color || '')) ? t.color : 'white';
      // horizontal: free x fraction (drag) or alignment; vertical: free y or preset
      const xExpr = t.x != null ? `(w-text_w)*${clamp01(t.x)}`
        : ({ left: '(w*0.05)', center: '(w-text_w)/2', right: 'w-text_w-(w*0.05)' }[t.align] || '(w-text_w)/2');
      const yExpr = t.y != null ? `(h-text_h)*${clamp01(t.y)}` : (POSY[t.pos] || 'h*0.84');
      const px = (f) => Math.max(1, Math.round(H * sizePct * f));
      let fx = `fontcolor=${color}`;
      const eff = t.effect || 'outline';
      if (eff === 'outline') fx += `:bordercolor=black:borderw=${Math.min(16, px(0.09))}`;
      else if (eff === 'shadow') fx += `:shadowcolor=black@0.7:shadowx=${Math.min(10, px(0.05))}:shadowy=${Math.min(10, px(0.05))}`;
      else if (eff === 'box') fx += `:box=1:boxcolor=black@0.55:boxborderw=${Math.min(40, px(0.32))}`;
      let dt = `drawtext=fontfile='${font}':textfile='${cf}':${fx}:fontsize=${fontsize}:x=${xExpr}:y=${yExpr}`;
      const ts = t.start != null && t.start !== '' ? Math.max(0, Number(t.start)) : null;
      const te = t.end != null && t.end !== '' ? Number(t.end) : null;
      if (ts != null || te != null) dt += `:enable='between(t,${ts != null ? ts : 0},${te != null ? te : 1e9})'`;
      vf.push(dt);
    }
    if (fadeIn > 0) vf.push(`fade=t=in:st=0:d=${fadeIn}`);
    if (fadeOut > 0) vf.push(`fade=t=out:st=${fadeOutSt.toFixed(3)}:d=${fadeOut}`);

    // --- assemble ffmpeg args ---
    const args = ['-hide_banner', '-loglevel', 'error'];
    // trim as INPUT options so it only limits the source clip (not the
    // overlay/music inputs that follow).
    if (s != null && s > 0) args.push('-ss', String(s));
    if (trimDur != null) args.push('-t', String(trimDur));
    args.push('-i', src);
    // overlay inputs
    for (const ov of overlays) args.push('-i', ov.path);
    // music input (looped so it always covers the clip; -shortest caps the render)
    let musicIdx = null;
    if (music) { args.push('-stream_loop', '-1', '-i', music.path); musicIdx = 1 + overlays.length; }

    const wantAudio = !o.mute || !!music;

    if (!useComplex) {
      if (vf.length) args.push('-vf', vf.join(','));
      if (o.mute) args.push('-an');
      else {
        const af = [];
        if (speed !== 1) af.push(`atempo=${speed}`);
        if (fadeIn > 0) af.push(`afade=t=in:st=0:d=${fadeIn}`);
        if (fadeOut > 0) af.push(`afade=t=out:st=${fadeOutSt.toFixed(3)}:d=${fadeOut}`);
        if (af.length) args.push('-af', af.join(','));
      }
    } else {
      const fc = [];
      fc.push(`[0:v]${vf.length ? vf.join(',') : 'null'}[vb]`);
      let cur = 'vb';
      overlays.forEach((ov, i) => {
        const inIdx = i + 1;
        const w = Math.max(2, Math.round(outW * clamp01(ov.scale || 0.3)));
        const ox = `(main_w-overlay_w)*${clamp01(ov.x)}`;
        const oy = `(main_h-overlay_h)*${clamp01(ov.y)}`;
        let en = '';
        const ovs = ov.start != null && ov.start !== '' ? Math.max(0, Number(ov.start)) : null;
        const ove = ov.end != null && ov.end !== '' ? Number(ov.end) : null;
        if (ovs != null || ove != null) en = `:enable='between(t,${ovs != null ? ovs : 0},${ove != null ? ove : 1e9})'`;
        fc.push(`[${inIdx}:v]scale=${w}:-2[ov${i}]`);
        const next = `v${i}`;
        fc.push(`[${cur}][ov${i}]overlay=${ox}:${oy}${en}[${next}]`);
        cur = next;
      });

      let aout = null;
      if (wantAudio) {
        const aChain = [];
        if (speed !== 1) aChain.push(`atempo=${speed}`);
        if (fadeIn > 0) aChain.push(`afade=t=in:st=0:d=${fadeIn}`);
        if (fadeOut > 0) aChain.push(`afade=t=out:st=${fadeOutSt.toFixed(3)}:d=${fadeOut}`);
        const origVol = o.mute ? 0 : 1;
        if (music) {
          const mvol = Math.max(0, Math.min(3, Number(music.volume != null ? music.volume : 0.5)));
          if (!o.mute) {
            fc.push(`[0:a]${aChain.length ? aChain.join(',') + ',' : ''}volume=${origVol}[a0]`);
            fc.push(`[${musicIdx}:a]volume=${mvol}[am]`);
            fc.push(`[a0][am]amix=inputs=2:duration=first:dropout_transition=0[aout]`);
          } else {
            // music only, trimmed to the video via -shortest
            const mf = [`volume=${mvol}`];
            if (fadeIn > 0) mf.push(`afade=t=in:st=0:d=${fadeIn}`);
            if (fadeOut > 0) mf.push(`afade=t=out:st=${fadeOutSt.toFixed(3)}:d=${fadeOut}`);
            fc.push(`[${musicIdx}:a]${mf.join(',')}[aout]`);
          }
          aout = 'aout';
        } else if (aChain.length) {
          fc.push(`[0:a]${aChain.join(',')}[aout]`);
          aout = 'aout';
        } else {
          aout = '0:a';
        }
      }

      args.push('-filter_complex', fc.join(';'));
      args.push('-map', `[${cur}]`);
      if (aout) args.push('-map', aout.startsWith('0:') ? aout : `[${aout}]`);
      else args.push('-an');
      if (music) args.push('-shortest');
    }

    args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20');
    if (wantAudio) args.push('-c:a', 'aac', '-b:a', '160k');
    args.push('-movflags', '+faststart', '-y', out);

    await runFfmpeg(args);
  })()
    .then(() => { job.status = 'done'; job.progress = 100; job.output = base + '.mp4'; })
    .catch((err) => { job.status = 'error'; job.detail = (err.message || String(err)).slice(0, 300); })
    .finally(() => { for (const cf of capFiles) try { fs.unlinkSync(cf); } catch (_) {} });
  return job;
}

function trimClip(file, start, end) {
  const s = parseTime(start), e = parseTime(end);
  if (s == null || e == null || e <= s) throw new Error('invalid start/end time');
  const src = path.join(CLIPS_DIR, file);
  if (!fs.existsSync(src)) throw new Error('clip not found');
  const base = file.replace(/\.mp4$/i, '') + '_trim';
  const out = path.join(CLIPS_DIR, base + '.mp4');
  const job = newJob('trim', `Trim: ${base}.mp4 (${fmtTime(s)} → ${fmtTime(e)})`);
  // Re-encode for frame-accurate cuts — clips are short, this stays fast.
  runFfmpeg(['-hide_banner', '-loglevel', 'error', '-ss', String(s), '-i', src, '-t', String(e - s),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '160k',
    '-movflags', '+faststart', '-y', out])
    .then(() => { job.status = 'done'; job.progress = 100; job.output = base + '.mp4'; })
    .catch((e2) => { job.status = 'error'; job.detail = e2.message.slice(0, 300); });
  return job;
}

// Enhance speech: denoise, de-hum, gentle compression + broadcast loudness.
function enhanceSpeech(file) {
  const src = path.join(CLIPS_DIR, file);
  if (!fs.existsSync(src)) throw new Error('clip not found');
  const base = file.replace(/\.mp4$/i, '') + '_enhanced';
  const out = path.join(CLIPS_DIR, base + '.mp4');
  const job = newJob('enhance', `Enhance speech: ${base}.mp4`);
  const af = 'highpass=f=90,afftdn=nf=-25,acompressor=threshold=-18dB:ratio=3:attack=20:release=250,loudnorm=I=-16:TP=-1.5:LRA=11';
  runFfmpeg(['-hide_banner', '-loglevel', 'error', '-i', src, '-c:v', 'copy',
    '-af', af, '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-y', out])
    .then(() => { job.status = 'done'; job.progress = 100; job.output = base + '.mp4'; })
    .catch((e2) => { job.status = 'error'; job.detail = e2.message.slice(0, 300); });
  return job;
}

// Upscale to 1080p or 4K (Lanczos + light sharpen).
function upscaleClip(file, target) {
  const src = path.join(CLIPS_DIR, file);
  if (!fs.existsSync(src)) throw new Error('clip not found');
  const h = target === '2160' ? 2160 : 1080;
  const base = file.replace(/\.mp4$/i, '') + '_' + h + 'p';
  const out = path.join(CLIPS_DIR, base + '.mp4');
  const job = newJob('upscale', `Upscale ${h}p: ${base}.mp4`);
  runFfmpeg(['-hide_banner', '-loglevel', 'error', '-i', src,
    '-vf', `scale=-2:${h}:flags=lanczos,unsharp=5:5:0.6:5:5:0.0`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
    '-c:a', 'copy', '-movflags', '+faststart', '-y', out])
    .then(() => { job.status = 'done'; job.progress = 100; job.output = base + '.mp4'; })
    .catch((e2) => { job.status = 'error'; job.detail = e2.message.slice(0, 300); });
  return job;
}

// Momentary-loudness timeline via ebur128 — used to find lively "highlight" moments.
function analyzeLoudness(src) {
  return new Promise((resolve) => {
    const p = spawn(FFMPEG, ['-hide_banner', '-nostats', '-i', src, '-af', 'ebur128=metadata=1', '-f', 'null', '-']);
    let buf = '';
    const pts = [];
    const take = (chunk) => {
      buf += chunk;
      const lines = buf.split('\n'); buf = lines.pop();
      for (const l of lines) {
        const m = l.match(/t:\s*([\d.]+).*?M:\s*(-?[\d.]+)/);
        if (m) { const lufs = Number(m[2]); pts.push({ t: Number(m[1]), lufs: lufs < -70 ? -70 : lufs }); }
      }
    };
    p.stderr.on('data', (d) => take(d.toString()));
    p.stdout.on('data', (d) => take(d.toString()));
    p.on('error', () => resolve([]));
    p.on('close', () => resolve(pts));
  });
}

// Auto "long → shorts": find the K liveliest moments by loudness and cut a
// vertical 9:16 short around each. Works on any local clip.
function autoShorts(file, count) {
  const src = path.join(CLIPS_DIR, file);
  if (!fs.existsSync(src)) throw new Error('clip not found');
  const base = file.replace(/\.mp4$/i, '');
  const job = newJob('shorts', `Auto shorts: ${file}`);
  (async () => {
    const dur = await probeDuration(src) || 0;
    const CLIP = 30, SPACING = 40;
    const want = Math.max(1, Math.min(Number(count) || 3, 6, Math.max(1, Math.floor(dur / CLIP))));
    let windows;
    if (dur <= CLIP + 4) {
      windows = [[0, Math.min(dur, CLIP)]];
    } else {
      const pts = await analyzeLoudness(src);
      const peaks = [];
      if (pts.length) {
        const sorted = [...pts].sort((a, b) => b.lufs - a.lufs);
        for (const p of sorted) {
          if (p.t < 2 || p.t > dur - 4) continue;
          if (peaks.every((q) => Math.abs(q - p.t) >= SPACING)) peaks.push(p.t);
          if (peaks.length >= want) break;
        }
      }
      // fallback: evenly spaced if loudness analysis gave nothing usable
      if (!peaks.length) for (let i = 0; i < want; i++) peaks.push((dur / (want + 1)) * (i + 1));
      peaks.sort((a, b) => a - b);
      windows = peaks.map((t) => {
        let s = Math.max(0, t - 8), e = Math.min(dur, s + CLIP);
        s = Math.max(0, e - CLIP);
        return [s, e];
      });
    }
    job.progress = 5;
    let made = 0;
    for (let i = 0; i < windows.length; i++) {
      const [s, e] = windows[i];
      const out = path.join(CLIPS_DIR, `${base}_short${i + 1}.mp4`);
      await runFfmpeg(['-hide_banner', '-loglevel', 'error', '-ss', String(s), '-t', String(e - s), '-i', src,
        '-vf', "crop='min(iw,ih*9/16)':'min(ih,iw/9*16)':'(iw-ow)/2':'(ih-oh)/2',scale=1080:1920:flags=lanczos,setsar=1",
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '160k',
        '-movflags', '+faststart', '-y', out]);
      made++;
      job.progress = 5 + Math.round((made / windows.length) * 95);
      job.output = `${base}_short${i + 1}.mp4`;
    }
    job.detail = `${made} short${made > 1 ? 's' : ''} created`;
  })()
    .then(() => { job.status = 'done'; job.progress = 100; })
    .catch((err) => { job.status = 'error'; job.detail = (err.message || String(err)).slice(0, 300); });
  return job;
}

// "Get clips in 1 click": download a whole video from a URL, then auto-cut shorts.
function autoShortsFromUrl(url, count) {
  if (!url) throw new Error('paste a video URL');
  const base = tsName('auto');
  const out = path.join(CLIPS_DIR, base + '.%(ext)s');
  const job = newJob('shorts-dl', `Auto shorts from link`);
  const args = ['--no-warnings', '--no-playlist', '--ffmpeg-location', FFMPEG,
    '-f', 'bv*[height<=?1080]+ba/b[height<=?1080]/b', '--merge-output-format', 'mp4',
    '--newline', '--progress', '-o', out, url];
  const p = ytdlpSpawn(args);
  const onData = (d) => {
    for (const line of d.toString().split('\n')) {
      const m = line.match(/\[download\]\s+([\d.]+)%/);
      if (m) job.progress = Number(m[1]);
      if (line.trim()) job.detail = line.trim().slice(0, 150);
    }
  };
  p.stdout.on('data', onData); p.stderr.on('data', onData);
  p.on('close', (code) => {
    if (code === 0 && fs.existsSync(path.join(CLIPS_DIR, base + '.mp4'))) {
      job.status = 'done'; job.progress = 100; job.output = base + '.mp4';
      job.detail = 'Downloaded — cutting shorts…';
      try { autoShorts(base + '.mp4', count); } catch (_) {}
    } else {
      job.status = 'error';
      if (!job.detail.toLowerCase().includes('error')) job.detail = 'download failed (code ' + code + ') ' + job.detail;
    }
  });
  return job;
}

// ---------------------------------------------------------------- YouTube
// One-click publishing of finished clips to the user's own channel via the
// YouTube Data API v3. The user supplies their own Google OAuth client
// (created in Google Cloud Console) — credentials + tokens live in
// buffer/youtube.json (gitignored, preserved across the boot cleanup).
const YT_FILE = path.join(BUFFER_DIR, 'youtube.json');
const YT_REDIRECT = `http://localhost:${PORT}/api/youtube/callback`;
const YT_SCOPES = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';

function loadYT() { try { return JSON.parse(fs.readFileSync(YT_FILE, 'utf8')); } catch (_) { return {}; } }
function saveYT(obj) { fs.writeFileSync(YT_FILE, JSON.stringify(obj, null, 2)); }

async function ytTokenRequest(params) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error_description || j.error || 'token request failed');
  return j;
}

async function ytExchangeCode(code) {
  const cfg = loadYT();
  const j = await ytTokenRequest({ code, client_id: cfg.clientId, client_secret: cfg.clientSecret, redirect_uri: YT_REDIRECT, grant_type: 'authorization_code' });
  cfg.tokens = { access_token: j.access_token, refresh_token: j.refresh_token, expiry: Date.now() + ((j.expires_in || 3600) - 60) * 1000 };
  saveYT(cfg);
  return cfg;
}

async function ytAccessToken() {
  const cfg = loadYT();
  if (!cfg.tokens || !cfg.tokens.refresh_token) throw new Error('YouTube not connected');
  if (cfg.tokens.access_token && Date.now() < (cfg.tokens.expiry || 0)) return cfg.tokens.access_token;
  const j = await ytTokenRequest({ client_id: cfg.clientId, client_secret: cfg.clientSecret, refresh_token: cfg.tokens.refresh_token, grant_type: 'refresh_token' });
  cfg.tokens.access_token = j.access_token;
  cfg.tokens.expiry = Date.now() + ((j.expires_in || 3600) - 60) * 1000;
  saveYT(cfg);
  return cfg.tokens.access_token;
}

async function ytFetchChannel() {
  const token = await ytAccessToken();
  const r = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', { headers: { Authorization: 'Bearer ' + token } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && j.error.message) || 'could not read channel');
  const c = (j.items || [])[0];
  return c ? { id: c.id, title: c.snippet.title, thumb: c.snippet.thumbnails && c.snippet.thumbnails.default && c.snippet.thumbnails.default.url } : null;
}

function publishToYouTube(file, meta) {
  const src = path.join(CLIPS_DIR, file);
  if (!fs.existsSync(src)) throw new Error('clip not found');
  if (!/\.mp4$/i.test(file)) throw new Error('only video clips can be published');
  const job = newJob('youtube', `YouTube ▶ ${file}`);
  (async () => {
    const token = await ytAccessToken();
    const snippet = { title: (String(meta.title || file).replace(/\.mp4$/i, '')).slice(0, 100) || 'Clip', description: String(meta.description || '').slice(0, 4900), categoryId: '20' };
    if (meta.tags) snippet.tags = String(meta.tags).split(',').map((t) => t.trim()).filter(Boolean).slice(0, 40);
    const privacyStatus = ['public', 'unlisted', 'private'].includes(meta.privacy) ? meta.privacy : 'private';
    const bytes = fs.readFileSync(src);
    // 1) initiate a resumable upload session
    const init = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': String(bytes.length) },
      body: JSON.stringify({ snippet, status: { privacyStatus, selfDeclaredMadeForKids: false } }),
    });
    if (!init.ok) throw new Error('upload init failed: ' + (await init.text()).slice(0, 300));
    const uploadUrl = init.headers.get('location');
    if (!uploadUrl) throw new Error('YouTube did not return an upload URL');
    job.progress = 15;
    // 2) send the bytes
    const up = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(bytes.length) }, body: bytes });
    const j = await up.json().catch(() => ({}));
    if (!up.ok) throw new Error((j.error && j.error.message) || 'upload failed');
    job.videoId = j.id;
    job.detail = 'https://youtu.be/' + j.id;
  })()
    .then(() => { job.status = 'done'; job.progress = 100; })
    .catch((err) => { job.status = 'error'; job.detail = (err.message || String(err)).slice(0, 300); });
  return job;
}

// ---------------------------------------------------------------- API

app.get('/api/status', (req, res) => {
  const list = [];
  for (const st of streams.values()) {
    const segs = st.status === 'recording' ? listSegments(st) : [];
    list.push({
      id: st.id,
      status: st.status,
      url: st.url,
      title: st.title,
      quality: st.quality,
      error: st.error,
      startedAt: st.startedAt,
      markAt: st.markAt,
      bufferedSeconds: segs.length ? Math.max(0, (segs.length - 1) * SEG_SECONDS) : 0,
      bufferBytes: segs.reduce((a, s) => a + s.size, 0),
      hypeSpikeAgo: st.hypeSpikeAt ? Math.round((Date.now() - st.hypeSpikeAt) / 1000) : null,
    });
  }
  res.json({
    streams: list,
    maxStreams: MAX_STREAMS,
    bufferMinutesMax: BUFFER_MINUTES,
    jobs: jobs.slice(0, 12),
  });
});

// Clip duration via `ffmpeg -i` (no ffprobe in our toolchain), cached by file+mtime.
const durCache = new Map();
function clipDuration(file, mtime) {
  const key = file + ':' + mtime;
  if (durCache.has(key)) return Promise.resolve(durCache.get(key));
  return new Promise((resolve) => {
    execFile(FFMPEG, ['-i', path.join(CLIPS_DIR, file)], { timeout: 10000 }, (err, so, se) => {
      const m = String(se).match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
      const d = m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
      if (durCache.size > 500) durCache.clear();
      durCache.set(key, d);
      resolve(d);
    });
  });
}

app.post('/api/live/start', async (req, res) => {
  try {
    const st = await startLive(String(req.body.url || '').trim(), String(req.body.quality || 'best'));
    res.json({ ok: true, id: st.id, title: st.title });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/live/stop', (req, res) => { stopLive(String(req.body.id || '')); res.json({ ok: true }); });

app.post('/api/live/mark', (req, res) => {
  const st = streams.get(String(req.body.id || ''));
  if (!st || st.status !== 'recording') return res.status(400).json({ error: 'not recording' });
  st.markAt = Date.now();
  res.json({ ok: true });
});

app.post('/api/live/clip', async (req, res) => {
  try {
    const file = await clipLive(String(req.body.id || ''), {
      seconds: Number(req.body.seconds) || 60,
      fromMark: !!req.body.fromMark,
      name: req.body.name,
    });
    res.json({ ok: true, file });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/vod/clip', (req, res) => {
  try {
    const job = vodClip({
      url: String(req.body.url || '').trim(),
      start: req.body.start, end: req.body.end,
      name: req.body.name, precise: req.body.precise,
    });
    res.json({ ok: true, jobId: job.id });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/clips', async (req, res) => {
  const files = fs.readdirSync(CLIPS_DIR)
    .filter((f) => /\.(mp4|gif|jpe?g|png)$/i.test(f))
    .map((f) => {
      const st = fs.statSync(path.join(CLIPS_DIR, f));
      return { file: f, size: st.size, mtime: st.mtimeMs, kind: /\.mp4$/i.test(f) ? 'video' : 'image' };
    })
    .sort((a, b) => b.mtime - a.mtime);
  await Promise.all(files.filter((f) => f.kind === 'video')
    .map(async (f) => { f.duration = await clipDuration(f.file, f.mtime); }));
  res.json(files);
});

app.delete('/api/clips/:file', (req, res) => {
  const f = path.join(CLIPS_DIR, path.basename(req.params.file));
  if (!fs.existsSync(f)) return res.status(404).json({ error: 'not found' });
  fs.unlinkSync(f);
  res.json({ ok: true });
});

app.post('/api/clips/:file/rename', (req, res) => {
  const fromFile = path.basename(req.params.file);
  const from = path.join(CLIPS_DIR, fromFile);
  const ext = path.extname(fromFile).toLowerCase();
  const toName = sanitizeName(String(req.body.name || '').replace(/\.(mp4|gif|jpe?g|png)$/i, ''));
  if (!fs.existsSync(from)) return res.status(404).json({ error: 'not found' });
  if (!toName) return res.status(400).json({ error: 'invalid name' });
  const to = path.join(CLIPS_DIR, toName + ext);
  if (fs.existsSync(to)) return res.status(400).json({ error: 'a clip with that name already exists' });
  fs.renameSync(from, to);
  res.json({ ok: true, file: toName + ext });
});

app.post('/api/clips/:file/gif', (req, res) => {
  try { res.json({ ok: true, jobId: gifExport(path.basename(req.params.file)).id }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/clips/:file/thumb', (req, res) => {
  try { res.json({ ok: true, jobId: thumbExport(path.basename(req.params.file), Number(req.body.at) || 1).id }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/clips/:file/trim', (req, res) => {
  try { res.json({ ok: true, jobId: trimClip(path.basename(req.params.file), req.body.start, req.body.end).id }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/clips/:file/edit', (req, res) => {
  try { res.json({ ok: true, jobId: editClip(path.basename(req.params.file), req.body || {}).id }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// --- YouTube publishing ---
app.get('/api/youtube/status', (req, res) => {
  const cfg = loadYT();
  res.json({
    configured: !!(cfg.clientId && cfg.clientSecret),
    connected: !!(cfg.tokens && cfg.tokens.refresh_token),
    channel: cfg.channel || null,
    redirectUri: YT_REDIRECT,
  });
});

app.post('/api/youtube/config', (req, res) => {
  const clientId = String(req.body.clientId || '').trim();
  const clientSecret = String(req.body.clientSecret || '').trim();
  if (!clientId || !clientSecret) return res.status(400).json({ error: 'Client ID and Client Secret are both required' });
  const cfg = loadYT(); cfg.clientId = clientId; cfg.clientSecret = clientSecret; saveYT(cfg);
  res.json({ ok: true });
});

app.get('/api/youtube/auth', (req, res) => {
  const cfg = loadYT();
  if (!cfg.clientId) return res.status(400).send('Add your Google Client ID and Secret first.');
  const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: cfg.clientId, redirect_uri: YT_REDIRECT, response_type: 'code',
    scope: YT_SCOPES, access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true',
  });
  res.redirect(url);
});

app.get('/api/youtube/callback', async (req, res) => {
  try {
    if (req.query.error) throw new Error(String(req.query.error));
    if (!req.query.code) throw new Error('no authorization code');
    await ytExchangeCode(String(req.query.code));
    const ch = await ytFetchChannel();
    const cfg = loadYT(); cfg.channel = ch; saveYT(cfg);
    res.redirect('/app.html?yt=connected');
  } catch (e) { res.redirect('/app.html?yt=error&msg=' + encodeURIComponent(e.message || 'connection failed')); }
});

app.post('/api/youtube/disconnect', (req, res) => {
  const cfg = loadYT(); delete cfg.tokens; delete cfg.channel; saveYT(cfg); res.json({ ok: true });
});

app.post('/api/clips/:file/publish', (req, res) => {
  try { res.json({ ok: true, jobId: publishToYouTube(path.basename(req.params.file), req.body || {}).id }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/clips/:file/enhance', (req, res) => {
  try { res.json({ ok: true, jobId: enhanceSpeech(path.basename(req.params.file)).id }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/clips/:file/upscale', (req, res) => {
  try { res.json({ ok: true, jobId: upscaleClip(path.basename(req.params.file), String(req.body.target || '1080')).id }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/clips/:file/shorts', (req, res) => {
  try { res.json({ ok: true, jobId: autoShorts(path.basename(req.params.file), req.body.count).id }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/shorts/url', (req, res) => {
  try { res.json({ ok: true, jobId: autoShortsFromUrl(String(req.body.url || '').trim(), req.body.count).id }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// Import a local video file straight into the clip library (hero Upload button).
app.post('/api/clips/import', express.raw({ type: () => true, limit: '600mb' }), (req, res) => {
  try {
    if (!req.body || !req.body.length) return res.status(400).json({ error: 'empty upload' });
    const name = sanitizeName(String(req.query.name || '').replace(/\.[^.]+$/, '')) || tsName('import');
    const out = path.join(CLIPS_DIR, name + '.mp4');
    fs.writeFileSync(out, req.body);
    res.json({ ok: true, file: name + '.mp4' });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Upload an overlay image/video or a music track. Raw binary body; ?ext=.png.
const UP_EXT = { image: '.png', '.png': '.png', '.jpg': '.jpg', '.jpeg': '.jpg', '.gif': '.gif', '.webp': '.webp', '.mp4': '.mp4', '.mov': '.mp4', '.webm': '.webm', '.mp3': '.mp3', '.m4a': '.m4a', '.aac': '.aac', '.wav': '.wav', '.ogg': '.ogg' };
app.post('/api/upload', express.raw({ type: () => true, limit: '120mb' }), (req, res) => {
  try {
    if (!req.body || !req.body.length) return res.status(400).json({ error: 'empty upload' });
    let ext = String(req.query.ext || '').toLowerCase();
    if (!ext.startsWith('.')) ext = '.' + ext;
    ext = UP_EXT[ext] || (/^(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.mp4|\.mov|\.webm|\.mp3|\.m4a|\.aac|\.wav|\.ogg)$/.test(ext) ? ext : '.bin');
    const name = `asset_${Date.now()}_${crypto.randomBytes(3).toString('hex')}${ext}`;
    fs.writeFileSync(path.join(ASSETS_DIR, name), req.body);
    res.json({ ok: true, file: name });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/clips/:file/vertical', (req, res) => {
  try {
    const job = verticalExport(path.basename(req.params.file));
    res.json({ ok: true, jobId: job.id });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`DAWASSI AI CLIPPER running → http://localhost:${PORT}`);
  console.log(`Clips folder: ${CLIPS_DIR}`);
});
