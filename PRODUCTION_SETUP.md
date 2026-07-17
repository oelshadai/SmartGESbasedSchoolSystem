# Production Deployment Guide

## Backend Setup (Django)

### 1. Environment Variables (.env)
```
SECRET_KEY=your-production-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://user:password@host:port/dbname

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# CORS Settings
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_ALLOW_CREDENTIALS=True

# Media Storage (AWS S3 or similar)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_S3_REGION_NAME=us-east-1

# Frontend URL
FRONTEND_URL=https://yourdomain.com
```

### 2. Database Migration Commands
```bash
python manage.py makemigrations
python manage.py makemigrations notifications
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### 3. Required Python Packages (requirements.txt additions)
```
Pillow==10.0.1
boto3==1.29.0
django-storages==1.14.2
gunicorn==21.2.0
psycopg2-binary==2.9.7
redis==5.0.1
celery==5.3.4
```

## Frontend Setup (React)

### 1. Environment Variables (.env.production)
```
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=School Management System
VITE_ENVIRONMENT=production
```

### 2. Build Commands
```bash
npm install
npm run build
```

## Server Configuration

### 1. Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Frontend
    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Media files
    location /media/ {
        alias /var/www/backend/media/;
    }
    
    # Static files
    location /static/ {
        alias /var/www/backend/staticfiles/;
    }
}
```

### 2. Systemd Service (Django)
```ini
[Unit]
Description=School Management System
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/backend
Environment=PATH=/var/www/backend/venv/bin
ExecStart=/var/www/backend/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 school_report_saas.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

## Security Checklist

### 1. Django Security Settings
```python
# settings.py additions for production
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = 'DENY'
```

### 2. Firewall Rules
```bash
# Allow SSH, HTTP, HTTPS
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

## Backup Strategy

### 1. Database Backup Script
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > /backups/db_backup_$DATE.sql
aws s3 cp /backups/db_backup_$DATE.sql s3://your-backup-bucket/
```

### 2. Media Files Backup
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backups/media_backup_$DATE.tar.gz /var/www/backend/media/
aws s3 cp /backups/media_backup_$DATE.tar.gz s3://your-backup-bucket/
```

## Monitoring & Logging

### 1. Log Configuration
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/django/school_system.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

### 2. Health Check Endpoint
```python
# Add to urls.py
path('health/', lambda request: JsonResponse({'status': 'healthy'}))
```

## Performance Optimization

### 1. Redis Caching
```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

### 2. Database Optimization
```python
# Add database indexes
class Meta:
    indexes = [
        models.Index(fields=['student_id']),
        models.Index(fields=['created_at']),
        models.Index(fields=['school', 'is_active']),
    ]
```