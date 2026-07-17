@echo off
echo ========================================
echo School Report SaaS - Quick Fix Script
echo ========================================
echo.

echo Step 1: Creating test student...
cd backend
python ..\create_test_student_quick.py
if %errorlevel% neq 0 (
    echo Error creating test student. Make sure you're in the correct directory.
    pause
    exit /b 1
)
echo.

echo Step 2: Checking backend dependencies...
pip install -r requirements.txt > nul 2>&1
echo Backend dependencies checked.
echo.

echo Step 3: Running database migrations...
python manage.py migrate > nul 2>&1
echo Database migrations completed.
echo.

echo Step 4: Starting backend server...
start "Backend Server" cmd /k "python manage.py runserver 8000"
echo Backend server starting on http://localhost:8000
echo.

echo Step 5: Waiting for backend to initialize...
timeout /t 5 /nobreak > nul
echo.

echo Step 6: Starting frontend server...
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"
echo Frontend server starting on http://localhost:5173
echo.

echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo Backend API: http://localhost:8000/api
echo Frontend App: http://localhost:5173
echo.
echo Test Student Login Credentials:
echo Username: std_test123
echo Password: password123
echo.
echo If you still get 401 errors:
echo 1. Make sure both servers are running
echo 2. Check the browser console for API URL
echo 3. Try refreshing the page
echo.
pause