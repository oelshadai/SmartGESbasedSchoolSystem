#!/usr/bin/env python
import os
import sys
import django
import requests
import json

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student
from assignments.models import Assignment
from django.contrib.auth.models import User

def test_student_login_and_assignments():
    """Test student login and verify assignments appear"""
    
    # API base URL
    BASE_URL = "http://localhost:8000"
    
    print("=== Student Assignment Visibility Test ===\n")
    
    # Step 1: Verify test student exists
    try:
        student = Student.objects.get(username="teststudent")
        print(f"✓ Test student found: {student.first_name} {student.last_name}")
        print(f"  - Username: {student.username}")
        print(f"  - Class: {student.student_class.name}")
        print(f"  - School: {student.school.name}")
    except Student.DoesNotExist:
        print("✗ Test student not found. Please run create_test_student_simple.py first")
        return
    
    # Step 2: Check assignments in database
    assignments = Assignment.objects.filter(
        student_class=student.student_class,
        is_published=True
    )
    print(f"\n✓ Found {assignments.count()} published assignments for class {student.student_class.name}")
    for assignment in assignments:
        print(f"  - {assignment.title} (Due: {assignment.due_date})")
    
    # Step 3: Test student login via API
    login_data = {
        "username": "teststudent",
        "password": "test123"
    }
    
    try:
        print(f"\n🔄 Testing student login...")
        response = requests.post(f"{BASE_URL}/api/students/login/", json=login_data)
        
        if response.status_code == 200:
            login_result = response.json()
            print("✓ Student login successful!")
            print(f"  - Token received: {login_result.get('access', 'N/A')[:20]}...")
            
            # Get the access token
            access_token = login_result.get('access')
            headers = {'Authorization': f'Bearer {access_token}'}
            
            # Step 4: Test student dashboard/assignments endpoint
            print(f"\n🔄 Fetching student assignments...")
            dashboard_response = requests.get(f"{BASE_URL}/api/students/dashboard/", headers=headers)
            
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                print("✓ Student dashboard accessed successfully!")
                
                # Check assignments in dashboard
                assignments_data = dashboard_data.get('assignments', [])
                print(f"  - Found {len(assignments_data)} assignments in dashboard")
                
                for assignment in assignments_data:
                    print(f"    • {assignment.get('title', 'N/A')} - Due: {assignment.get('due_date', 'N/A')}")
                    print(f"      Status: {assignment.get('status', 'N/A')}")
                
                # Step 5: Test direct assignments endpoint
                print(f"\n🔄 Testing direct assignments endpoint...")
                assignments_response = requests.get(f"{BASE_URL}/api/assignments/student/", headers=headers)
                
                if assignments_response.status_code == 200:
                    assignments_list = assignments_response.json()
                    print(f"✓ Direct assignments endpoint successful!")
                    print(f"  - Found {len(assignments_list)} assignments")
                    
                    for assignment in assignments_list:
                        print(f"    • {assignment.get('title', 'N/A')}")
                        print(f"      Subject: {assignment.get('subject', 'N/A')}")
                        print(f"      Due: {assignment.get('due_date', 'N/A')}")
                        print(f"      Status: {assignment.get('submission_status', 'Not submitted')}")
                        print()
                else:
                    print(f"✗ Direct assignments endpoint failed: {assignments_response.status_code}")
                    print(f"  Response: {assignments_response.text}")
                
            else:
                print(f"✗ Student dashboard failed: {dashboard_response.status_code}")
                print(f"  Response: {dashboard_response.text}")
                
        else:
            print(f"✗ Student login failed: {response.status_code}")
            print(f"  Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("✗ Connection error. Make sure the backend server is running on localhost:8000")
    except Exception as e:
        print(f"✗ Error during API test: {e}")
    
    print(f"\n=== Test Complete ===")

if __name__ == "__main__":
    test_student_login_and_assignments()