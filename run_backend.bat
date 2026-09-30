@echo off
title BIS-SpecAI Backend (FastAPI)
cd /d "%~dp0"
echo ========================================================
echo Starting BIS-SpecAI Backend Server on http://127.0.0.1:8000
echo ========================================================
call .venv\Scripts\activate
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause
