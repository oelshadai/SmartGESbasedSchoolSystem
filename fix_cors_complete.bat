@echo off
echo ========================================
echo CORS Issue Fix - Complete Solution
echo ========================================

echo.
echo Step 1: Stopping any running Django processes...
taskkill /f /im python.exe 2>nul
timeout /t 2 >nul

echo.
echo Step 2: Starting Django backend with CORS enabled...
cd backend
echo Starting Django server on http://localhost:8000
start "Django Backend" cmd /k "python manage.py runserver 8000"

echo.
echo Step 3: Waiting for backend to start...
timeout /t 5 >nul

echo.
echo Step 4: Starting React frontend...
cd ..\frontend
echo Starting React frontend on http://localhost:8080
start "React Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo CORS Fix Complete!
echo ========================================
echo Backend: http://localhost:8000
echo Frontend: http://localhost:8080
echo.
echo Both servers are now running with proper CORS configuration.
echo You can now test your application.
echo.
pause