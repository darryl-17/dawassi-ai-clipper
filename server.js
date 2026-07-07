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
const SEG_SECONDS = 4;            // segment length of the live buffer
const BUFFER_MINUTES = 120;       // how much live history to keep on disk
const PORT = Number(process.env.PORT) || 3547;

for (const d of [BUFFER_DIR, CLIPS_DIR]) fs.mkdirSync(d, { recursive: true });

const app = express();
app.use(express.json());
app.use(express.static(path.join(ROOT, 'public')));
app.use('/clips', express.static(CLIPS_DIR));

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

const live = {
  status: 'idle',        // idle | resolving | recording | error
  url: null,
  title: null,
  quality: null,
  error: null,
  proc: null,
  segDir: null,
  startedAt: null,
  markAt: null,          // Date.now() when "mark" was pressed
  restarts: 0,
  stopRequested: false,
  nextSegStart: 0,
};

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

function listSegments() {
  if (!live.segDir || !fs.existsSync(live.segDir)) return [];
  return fs.readdirSync(live.segDir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => {
      const st = fs.statSync(path.join(live.segDir, f));
      return { file: path.join(live.segDir, f), mtime: st.mtimeMs, size: st.size };
    })
    .sort((a, b) => a.mtime - b.mtime);
}

function spawnRecorder(mediaUrl) {
  const args = [
    '-hide_banner', '-loglevel', 'warning',
    '-reconnect', '1', '-reconnect_streamed', '1', '-reconnect_delay_max', '10',
    '-i', mediaUrl,
    '-map', '0', '-c', 'copy',
    '-f', 'segment',
    '-segment_time', String(SEG_SECONDS),
    '-reset_timestamps', '1',
    '-segment_start_number', String(live.nextSegStart),
    '-segment_format', 'mpegts',
    path.join(live.segDir, 'seg_%08d.ts'),
  ];
  const proc = spawn(FFMPEG, args);
  live.proc = proc;
  proc.stderr.on('data', () => {});
  proc.on('close', async () => {
    live.proc = null;
    if (live.stopRequested) { live.status = 'idle'; return; }
    // Stream hiccup or expired playlist token: re-resolve and resume.
    if (live.restarts >= 20) {
      live.status = 'error';
      live.error = 'recorder stopped too many times — stream probably ended';
      return;
    }
    live.restarts++;
    const segs = listSegments();
    live.nextSegStart = segs.length ? Number(path.basename(segs[segs.length - 1].file).match(/(\d+)/)[1]) + 1 : 0;
    await new Promise((r) => setTimeout(r, 3000));
    if (live.stopRequested) { live.status = 'idle'; return; }
    try {
      const { mediaUrl: fresh } = await resolveStream(live.url, live.quality);
      spawnRecorder(fresh);
    } catch (e) {
      live.status = 'error';
      live.error = 'stream ended or unreachable: ' + e.message;
    }
  });
}

async function startLive(url, quality) {
  if (live.status === 'recording' || live.status === 'resolving') throw new Error('already recording — stop first');
  live.status = 'resolving';
  live.url = url;
  live.quality = quality || 'best';
  live.error = null;
  live.markAt = null;
  live.restarts = 0;
  live.stopRequested = false;
  live.nextSegStart = 0;
  live.segDir = path.join(BUFFER_DIR, 'live_' + Date.now());
  fs.mkdirSync(live.segDir, { recursive: true });
  try {
    const { title, mediaUrl } = await resolveStream(url, live.quality);
    live.title = title;
    live.startedAt = Date.now();
    live.status = 'recording';
    spawnRecorder(mediaUrl);
  } catch (e) {
    live.status = 'error';
    live.error = e.message;
    throw e;
  }
}

function stopLive() {
  live.stopRequested = true;
  if (live.proc) live.proc.kill('SIGINT');
  live.status = 'idle';
}

// Trim old segments so the buffer doesn't eat the disk.
setInterval(() => {
  if (!live.segDir) return;
  const cutoff = Date.now() - BUFFER_MINUTES * 60 * 1000;
  for (const s of listSegments()) if (s.mtime < cutoff) { try { fs.unlinkSync(s.file); } catch (_) {} }
}, 60 * 1000);

// Clean abandoned buffer dirs from previous runs on boot.
for (const d of fs.readdirSync(BUFFER_DIR)) {
  const full = path.join(BUFFER_DIR, d);
  try { fs.rmSync(full, { recursive: true, force: true }); } catch (_) {}
}

async function clipLive({ seconds, fromMark, name }) {
  if (live.status !== 'recording') throw new Error('not recording a live stream');
  const segs = listSegments();
  if (segs.length < 2) throw new Error('buffer is still warming up — wait a few seconds');
  const usable = segs.slice(0, -1); // last segment is still being written
  // Segment mtimes are unreliable on slow links (data arrives in bursts), but
  // each segment holds ~SEG_SECONDS of video — so select by count, not clock.
  let wantSeconds;
  if (fromMark) {
    if (!live.markAt) throw new Error('no mark set');
    wantSeconds = (Date.now() - live.markAt) / 1000;
  } else {
    wantSeconds = seconds || 60;
  }
  const count = Math.min(usable.length, Math.ceil(wantSeconds / SEG_SECONDS) + 1);
  const chosen = usable.slice(-count);
  if (!chosen.length) throw new Error('no buffered video in that window yet');

  const base = sanitizeName(name) || tsName(fromMark ? 'marked' : `last${seconds}s`);
  const out = path.join(CLIPS_DIR, base + '.mp4');
  const listFile = path.join(BUFFER_DIR, `concat_${Date.now()}.txt`);
  fs.writeFileSync(listFile, chosen.map((s) => `file '${s.file.replace(/'/g, "'\\''")}'`).join('\n'));

  const job = newJob('live-clip', `Clip: ${base}.mp4 (${fromMark ? 'from mark' : 'last ' + seconds + 's'})`);
  try {
    // Twitch TS carries a timed_id3 data stream MP4 can't hold — take A/V only.
    await runFfmpeg(['-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0',
      '-i', listFile, '-map', '0:v', '-map', '0:a', '-c', 'copy', '-movflags', '+faststart', '-y', out]);
    job.status = 'done';
    job.output = base + '.mp4';
    if (fromMark) live.markAt = null;
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

// ---------------------------------------------------------------- API

app.get('/api/status', (req, res) => {
  const segs = live.status === 'recording' ? listSegments() : [];
  res.json({
    live: {
      status: live.status,
      url: live.url,
      title: live.title,
      error: live.error,
      startedAt: live.startedAt,
      markAt: live.markAt,
      bufferedSeconds: segs.length ? Math.max(0, (segs.length - 1) * SEG_SECONDS) : 0,
      bufferBytes: segs.reduce((a, s) => a + s.size, 0),
      bufferMinutesMax: BUFFER_MINUTES,
    },
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
    await startLive(String(req.body.url || '').trim(), String(req.body.quality || 'best'));
    res.json({ ok: true, title: live.title });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/live/stop', (req, res) => { stopLive(); res.json({ ok: true }); });

app.post('/api/live/mark', (req, res) => {
  if (live.status !== 'recording') return res.status(400).json({ error: 'not recording' });
  live.markAt = Date.now();
  res.json({ ok: true });
});

app.post('/api/live/clip', async (req, res) => {
  try {
    const file = await clipLive({
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
    .filter((f) => f.toLowerCase().endsWith('.mp4'))
    .map((f) => {
      const st = fs.statSync(path.join(CLIPS_DIR, f));
      return { file: f, size: st.size, mtime: st.mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
  await Promise.all(files.map(async (f) => { f.duration = await clipDuration(f.file, f.mtime); }));
  res.json(files);
});

app.delete('/api/clips/:file', (req, res) => {
  const f = path.join(CLIPS_DIR, path.basename(req.params.file));
  if (!fs.existsSync(f)) return res.status(404).json({ error: 'not found' });
  fs.unlinkSync(f);
  res.json({ ok: true });
});

app.post('/api/clips/:file/rename', (req, res) => {
  const from = path.join(CLIPS_DIR, path.basename(req.params.file));
  const toName = sanitizeName(String(req.body.name || '').replace(/\.mp4$/i, ''));
  if (!fs.existsSync(from)) return res.status(404).json({ error: 'not found' });
  if (!toName) return res.status(400).json({ error: 'invalid name' });
  const to = path.join(CLIPS_DIR, toName + '.mp4');
  if (fs.existsSync(to)) return res.status(400).json({ error: 'a clip with that name already exists' });
  fs.renameSync(from, to);
  res.json({ ok: true, file: toName + '.mp4' });
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
