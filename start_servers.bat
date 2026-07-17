@echo off
echo Starting School Report SaaS Development Servers...
echo.

REM Create test student first
echo Creating test student...
cd backend
python ..\create_test_student_quick.py
echo.

REM Start backend server in a new window
echo Starting Backend Server (Django)...
start "Backend Server" cmd /k "cd backend && python manage.py runserver 8000"

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend server in a new window
echo Starting Frontend Server (Vite)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Test Student Credentials:
echo Username: std_test123
echo Password: password123
echo.
pause