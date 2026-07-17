#!/usr/bin/env python3
"""
Debug script to test the teacher assignments endpoint
"""
import os
import sys
import django
import requests
import json

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from django.contrib.auth import get_user_model
from teachers.models import Teacher
from schools.models import Class, ClassSubject

User = get_user_model()

def test_teacher_assignments_endpoint():
    """Test the teacher assignments endpoint directly"""
    print("=== Testing Teacher Assignments Endpoint ===")
    
    # First, let's check if we have any teachers in the database
    teachers = Teacher.objects.all()
    print(f"Total teachers in database: {teachers.count()}")
    
    if teachers.count() == 0:
        print("No teachers found in database!")
        return
    
    # Get the first teacher
    teacher = teachers.first()
    print(f"Testing with teacher: {teacher.user.email} (ID: {teacher.user.id})")
    
    # Check if teacher has school
    print(f"Teacher school: {teacher.school}")
    
    # Check class assignments
    class_assignments = Class.objects.filter(
        school=teacher.school,
        class_teacher=teacher.user
    )
    print(f"Class teacher assignments: {class_assignments.count()}")
    
    # Check subject assignments
    subject_assignments = ClassSubject.objects.filter(
        teacher=teacher.user,
        class_instance__school=teacher.school
    )
    print(f"Subject teacher assignments: {subject_assignments.count()}")
    
    # Now test the actual endpoint
    print("\n=== Testing API Endpoint ===")
    
    # First, we need to get an auth token
    try:
        # Try to login as this teacher
        login_url = "http://127.0.0.1:8000/api/auth/login/"
        login_data = {
            "email": teacher.user.email,
            "password": "password123"  # Default password
        }
        
        print(f"Attempting login with: {login_data}")
        login_response = requests.post(login_url, json=login_data)
        print(f"Login response status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            tokens = login_response.json()
            access_token = tokens.get('access')
            
            # Now test the assignments endpoint
            assignments_url = "http://127.0.0.1:8000/api/teachers/assignments/"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            print(f"Testing assignments endpoint: {assignments_url}")
            assignments_response = requests.get(assignments_url, headers=headers)
            print(f"Assignments response status: {assignments_response.status_code}")
            
            if assignments_response.status_code == 200:
                assignments_data = assignments_response.json()
                print(f"Assignments data: {json.dumps(assignments_data, indent=2)}")
            else:
                print(f"Error response: {assignments_response.text}")
                
        else:
            print(f"Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"Error testing endpoint: {str(e)}")
        import traceback
        traceback.print_exc()

def check_database_integrity():
    """Check database integrity for teacher assignments"""
    print("\n=== Checking Database Integrity ===")
    
    # Check for teachers without users
    teachers_without_users = Teacher.objects.filter(user__isnull=True)
    print(f"Teachers without users: {teachers_without_users.count()}")
    
    # Check for teachers without schools
    teachers_without_schools = Teacher.objects.filter(school__isnull=True)
    print(f"Teachers without schools: {teachers_without_schools.count()}")
    
    # Check for class assignments with invalid references
    try:
        classes = Class.objects.all()
        print(f"Total classes: {classes.count()}")
        
        classes_with_teachers = Class.objects.filter(class_teacher__isnull=False)
        print(f"Classes with teachers: {classes_with_teachers.count()}")
        
        subject_assignments = ClassSubject.objects.all()
        print(f"Total subject assignments: {subject_assignments.count()}")
        
    except Exception as e:
        print(f"Database integrity check failed: {str(e)}")

if __name__ == "__main__":
    check_database_integrity()
    test_teacher_assignments_endpoint()