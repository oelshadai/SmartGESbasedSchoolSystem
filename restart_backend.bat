@echo off
echo Restarting Django server with fixes...
cd /d "C:\Users\DELL\Desktop\school sasa report\backend"

echo Killing any existing Django processes...
taskkill /f /im python.exe 2>nul

echo Starting Django development server...
python manage.py runserver 0.0.0.0:8000

pause