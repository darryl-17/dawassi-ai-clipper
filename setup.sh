#!/bin/bash
# DAWASSI AI CLIPPER — one-command setup.
# Installs node deps, yt-dlp, and a working ffmpeg into ./bin (no Homebrew needed).
set -e
cd "$(dirname "$0")"
mkdir -p bin

echo "==> Installing node dependencies…"
npm install --no-audit --no-fund

# ---------- yt-dlp ----------
if python3 -m yt_dlp --version >/dev/null 2>&1 || [ -x bin/yt-dlp ]; then
  echo "==> yt-dlp already available."
else
  echo "==> Installing yt-dlp (pip)…"
  if ! python3 -m pip install --user yt-dlp; then
    echo "==> pip failed, downloading standalone binary instead…"
    case "$(uname -s)" in
      Darwin) YT_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos";;
      *)      YT_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";;
    esac
    curl -fL -C - -o bin/yt-dlp "$YT_URL"
    chmod +x bin/yt-dlp
  fi
fi

# ---------- ffmpeg ----------
if command -v ffmpeg >/dev/null 2>&1 || [ -x bin/ffmpeg ] && bin/ffmpeg -version >/dev/null 2>&1; then
  echo "==> ffmpeg already available."
else
  echo "==> Downloading ffmpeg (via npm registry — fast on most networks)…"
  case "$(uname -s)-$(uname -m)" in
    Darwin-arm64)  PKG="@ffmpeg-installer/darwin-arm64";;
    Darwin-x86_64) PKG="@ffmpeg-installer/darwin-x64";;
    Linux-x86_64)  PKG="@ffmpeg-installer/linux-x64";;
    Linux-aarch64) PKG="@ffmpeg-installer/linux-arm64";;
    *) echo "Unsupported platform — install ffmpeg yourself and put it on PATH."; exit 1;;
  esac
  TMP=$(mktemp -d)
  ( cd "$TMP" && npm pack "$PKG" --silent && tar -xzf ./*.tgz )
  cp "$TMP/package/ffmpeg" bin/ffmpeg
  rm -rf "$TMP"
  chmod +x bin/ffmpeg
  if [ "$(uname -s)" = "Darwin" ]; then
    # macOS kills unsigned arm64 binaries — clear attrs and ad-hoc sign the copy
    xattr -c bin/ffmpeg 2>/dev/null || true
    codesign --sign - --force bin/ffmpeg 2>/dev/null || true
  fi
  bin/ffmpeg -version >/dev/null 2>&1 && echo "==> ffmpeg OK." || { echo "ffmpeg failed to run"; exit 1; }
fi

echo ""
echo "✅ Setup complete. Start the app with:  node server.js"
echo "   Then open http://localhost:3547"
