@echo off
REM DAWASSI AI CLIPPER - one-command setup for Windows.
REM Needs: Node.js 18+ (nodejs.org) and Python 3 (python.org, "Add to PATH" checked).
cd /d "%~dp0"
if not exist bin mkdir bin

echo ==^> Installing node dependencies...
call npm install --no-audit --no-fund
if errorlevel 1 goto :fail

echo ==^> Installing yt-dlp (pip)...
python -m pip install --user yt-dlp
if errorlevel 1 (
  echo ==^> pip failed, downloading standalone yt-dlp.exe instead...
  curl -fL -o bin\yt-dlp.exe https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe
  if errorlevel 1 goto :fail
)

echo ==^> Checking ffmpeg...
where ffmpeg >nul 2>nul
if %errorlevel%==0 goto :ffmpeg_ok
if exist bin\ffmpeg.exe goto :ffmpeg_ok

echo ==^> Downloading ffmpeg (via npm registry)...
set "FFTMP=%TEMP%\dawassi-ffmpeg"
if exist "%FFTMP%" rmdir /s /q "%FFTMP%"
mkdir "%FFTMP%"
pushd "%FFTMP%"
call npm pack @ffmpeg-installer/win32-x64 --silent
for %%f in (*.tgz) do tar -xzf "%%f"
popd
copy /y "%FFTMP%\package\ffmpeg.exe" bin\ffmpeg.exe >nul
rmdir /s /q "%FFTMP%"
bin\ffmpeg.exe -version >nul 2>nul
if errorlevel 1 goto :fail

:ffmpeg_ok
echo.
echo ============================================
echo  Setup complete!
echo  Start the app: double-click "Start DAWASSI AI CLIPPER.bat"
echo  Then open http://localhost:3547
echo ============================================
pause
exit /b 0

:fail
echo.
echo Setup failed. Make sure Node.js and Python 3 are installed and on PATH,
echo then run this file again.
pause
exit /b 1
