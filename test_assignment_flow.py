#!/usr/bin/env python3
"""
Test Assignment Flow
Verify that assignments created in VClass appear in student portal
"""
import requests
import json

# Configuration
BASE_URL = 'http://localhost:8000'
TEACHER_EMAIL = 'teacher@example.com'
TEACHER_PASSWORD = 'password123'
STUDENT_EMAIL = 'student@example.com'
STUDENT_PASSWORD = 'password123'

def test_assignment_flow():
    print("=== TESTING ASSIGNMENT FLOW ===\n")
    
    # Step 1: Teacher login
    print("1. Teacher Login")
    teacher_login = requests.post(f'{BASE_URL}/api/accounts/login/', {
        'email': TEACHER_EMAIL,
        'password': TEACHER_PASSWORD
    })
    
    if teacher_login.status_code == 200:
        teacher_token = teacher_login.json().get('access_token')
        print(f"   ✓ Teacher logged in successfully")
    else:
        print(f"   ✗ Teacher login failed: {teacher_login.status_code}")
        return
    
    # Step 2: Create assignment via teacher API
    print("\n2. Creating Assignment")
    assignment_data = {
        'title': 'Test Assignment - Flow Verification',
        'description': 'This assignment tests the VClass to Student Portal flow',
        'assignment_type': 'HOMEWORK',
        'class_instance': 1,  # Assuming class ID 1 exists
        'due_date': '2024-12-31T23:59:59Z',
        'max_score': 100
    }
    
    create_response = requests.post(
        f'{BASE_URL}/api/assignments/teacher/',
        json=assignment_data,
        headers={'Authorization': f'Bearer {teacher_token}'}
    )
    
    if create_response.status_code == 201:
        assignment_id = create_response.json().get('id')
        print(f"   ✓ Assignment created with ID: {assignment_id}")
    else:
        print(f"   ✗ Assignment creation failed: {create_response.status_code}")
        print(f"   Response: {create_response.text}")
        return
    
    # Step 3: Student login
    print("\n3. Student Login")
    student_login = requests.post(f'{BASE_URL}/api/accounts/login/', {
        'email': STUDENT_EMAIL,
        'password': STUDENT_PASSWORD
    })
    
    if student_login.status_code == 200:
        student_token = student_login.json().get('access_token')
        print(f"   ✓ Student logged in successfully")
    else:
        print(f"   ✗ Student login failed: {student_login.status_code}")
        return
    
    # Step 4: Check if student can see the assignment
    print("\n4. Student Assignment Visibility")
    student_assignments = requests.get(
        f'{BASE_URL}/api/assignments/student/my-assignments/',
        headers={'Authorization': f'Bearer {student_token}'}
    )
    
    if student_assignments.status_code == 200:
        assignments = student_assignments.json()
        assignment_titles = [a.get('title') for a in assignments]
        
        if 'Test Assignment - Flow Verification' in assignment_titles:
            print(f"   ✓ Student can see the assignment!")
            print(f"   Total assignments visible: {len(assignments)}")
        else:
            print(f"   ✗ Assignment not visible to student")
            print(f"   Available assignments: {assignment_titles}")
    else:
        print(f"   ✗ Failed to fetch student assignments: {student_assignments.status_code}")
        print(f"   Response: {student_assignments.text}")
    
    print("\n=== TEST COMPLETED ===")

if __name__ == '__main__':
    test_assignment_flow()