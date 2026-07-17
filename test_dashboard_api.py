#!/usr/bin/env python3
"""
TEST DASHBOARD API ENDPOINT
Verify that the dashboard API returns assignments correctly
"""
import os
import sys
import django
from django.conf import settings

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from django.contrib.auth import get_user_model
from students.models import Student
from assignments.models import Assignment, StudentAssignment
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

def test_dashboard_api():
    print("=== TESTING DASHBOARD API ENDPOINT ===\n")
    
    User = get_user_model()
    
    # Get student users
    student_users = User.objects.filter(role='STUDENT')
    print(f"Found {student_users.count()} student users")
    
    if not student_users.exists():
        print("No student users found!")
        return
    
    client = APIClient()
    
    for user in student_users:
        print(f"\nTesting API for user: {user.email}")
        
        try:
            # Get student profile
            student = Student.objects.get(user=user)
            print(f"Student: {student.get_full_name()} (ID: {student.student_id})")
            print(f"Class: {student.current_class}")
            
            # Generate JWT token
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            
            # Set authorization header
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
            
            # Call dashboard API
            response = client.get('/api/students/auth/dashboard/')
            
            print(f"API Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Student data: {data.get('student', {}).get('name', 'N/A')}")
                print(f"Assignments returned: {len(data.get('assignments', []))}")
                
                for assignment in data.get('assignments', []):
                    print(f"  - {assignment.get('assignment', {}).get('title', 'N/A')} ({assignment.get('status', 'N/A')})")
                
                print(f"Stats: {data.get('stats', {})}")
                print(f"Classmates: {len(data.get('classmates', []))}")
                print(f"Announcements: {len(data.get('announcements', []))}")
                
            else:
                print(f"API Error: {response.content.decode()}")
                
        except Student.DoesNotExist:
            print(f"No student profile found for user {user.email}")
        except Exception as e:
            print(f"Error testing user {user.email}: {str(e)}")

if __name__ == "__main__":
    test_dashboard_api()