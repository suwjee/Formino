@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js 24+ is required.
 pause
 exit /b 1
)
echo === Formino FINAL: research plan + adaptive coach ===
node --no-warnings verify-final.js
if errorlevel 1 goto failed
echo === Formino FINAL: session clock ===
node --no-warnings verify-clocks.js
if errorlevel 1 goto failed
echo === Formino FINAL: audio alert ===
node --no-warnings verify-audio.js
if errorlevel 1 goto failed
echo ALL CHECKS PASSED.
pause
exit /b 0
:failed
echo A CHECK FAILED. Do not use until reviewed.
pause
exit /b 1
