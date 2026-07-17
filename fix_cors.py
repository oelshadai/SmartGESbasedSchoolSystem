#!/usr/bin/env python3
"""
Quick CORS fix for Django backend
"""
import os
import sys

# Add the backend directory to Python path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')

import django
django.setup()

from django.conf import settings

def check_cors_settings():
    print("=== CORS Configuration Check ===")
    print(f"DEBUG: {settings.DEBUG}")
    print(f"CORS_ALLOWED_ORIGINS: {getattr(settings, 'CORS_ALLOWED_ORIGINS', 'Not set')}")
    print(f"CORS_ALLOW_ALL_ORIGINS: {getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', 'Not set')}")
    print(f"CORS_ALLOW_CREDENTIALS: {getattr(settings, 'CORS_ALLOW_CREDENTIALS', 'Not set')}")
    print(f"ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    
    # Check if corsheaders is in INSTALLED_APPS
    if 'corsheaders' in settings.INSTALLED_APPS:
        print("✓ corsheaders is installed")
    else:
        print("✗ corsheaders is NOT installed")
    
    # Check if CORS middleware is properly positioned
    middleware = settings.MIDDLEWARE
    cors_middleware = 'corsheaders.middleware.CorsMiddleware'
    if cors_middleware in middleware:
        cors_index = middleware.index(cors_middleware)
        print(f"✓ CORS middleware found at position {cors_index}")
        if cors_index == 0:
            print("✓ CORS middleware is at the top (correct)")
        else:
            print("⚠ CORS middleware should be at the top of MIDDLEWARE list")
    else:
        print("✗ CORS middleware is NOT in MIDDLEWARE list")

if __name__ == '__main__':
    check_cors_settings()