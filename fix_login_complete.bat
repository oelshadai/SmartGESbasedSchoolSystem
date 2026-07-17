@echo off
echo ========================================
echo  SCHOOL REPORT SAAS - LOGIN FIX
echo ========================================
echo.

echo Starting Backend Server (Port 8000)...
cd backend
start "Backend Server" cmd /k "python manage.py runserver 8000"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo Starting Frontend Server (Port 8081)...
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev -- --port 8081"

echo.
echo ========================================
echo  SERVERS STARTING...
echo ========================================
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:8081
echo.
echo Testing login in 5 seconds...
timeout /t 5 /nobreak > nul

echo.
echo Running login test...
cd ..
python test_login_fix.py

echo.
echo ========================================
echo  SETUP COMPLETE
echo ========================================
echo.
echo If login still fails:
echo 1. Check browser console for errors
echo 2. Check backend terminal for debug logs
echo 3. Try login with: BS9001 / bs9test
echo.
pause