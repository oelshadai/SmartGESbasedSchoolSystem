#!/usr/bin/env python3
"""
Reset teacher password and test endpoint
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

User = get_user_model()

def reset_teacher_password():
    """Reset teacher password to a valid one"""
    print("=== Resetting Teacher Password ===")
    
    teachers = Teacher.objects.all()
    if teachers.count() == 0:
        print("No teachers found!")
        return None
        
    teacher = teachers.first()
    user = teacher.user
    
    # Set a valid password
    new_password = "Password123!"
    user.set_password(new_password)
    user.save()
    
    print(f"Password reset for teacher: {user.email}")
    return teacher, new_password

def test_endpoint_directly():
    """Test the endpoint by calling the view function directly"""
    print("\n=== Testing View Function Directly ===")
    
    try:
        from teachers.assignment_views import teacher_class_assignments
        from django.test import RequestFactory
        from django.contrib.auth.models import AnonymousUser
        
        # Get a teacher
        teacher = Teacher.objects.first()
        if not teacher:
            print("No teacher found!")
            return
            
        # Create a mock request
        factory = RequestFactory()
        request = factory.get('/api/teachers/assignments/')
        request.user = teacher.user
        
        # Call the view function
        response = teacher_class_assignments(request)
        print(f"Direct view response status: {response.status_code}")
        print(f"Direct view response data: {response.data}")
        
    except Exception as e:
        print(f"Error calling view directly: {str(e)}")
        import traceback
        traceback.print_exc()

def test_api_endpoint():
    """Test the API endpoint with proper authentication"""
    print("\n=== Testing API Endpoint ===")
    
    teacher, password = reset_teacher_password()
    if not teacher:
        return
        
    try:
        # Login
        login_url = "http://127.0.0.1:8000/api/auth/login/"
        login_data = {
            "email": teacher.user.email,
            "password": password
        }
        
        print(f"Attempting login with: {teacher.user.email}")
        login_response = requests.post(login_url, json=login_data)
        print(f"Login response status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            tokens = login_response.json()
            access_token = tokens.get('access')
            
            # Test assignments endpoint
            assignments_url = "http://127.0.0.1:8000/api/teachers/assignments/"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            print(f"Testing assignments endpoint...")
            assignments_response = requests.get(assignments_url, headers=headers)
            print(f"Assignments response status: {assignments_response.status_code}")
            
            if assignments_response.status_code == 200:
                assignments_data = assignments_response.json()
                print(f"Success! Assignments data: {json.dumps(assignments_data, indent=2)}")
            else:
                print(f"Error response: {assignments_response.text}")
                
        else:
            print(f"Login failed: {login_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Could not connect to server. Is the Django server running?")
    except Exception as e:
        print(f"Error testing endpoint: {str(e)}")

if __name__ == "__main__":
    test_endpoint_directly()
    test_api_endpoint()