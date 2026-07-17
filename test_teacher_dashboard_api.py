#!/usr/bin/env python
"""
Test script to check teacher dashboard API response
"""

import os
import sys
import django
import json

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.test import RequestFactory
from accounts.auth_views import teacher_dashboard

User = get_user_model()

def test_teacher_dashboard_api():
    print("=== TESTING TEACHER DASHBOARD API ===\n")
    
    try:
        # Find ADOMAH JACKLINE user
        teacher_user = User.objects.get(
            first_name__icontains='ADOMAH',
            last_name__icontains='JACKLINE'
        )
        print(f"Found teacher: {teacher_user.get_full_name()} (ID: {teacher_user.id})")
        
        # Use DRF APIClient for proper authentication handling
        from rest_framework.test import APIClient
        from django.test import override_settings
        
        # Override ALLOWED_HOSTS to include testserver
        with override_settings(ALLOWED_HOSTS=['localhost', '127.0.0.1', 'testserver']):
            client = APIClient()
            
            # Force authenticate the user
            client.force_authenticate(user=teacher_user)
            
            # Make the API call
            response = client.get('/api/auth/teacher-dashboard/')
        
        print(f"API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            # Parse JSON response
            data = response.data
            print("\n=== API RESPONSE DATA ===")
            print(f"Teacher Name: {data['teacher']['name']}")
            print(f"Teacher Email: {data['teacher']['email']}")
            print(f"Is Class Teacher: {data['teacher']['is_class_teacher']}")
            
            print(f"\nAssigned Classes Count: {len(data['assigned_classes'])}")
            for i, cls in enumerate(data['assigned_classes'], 1):
                print(f"  {i}. {cls['name']} (ID: {cls['id']}) - {cls['students_count']} students")
            
            print(f"\nTeaching Subjects Count: {len(data['teaching_subjects'])}")
            for i, subj in enumerate(data['teaching_subjects'], 1):
                print(f"  {i}. {subj['subject']} in {subj['class']}")
            
            print(f"\nStats:")
            print(f"  Total Classes: {data['stats']['total_classes']}")
            print(f"  Total Subjects: {data['stats']['total_subjects']}")
            print(f"  Total Assignments: {data['stats']['total_assignments']}")
            print(f"  Attendance Today: {data['stats']['attendance_taken_today']}")
            
            print(f"\nAnnouncements Count: {len(data['announcements'])}")
            
            # Pretty print the full JSON response
            print("\n=== FULL JSON RESPONSE ===")
            print(json.dumps(data, indent=2, default=str))
            
        else:
            print(f"API Error: {response.data}")
            
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_teacher_dashboard_api()