@echo off
echo Starting Both Development Servers...
echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && python manage.py runserver"
timeout /t 3 /nobreak > nul
echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"
echo.
echo Both servers are starting...
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:8080
pause