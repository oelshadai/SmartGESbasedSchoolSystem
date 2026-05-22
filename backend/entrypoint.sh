#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py create_admin
python manage.py collectstatic --noinput --clear
exec gunicorn school_report_saas.wsgi:application --bind 0.0.0.0:${PORT:-8000}
