@echo off
title School Report SaaS - Complete Setup
color 0B

echo ==========================================
echo    School Report SaaS - Complete Setup
echo ==========================================
echo.

echo This script will:
echo 1. Check system requirements
echo 2. Create test users (if needed)
echo 3. Start backend server
echo 4. Start frontend server
echo 5. Open application in browser
echo.
echo Press any key to continue...
pause >nul

echo.
echo [1/6] Checking system requirements...
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)
echo ✅ Python is installed

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js is installed

echo.
echo [2/6] Setting up database and test users...
echo.

cd backend
echo Creating test users for login...
python create_test_users.py
if %errorlevel% neq 0 (
    echo ⚠️  Warning: Could not create test users automatically
    echo You may need to create users manually
)

echo.
echo [3/6] Installing dependencies (if needed)...
echo.

REM Check if node_modules exists in frontend
if not exist "..\frontend\node_modules" (
    echo Installing frontend dependencies...
    cd ..\frontend
    npm install
    cd ..\backend
)

echo.
echo [4/6] Starting Backend Server...
echo.

echo Backend will be available at: http://localhost:8000
echo API endpoints will be at: http://localhost:8000/api
echo.

start "Backend Server - School Report SaaS" cmd /k "title Backend Server && color 0A && echo ===== BACKEND SERVER ===== && echo Server: http://localhost:8000 && echo API: http://localhost:8000/api && echo ========================== && echo. && python manage.py runserver 0.0.0.0:8000"

echo Waiting for backend to initialize...
timeout /t 8 /nobreak >nul

echo.
echo [5/6] Starting Frontend Server...
echo.

cd ..\frontend
echo Frontend will be available at: http://localhost:8080
echo.

start "Frontend Server - School Report SaaS" cmd /k "title Frontend Server && color 0E && echo ===== FRONTEND SERVER ===== && echo Server: http://localhost:8080 && echo =========================== && echo. && npm run dev"

echo Waiting for frontend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo [6/6] Opening application in browser...
echo.

timeout /t 3 /nobreak >nul
start http://localhost:8080

cd ..

echo.
echo ==========================================
echo    🎉 SETUP COMPLETE! 🎉
echo ==========================================
echo.
echo Your School Report SaaS application is now running:
echo.
echo 🌐 Frontend: http://localhost:8080
echo 🔧 Backend:  http://localhost:8000
echo 📡 API:      http://localhost:8000/api
echo.
echo 👤 Test Login Credentials:
echo    Admin:   admin@school.edu / password123
echo    Teacher: teacher@school.edu / password123  
echo    Student: std_STD001 / password123
echo.
echo 📋 Troubleshooting:
echo    - If login fails, check LOGIN_TROUBLESHOOTING.md
echo    - Both server windows should remain open
echo    - Check browser console (F12) for errors
echo.
echo Press any key to close this setup window...
echo (The servers will continue running)
pause >nul