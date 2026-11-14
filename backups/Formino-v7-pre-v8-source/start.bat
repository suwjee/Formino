@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Please install Node.js 24+ from https://nodejs.org/
  pause
  exit /b 1
)
if exist "formino-port.txt" del /q "formino-port.txt" >nul 2>&1
start "Formino local server" cmd /k "node --no-warnings server.js"
set "FORMINO_PORT="
for /l %%i in (1,1,20) do (
  if exist "formino-port.txt" goto :open_app
  timeout /t 1 /nobreak >nul
)
echo Formino did not start. Check the other window for errors.
pause
exit /b 1
:open_app
set /p FORMINO_PORT=<"formino-port.txt"
start "" "http://127.0.0.1:%FORMINO_PORT%"
echo Formino is running at http://127.0.0.1:%FORMINO_PORT%
