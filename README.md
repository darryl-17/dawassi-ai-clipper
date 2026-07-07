# DAWASSI AI CLIPPER

Local Twitch & YouTube clipping app — built for clipping live streams (e.g. Kai Cenat's Streamer University) and VODs. Brand: white primary, orange (#E4571E) secondary.

## Quick start (fresh clone)

**Requirements:** [Node.js 18+](https://nodejs.org) and [Python 3](https://python.org) (on Windows, check "Add python.exe to PATH" during install).

**Mac / Linux:**
```bash
git clone https://github.com/darryl-17/dawassi-ai-clipper
cd dawassi-ai-clipper
./setup.sh        # installs node deps + yt-dlp + ffmpeg (no Homebrew needed)
node server.js
```

**Windows:**
1. Download the project (green **Code** button → Download ZIP → extract), or `git clone` it
2. Double-click **`setup.bat`** (installs everything automatically)
3. Double-click **`Start DAWASSI AI CLIPPER.bat`**

Then open **http://localhost:3547** in your browser.

On Mac you can also double-click **`Start DAWASSI AI CLIPPER.command`** in Finder.

## Features at a glance

- 🔴 Rolling 2-hour live buffer (Twitch + YouTube), instant no-re-encode clips
- ⌨️ Keyboard shortcuts while recording: **1**=30s, **2**=1min, **3**=2min, **5**=5min, **M**=mark, **C**=clip from mark
- ✂️ VOD section downloads by timestamp (only the part you need)
- 📱 One-click vertical 9:16 export (1080×1920) for TikTok/Shorts/Reels
- 🎨 Orange (default) and black themes, remembered per browser
- 🔒 100% local — nothing leaves your machine

## Live stream clipping (the main workflow)

1. Paste the stream URL (e.g. `https://twitch.tv/kaicenat` or a YouTube live URL) and press **Start buffering** — do this at the *start* of the stream, before the moments happen.
2. The app records a rolling buffer (up to 2 hours of history) on disk.
3. When something clip-worthy happens, press **Clip last 30s / 1 min / 2 min / 5 min** — the clip is cut instantly (no re-encoding) and saved to `clips/`.
4. Or press **⚑ Mark start** when a moment begins and **✂ Clip from mark** when it ends, for an exact-length clip.
5. Press **Stop** when the stream is over — the buffer is cleaned up automatically on next launch.

## VOD clipping

Paste any YouTube video / Twitch VOD URL plus a start and end time (`1:23:45` format or seconds). Only that section is downloaded, not the whole video.

## Clip library

Every clip appears at the bottom of the page with a preview player and buttons to:
- **Download** the MP4
- **Vertical 9:16** — auto center-crop to 1080×1920 for TikTok / Shorts / Reels
- **Rename** / **Delete**

Clips live in the `clips/` folder as normal MP4 files — drag them into CapCut/Premiere or upload directly.

## Notes for this machine / connection

- **Twitch live works great** — your ISP's route to Twitch's CDN is fast. This is the main use case (Kai streams on Twitch).
- **YouTube live is unreliable here** — your ISP heavily throttles Google's video CDN (googlevideo.com), so live YouTube buffering may fail or stall. YouTube **VODs still work**, just slowly. If Streamer University is also on YouTube, clip from the Twitch stream live and the YouTube VOD afterwards.
- On this connection choose **480p or 720p max** for live buffering — "Best quality" may download slower than real time and cause gaps.
- Clips come out a few seconds longer than requested (a little context before the moment) — trim in CapCut if needed.
- The clips currently in the library are test clips from the build — delete them freely.

## Notes

- Everything runs 100% locally; nothing is uploaded anywhere.
- Live clips are ~10–30 s behind real time (normal HLS delay), so "last 60 s" means the last 60 s *you saw*.
- On Twitch, if you're not subscribed to the channel, ad breaks may appear inside the recording.
- The live buffer uses roughly 2–3 GB per hour at 1080p. Keep some free disk space.
- If a stream hiccups or the connection drops, the recorder reconnects automatically.
- Tools used under the hood: `ffmpeg` (bundled via npm) and `yt-dlp` (in `bin/`). To update yt-dlp later (sites change their formats sometimes): `./bin/yt-dlp -U`.

## Personal use

This tool is for making clips for commentary/reaction content. Respect the platforms' terms and creators' rights — clipping for fair-use commentary is common practice, but rebroadcasting entire streams is not.
