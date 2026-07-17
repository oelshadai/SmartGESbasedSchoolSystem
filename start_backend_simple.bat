@echo off
echo Starting Django Backend Server...
echo Backend will be available at: http://localhost:8000
echo API endpoints will be at: http://localhost:8000/api
echo.
cd backend
python manage.py runserver 0.0.0.0:8000
pause