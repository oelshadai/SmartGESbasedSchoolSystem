@echo off
title School Report SaaS - Server Startup
color 0A

echo ========================================
echo    School Report SaaS - Server Startup
echo ========================================
echo.

echo [1/4] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)
echo ✓ Python is installed

echo.
echo [2/4] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    pause
    exit /b 1
)
echo ✓ Node.js is installed

echo.
echo [3/4] Starting Backend Server...
echo Backend will be available at: http://localhost:8000
echo API endpoints will be at: http://localhost:8000/api
echo.

start "Backend Server" cmd /k "cd backend && echo Starting Django Backend... && python manage.py runserver 0.0.0.0:8000"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo [4/4] Starting Frontend Server...
echo Frontend will be available at: http://localhost:8080
echo.

start "Frontend Server" cmd /k "cd frontend && echo Starting Frontend Development Server... && npm run dev"

echo.
echo ========================================
echo    Both servers are starting up!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:8080
echo.
echo Press any key to close this window...
echo (The servers will continue running in separate windows)
pause >nul