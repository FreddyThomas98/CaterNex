@echo off
title CaterNex ERP Server
echo ===================================================
echo Starting CaterNex ERP Server...
echo URL: http://127.0.0.1:8000
echo Keep this window open while using the application.
echo ===================================================
cd /d "%~dp0backend\app"
python -m uvicorn main:app --host 127.0.0.1 --port 8000
pause
