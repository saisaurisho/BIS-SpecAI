@echo off
title BIS-SpecAI Launcher
cd /d "%~dp0"
echo ========================================================
echo Launching BIS-SpecAI (Backend + Frontend)
echo ========================================================

start "BIS Backend (FastAPI)" cmd /k "call run_backend.bat"
timeout /t 3 /nobreak >nul
start "BIS Frontend (Next.js)" cmd /k "call run_frontend.bat"

echo.
echo Both servers have been launched in separate windows!
echo - Backend API:  http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)
echo - Frontend App: http://localhost:3000
echo.
timeout /t 5
