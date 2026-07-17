@echo off
echo Starting Django server...
cd "c:\Users\ADMIN\Desktop\school sasa report\backend"
start /B python manage.py runserver 127.0.0.1:8000

echo Waiting for server to start...
timeout /t 5 /nobreak > nul

echo Testing student login...
cd ..
python test_login_fix.py

echo.
echo Server is running at http://127.0.0.1:8000
echo Try logging in from your React app now.
pause