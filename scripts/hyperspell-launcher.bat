@echo off
REM HyperSpell launcher for Windows — double-click to put a game up.
REM Starts the game server (the match runs ON the server now), copies a
REM ready-to-paste invite to the clipboard, and opens the game.
REM Needs Node.js installed (nodejs.org).
REM Lives in the repo's scripts\ folder; make a Desktop SHORTCUT to it
REM (right-click, Send to, Desktop) rather than copying the file.
setlocal enabledelayedexpansion
cd /d "%~dp0..\server" || (echo Can't find the server folder & pause & exit /b 1)

if not exist node_modules (
  echo First run — installing dependencies...
  call npm install --silent
)

netstat -ano | findstr ":8787" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
  start "HyperSpell server" /min cmd /c "node serve.js > %TEMP%\hyperspell-server.log 2>&1"
  timeout /t 2 /nobreak >nul
)

for /f %%a in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp,Manual | Where-Object { $_.IPAddress -notlike '169.*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -First 1).IPAddress"') do set IP=%%a
set URL=http://%IP%:8787

(
  echo 🧙 HYPERSPELL time! Join the fight: %URL%
  echo ^(type it WITH the http:// — Chrome gets weird otherwise^)
  echo Type your wizard name and click PLAY ONLINE — you're in.
) | clip

start http://localhost:8787

echo.
echo   HYPERSPELL is live
echo.
echo   You:          http://localhost:8787   (opening now — click PLAY ONLINE)
echo   Players:      %URL%
echo.
echo   The invite is on your clipboard — just paste it in Slack.
echo   Server log:   %TEMP%\hyperspell-server.log
echo.
echo   You can close this window — the server keeps running.
echo   To stop it later: run hyperspell-stop.bat
echo.
pause
