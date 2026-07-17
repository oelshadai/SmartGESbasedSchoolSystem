@echo off
title Frontend Server
echo Starting Frontend Development Server...
echo.

cd /d "%~dp0frontend"
if errorlevel 1 (
    echo Error: Could not change to frontend directory
    pause
    exit /b 1
)

echo Current directory: %cd%
echo.

echo Installing dependencies if needed...
call npm install --silent

echo.
echo Starting Vite development server...
call npm run dev

if errorlevel 1 (
    echo.
    echo Error: Frontend server failed to start
    echo Check the error messages above
    pause
    exit /b 1
)

pause