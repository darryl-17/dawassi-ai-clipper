#!/bin/zsh
# Double-click this file to launch Clip Studio.
cd "$(dirname "$0")"
open "http://localhost:3547" 2>/dev/null || true
exec node server.js
