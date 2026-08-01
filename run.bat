@echo off
setlocal
set ROOT=%~dp0

if not exist "%ROOT%backend\venv\Scripts\uvicorn.exe" (
    echo [ERROR] backend\venv not found. Run: cd backend ^&^& python -m venv venv ^&^& venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

rem A stale Backend/Frontend window from a previous run silently keeps
rem serving old code on these ports even after you think you've restarted -
rem catch that here instead of a confusing "Network Error" in the browser.
netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul
if not errorlevel 1 (
    echo [WARNING] Port 8000 is already in use.
    echo A previous Backend window is probably still running with old code.
    echo Close that window first, then re-run this script.
    pause
    exit /b 1
)
netstat -ano | findstr ":5173 " | findstr "LISTENING" >nul
if not errorlevel 1 (
    echo [WARNING] Port 5173 is already in use.
    echo A previous Frontend window is probably still running.
    echo Close that window first, then re-run this script.
    pause
    exit /b 1
)

start "Backend (FastAPI)" cmd /k "cd /d %ROOT%backend && venv\Scripts\uvicorn.exe app.main:app --reload --port 8000"
start "Frontend (Vite)" cmd /k "cd /d %ROOT%frontend && npm run dev"

echo Backend:  http://localhost:8000/docs
echo Frontend: http://localhost:5173
