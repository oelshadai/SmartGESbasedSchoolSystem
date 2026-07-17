#!/usr/bin/env python
import os
import sys
import django
import requests
import json

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student
from schools.models import School, Class
from django.contrib.auth import get_user_model

User = get_user_model()

def create_test_student():
    """Create a test student for login testing"""
    try:
        # Get or create a school
        school, created = School.objects.get_or_create(
            name="Test School",
            defaults={
                'address': 'Test Address',
                'phone': '1234567890',
                'email': 'test@school.com',
                'subscription_plan': 'BASIC'
            }
        )
        
        # Get or create a class
        test_class, created = Class.objects.get_or_create(
            level="Test Class",
            school=school,
            defaults={'capacity': 30}
        )
        
        # Create or get test student
        student, created = Student.objects.get_or_create(
            student_id="STD001",
            defaults={
                'first_name': 'Test',
                'last_name': 'Student',
                'password': 'password123',
                'school': school,
                'current_class': test_class
            }
        )
        
        if created:
            print(f"Created test student: {student.student_id}")
        else:
            print(f"Test student already exists: {student.student_id}")
            # Update password to ensure it's correct
            student.password = 'password123'
            student.save()
        
        return student
        
    except Exception as e:
        print(f"Error creating test student: {e}")
        return None

def test_student_login():
    """Test student login via API"""
    
    # Create test student first
    student = create_test_student()
    if not student:
        print("Failed to create test student")
        return
    
    # Test login
    login_url = "http://localhost:8000/api/auth/student-login/"
    login_data = {
        "username": "STD001",  # This should match student_id
        "password": "password123"
    }
    
    print(f"Testing student login with: {login_data}")
    
    try:
        response = requests.post(login_url, json=login_data, timeout=10)
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("Login successful!")
            print(f"Access token: {data.get('access', 'Not found')[:50]}...")
            print(f"Student data: {data.get('student', 'Not found')}")
        else:
            print(f"Login failed: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Connection error - make sure backend server is running on port 8000")
    except Exception as e:
        print(f"Error testing login: {e}")

if __name__ == "__main__":
    print("Testing student login...")
    test_student_login()