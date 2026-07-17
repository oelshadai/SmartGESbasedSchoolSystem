#!/usr/bin/env python
"""
Test script to simulate frontend API call to teacher dashboard
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
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def test_frontend_api_call():
    print("=== TESTING FRONTEND API CALL ===\n")
    
    try:
        # Find ADOMAH JACKLINE user
        teacher_user = User.objects.get(
            first_name__icontains='ADOMAH',
            last_name__icontains='JACKLINE'
        )
        print(f"Found teacher: {teacher_user.get_full_name()} (ID: {teacher_user.id})")
        
        # Generate JWT token for the user
        refresh = RefreshToken.for_user(teacher_user)
        access_token = str(refresh.access_token)
        
        print(f"Generated access token: {access_token[:50]}...")
        
        # Make HTTP request to the API like frontend would
        url = "http://127.0.0.1:8000/api/auth/teacher-dashboard/"
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        print(f"\nMaking request to: {url}")
        print(f"Headers: {headers}")
        
        response = requests.get(url, headers=headers)
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n=== API RESPONSE DATA ===")
            print(f"Teacher Name: {data['teacher']['name']}")
            print(f"Assigned Classes Count: {len(data['assigned_classes'])}")
            for i, cls in enumerate(data['assigned_classes'], 1):
                print(f"  {i}. {cls['name']} (ID: {cls['id']}) - {cls['students_count']} students")
            
            print(f"\nStats:")
            print(f"  Total Classes: {data['stats']['total_classes']}")
            print(f"  Total Subjects: {data['stats']['total_subjects']}")
            print(f"  Total Assignments: {data['stats']['total_assignments']}")
            
        else:
            print(f"Error Response: {response.text}")
            
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_frontend_api_call()