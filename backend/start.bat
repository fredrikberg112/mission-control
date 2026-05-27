@echo off
echo Starting Mission Control Backend...
echo.
cd /d "%~dp0"
set MC_API_KEY=mission-control-local
node server.js
pause