#!/usr/bin/env python3
"""
Test script to verify student dashboard functionality
"""
import os
import sys
import django
import requests
import json

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student
from django.contrib.auth import get_user_model

def test_student_login_and_dashboard():
    """Test student login and dashboard access"""
    
    # API base URL
    base_url = "http://localhost:8080/api"
    
    # Find a test student
    try:
        student = Student.objects.first()
        if not student:
            print("No students found in database")
            return False
            
        print(f"Found test student: {student.get_full_name()} (ID: {student.student_id})")
        
        # Test login
        login_data = {
            "student_id": student.student_id,
            "password": student.password or "password123"
        }
        
        print(f"Testing login with student_id: {student.student_id}")
        
        login_response = requests.post(f"{base_url}/students/auth/login/", json=login_data)
        
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code} - {login_response.text}")
            return False
            
        login_result = login_response.json()
        access_token = login_result.get('access')
        
        if not access_token:
            print("No access token received")
            return False
            
        print("Login successful, access token received")
        
        # Test dashboard endpoint
        headers = {"Authorization": f"Bearer {access_token}"}
        
        print("Testing dashboard endpoint...")
        dashboard_response = requests.get(f"{base_url}/students/auth/dashboard/", headers=headers)
        
        if dashboard_response.status_code != 200:
            print(f"Dashboard failed: {dashboard_response.status_code} - {dashboard_response.text}")
            return False
            
        dashboard_data = dashboard_response.json()
        print("Dashboard endpoint working")
        print(f"   Student: {dashboard_data.get('student', {}).get('name', 'Unknown')}")
        print(f"   Assignments: {len(dashboard_data.get('assignments', []))}")
        print(f"   Announcements: {len(dashboard_data.get('announcements', []))}")
        
        # Test assignments endpoint
        print("Testing assignments endpoint...")
        assignments_response = requests.get(f"{base_url}/students/assignments/", headers=headers)
        
        if assignments_response.status_code == 200:
            assignments_data = assignments_response.json()
            print(f"Assignments endpoint working - {len(assignments_data)} assignments found")
        else:
            print(f"Assignments endpoint issue: {assignments_response.status_code}")
        
        # Test announcements endpoint
        print("Testing announcements endpoint...")
        announcements_response = requests.get(f"{base_url}/announcements/", headers=headers)
        
        if announcements_response.status_code == 200:
            announcements_data = announcements_response.json()
            print(f"Announcements endpoint working - {len(announcements_data)} announcements found")
        else:
            print(f"Announcements endpoint issue: {announcements_response.status_code}")
        
        print("\nAll tests completed successfully!")
        return True
        
    except Exception as e:
        print(f"Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Testing Student Dashboard Functionality")
    print("=" * 50)
    
    success = test_student_login_and_dashboard()
    
    if success:
        print("\nStudent dashboard is working correctly!")
    else:
        print("\nStudent dashboard has issues that need to be fixed.")