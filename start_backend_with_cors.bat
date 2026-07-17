@echo off
echo Starting Backend Server with CORS enabled...
cd backend
echo Checking Django configuration...
python manage.py check
if %errorlevel% neq 0 (
    echo Django check failed!
    pause
    exit /b 1
)
echo Starting Django development server...
python manage.py runserver 0.0.0.0:8000
pause