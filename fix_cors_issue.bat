@echo off
echo Fixing CORS issue...
echo.

echo Step 1: Stopping any running Django processes...
taskkill /f /im python.exe 2>nul
timeout /t 2 >nul

echo Step 2: Starting Django backend with CORS enabled...
cd backend
python manage.py runserver 127.0.0.1:8000

pause