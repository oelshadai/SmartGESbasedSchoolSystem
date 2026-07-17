@echo off
echo Restarting Backend Server with CORS fixes...
echo.
echo Backend will be available at: http://localhost:8000
echo Frontend should connect from: http://localhost:8080
echo.
cd backend
echo Killing any existing Django processes...
taskkill /f /im python.exe 2>nul
timeout /t 2 /nobreak >nul
echo.
echo Starting Django development server...
python manage.py runserver 8000
pause