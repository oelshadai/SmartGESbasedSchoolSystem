#!/usr/bin/env python3
"""
Test script to verify attendance endpoints exist
"""
import os
import sys
import django
from django.conf import settings

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from django.urls import reverse
from django.test import Client
from django.contrib.auth import get_user_model
from students.models import Student, DailyAttendance
from schools.models import School, Class

def test_attendance_endpoints():
    """Test if attendance endpoints are accessible"""
    client = Client()
    
    print("Testing attendance endpoints...")
    
    # Test endpoints without authentication first
    endpoints = [
        '/api/students/',
        '/api/students/attendance/',
        '/api/teachers/assignments/',
    ]
    
    for endpoint in endpoints:
        try:
            response = client.get(endpoint)
            print(f"GET {endpoint}: Status {response.status_code}")
        except Exception as e:
            print(f"GET {endpoint}: Error - {e}")
    
    print("\nTesting with authentication...")
    
    # Create a test user and school
    User = get_user_model()
    try:
        school = School.objects.first()
        if not school:
            print("No school found in database")
            return
            
        user = User.objects.filter(role='TEACHER').first()
        if not user:
            print("No teacher found in database")
            return
            
        # Login
        client.force_login(user)
        
        # Test authenticated endpoints
        for endpoint in endpoints:
            try:
                response = client.get(endpoint)
                print(f"Authenticated GET {endpoint}: Status {response.status_code}")
                if response.status_code == 200:
                    print(f"  Response: {response.json()}")
            except Exception as e:
                print(f"Authenticated GET {endpoint}: Error - {e}")
                
    except Exception as e:
        print(f"Authentication test error: {e}")

if __name__ == '__main__':
    test_attendance_endpoints()