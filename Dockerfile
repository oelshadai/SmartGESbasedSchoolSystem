FROM python:3.11-slim

# Force rebuild - cache invalidation timestamp: 2026-05-24
# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY backend/ .

# Collect static files (non-blocking)
RUN python manage.py collectstatic --noinput || echo "Static collection skipped"

# Create startup script - use port 8000 (Railway's internal port)
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'set -e' >> /start.sh && \
    echo 'python manage.py migrate --noinput || true' >> /start.sh && \
    echo 'echo "=== Starting Gunicorn Server ==="' >> /start.sh && \
    echo 'exec gunicorn school_report_saas.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 120 --log-level info --access-logfile - --error-logfile -' >> /start.sh && \
    chmod +x /start.sh

# Start the application
CMD ["/start.sh"]
