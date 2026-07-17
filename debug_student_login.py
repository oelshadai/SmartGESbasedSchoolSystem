#!/usr/bin/env python3
"""
Debug student login issue - check what's causing the 400 error
"""

import os
import sys
import django
import requests
import json

# Setup Django
sys.path.append('backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student
from django.contrib.auth import get_user_model

def check_students():
    """Check existing students"""
    print("=== Checking Students ===")
    students = Student.objects.all()
    print(f"Total students: {students.count()}")
    
    for student in students[:5]:  # Show first 5
        print(f"Student ID: {student.student_id}")
        print(f"Name: {student.get_full_name()}")
        print(f"Password: {student.password}")
        print(f"User: {student.user}")
        print("---")

def test_login_endpoint():
    """Test the login endpoint directly"""
    print("\n=== Testing Login Endpoint ===")
    
    # Get a test student
    student = Student.objects.first()
    if not student:
        print("No students found!")
        return
    
    print(f"Testing with student: {student.student_id}")
    
    # Test with correct field name (student_id)
    test_data_1 = {
        'student_id': student.student_id,
        'password': student.password or 'password123'
    }
    
    # Test with frontend field name (username)
    test_data_2 = {
        'username': student.student_id,
        'password': student.password or 'password123'
    }
    
    url = 'http://localhost:8000/api/auth/student-login/'
    
    print(f"\nTest 1 - Using 'student_id': {test_data_1}")
    try:
        response = requests.post(url, json=test_data_1, headers={'Content-Type': 'application/json'})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    print(f"\nTest 2 - Using 'username': {test_data_2}")
    try:
        response = requests.post(url, json=test_data_2, headers={'Content-Type': 'application/json'})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

def create_test_student():
    """Create a simple test student"""
    print("\n=== Creating Test Student ===")
    
    try:
        # Check if test student exists
        student, created = Student.objects.get_or_create(
            student_id='TEST001',
            defaults={
                'first_name': 'Test',
                'last_name': 'Student',
                'password': 'test123'
            }
        )
        
        if created:
            print(f"Created test student: {student.student_id}")
        else:
            print(f"Test student already exists: {student.student_id}")
            
        return student
        
    except Exception as e:
        print(f"Error creating test student: {e}")
        return None

if __name__ == '__main__':
    check_students()
    
    # Create test student if none exist
    if Student.objects.count() == 0:
        create_test_student()
        check_students()
    
    test_login_endpoint()