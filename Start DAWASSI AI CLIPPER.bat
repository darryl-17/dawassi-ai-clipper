@echo off
REM Double-click to launch DAWASSI AI CLIPPER.
cd /d "%~dp0"
start "" http://localhost:3547
node server.js
pause
