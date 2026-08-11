#!/bin/sh
set -e

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Ensuring default admin user exists..."
python manage.py create_admin

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear || echo "Static files collection failed, continuing..."

echo "Starting Gunicorn server..."
exec gunicorn school_report_saas.wsgi:application \
  --bind 0.0.0.0:${PORT:-8000} \
  --workers 4 \
  --worker-class gevent \
  --worker-connections 1000 \
  --timeout 300 \
  --keep-alive 5 \
  --log-level info
