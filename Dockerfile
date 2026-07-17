# Cache bust argument to force rebuild
ARG CACHE_BUST=20260524-v4

FROM python:3.11-slim

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
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY backend/ .

# Collect static files
RUN python manage.py collectstatic --noinput || echo "Static collection skipped"

# Create startup script - use PORT environment variable (Railway sets this to 8080)
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'set -e' >> /start.sh && \
    echo 'echo "=== Starting Gunicorn Server on port $PORT ==="' >> /start.sh && \
    echo 'exec gunicorn school_report_saas.wsgi:application --bind 0.0.0.0:${PORT:-8080} --workers=5 --worker-class=gevent --timeout=120 --log-level=info --access-logfile - --error-logfile -' >> /start.sh && \
    chmod +x /start.sh

# Add healthcheck for container monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl --fail http://localhost:${PORT:-8080}/ || exit 1

# Start the application
CMD ["/start.sh"]