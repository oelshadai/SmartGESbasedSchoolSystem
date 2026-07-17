@echo off
echo Running financial app migrations...
python manage.py makemigrations financial
python manage.py migrate financial
echo Migrations complete!
pause