@echo off
title School Report SaaS - Start All
color 0B
setlocal

set ROOT=%~dp0
set BACKEND=%ROOT%backend
set FRONTEND=%ROOT%frontend
set VENV=%ROOT%.venv

echo ============================================
echo   School Report SaaS - Dev Environment
echo ============================================
echo.

:: ── 1. Check Python ──────────────────────────
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found in PATH. Install from https://python.org
    pause & exit /b 1
)
echo [OK] Python found

:: ── 2. Check Node.js ─────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found in PATH. Install from https://nodejs.org
    pause & exit /b 1
)
echo [OK] Node.js found

:: ── 3. Activate virtual environment ──────────
if exist "%VENV%\Scripts\activate.bat" (
    call "%VENV%\Scripts\activate.bat"
    echo [OK] Virtual environment activated
) else (
    echo [INFO] No .venv found - creating one...
    python -m venv "%VENV%"
    call "%VENV%\Scripts\activate.bat"
    echo [OK] Virtual environment created and activated
)

:: ── 4. Install / sync backend dependencies ───
echo.
echo [1/4] Installing backend dependencies...
cd /d "%BACKEND%"
pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo [ERROR] pip install failed
    pause & exit /b 1
)
echo [OK] Backend dependencies ready

:: ── 5. Apply migrations ───────────────────────
echo.
echo [2/4] Running database migrations...
cd /d "%BACKEND%"
python manage.py migrate --run-syncdb
if %errorlevel% neq 0 (
    echo [ERROR] Migrations failed
    pause & exit /b 1
)
echo [OK] Database up to date

:: ── 6. Install frontend dependencies ─────────
echo.
echo [3/4] Installing frontend dependencies...
cd /d "%FRONTEND%"
if not exist "node_modules" (
    echo [INFO] node_modules not found - running npm install...
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed
        pause & exit /b 1
    )
) else (
    echo [OK] node_modules already present
)

:: ── 7. Launch servers in separate windows ────
echo.
echo [4/4] Launching servers...
echo.

start "Backend  - http://localhost:8000" cmd /k "title Backend Server && color 0A && cd /d "%BACKEND%" && call "%VENV%\Scripts\activate.bat" && echo. && echo  Backend running at http://127.0.0.1:8000 && echo  Press Ctrl+C to stop && echo. && python manage.py runserver"

:: Brief pause so Django starts before the browser might open
timeout /t 4 /nobreak >nul

start "Frontend - http://localhost:5173" cmd /k "title Frontend Server && color 0D && cd /d "%FRONTEND%" && echo. && echo  Frontend running at http://localhost:5173 && echo  Press Ctrl+C to stop && echo. && npm run dev"

echo.
echo ============================================
echo  Backend  : http://127.0.0.1:8000
echo  Frontend : http://localhost:5173
echo  Admin    : http://127.0.0.1:8000/admin
echo  API docs : http://127.0.0.1:8000/api
echo ============================================
echo.
echo Both servers are starting in separate windows.
echo Close those windows to stop the servers.
echo.
pause
endlocal
