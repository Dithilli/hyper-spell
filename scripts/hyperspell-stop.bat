@echo off
REM Stops the HyperSpell server on Windows.
taskkill /f /fi "WINDOWTITLE eq HyperSpell server*" >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8787" ^| findstr "LISTENING"') do taskkill /f /pid %%p >nul 2>&1
echo HyperSpell server stopped.
timeout /t 2 /nobreak >nul
