@echo off
echo Cleaning up deployment files...

REM Remove Docker containers and images
echo Stopping and removing Docker containers...
docker-compose down --remove-orphans 2>nul
docker container prune -f 2>nul

echo Removing Docker images...
docker image prune -f 2>nul
docker rmi school-report-saas-frontend 2>nul
docker rmi school-report-saas-backend 2>nul

REM Remove build directories
echo Removing build directories...
if exist "frontend\dist" rmdir /s /q "frontend\dist"
if exist "frontend\build" rmdir /s /q "frontend\build"
if exist "backend\staticfiles" rmdir /s /q "backend\staticfiles"

REM Remove deployment files
echo Removing deployment files...
if exist "docker-compose.yml" del "docker-compose.yml"
if exist "docker-compose.prod.yml" del "docker-compose.prod.yml"
if exist "frontend\Dockerfile" del "frontend\Dockerfile"
if exist "backend\Dockerfile" del "backend\Dockerfile"
if exist ".dockerignore" del ".dockerignore"

REM Remove environment files (keep .env.example)
echo Removing environment files...
if exist ".env" del ".env"
if exist "frontend\.env" del "frontend\.env"
if exist "backend\.env" del "backend\.env"

REM Remove logs
echo Removing log files...
if exist "*.log" del "*.log"
if exist "backend\*.log" del "backend\*.log"
if exist "frontend\*.log" del "frontend\*.log"

REM Remove cache and temporary files
echo Removing cache files...
if exist "backend\__pycache__" rmdir /s /q "backend\__pycache__"
if exist "backend\*.pyc" del /s "backend\*.pyc"
if exist "frontend\node_modules\.cache" rmdir /s /q "frontend\node_modules\.cache"

echo Cleanup completed successfully!
pause