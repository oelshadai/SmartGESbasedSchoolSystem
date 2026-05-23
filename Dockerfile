FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

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

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Run migrations and start server with gunicorn
CMD python manage.py migrate --noinput && \
    gunicorn school_report_saas.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120
