# Backend Dockerfile for Railway / Docker deployments
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    libxml2-dev \
    libxslt1-dev \
    libjpeg-dev \
    zlib1g-dev \
    libpq5 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libpango1.0-0 \
    shared-mime-info \
    wkhtmltopdf \
    git \
    curl \
    ca-certificates \
    fonts-liberation \
    fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x ./entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
