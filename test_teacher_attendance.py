#!/usr/bin/env python3
"""
Quick test script to verify teacher attendance functionality
"""

import requests
import json
from datetime import date

# Configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "teacher@test.com"  # Replace with actual teacher email
TEST_PASSWORD = "password123"    # Replace with actual password

def test_teacher_attendance():
    """Test the teacher attendance endpoints"""
    
    print("🧪 Testing Teacher Attendance System")
    print("=" * 50)
    
    # Step 1: Login as teacher
    print("1. Logging in as teacher...")
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    try:
        response = requests.post(f"{BASE_URL}/accounts/login/", json=login_data)
        if response.status_code == 200:
            token = response.json().get('access_token')
            headers = {'Authorization': f'Bearer {token}'}
            print("   ✅ Login successful")
        else:
            print(f"   ❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"   ❌ Login error: {e}")
        return
    
    # Step 2: Get teacher assignments
    print("2. Getting teacher assignments...")
    try:
        response = requests.get(f"{BASE_URL}/teachers/assignments/", headers=headers)
        if response.status_code == 200:
            assignments = response.json().get('results', [])
            form_class = None
            for assignment in assignments:
                if assignment.get('type') == 'form_class':
                    form_class = assignment.get('class')
                    break
            
            if form_class:
                print(f"   ✅ Found form class: {form_class.get('name')}")
                class_id = form_class.get('id')
            else:
                print("   ❌ No form class assignment found")
                return
        else:
            print(f"   ❌ Failed to get assignments: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Assignment error: {e}")
        return
    
    # Step 3: Get attendance for today
    print("3. Getting current attendance...")
    today = date.today().isoformat()
    try:
        response = requests.get(
            f"{BASE_URL}/teachers/attendance/", 
            headers=headers,
            params={'class_id': class_id, 'date': today}
        )
        if response.status_code == 200:
            attendance_data = response.json()
            students = attendance_data.get('students', [])
            print(f"   ✅ Found {len(students)} students in class")
            print(f"   Class: {attendance_data.get('class_name')}")
            print(f"   Date: {attendance_data.get('date')}")
        else:
            print(f"   ❌ Failed to get attendance: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"   ❌ Attendance get error: {e}")
        return
    
    # Step 4: Mark some students present (if there are students)
    if students:
        print("4. Testing attendance marking...")
        try:
            # Mark first student present, others absent
            attendance_records = []
            for i, student in enumerate(students):
                status = 'present' if i == 0 else 'absent'
                attendance_records.append({
                    'student_id': student['id'],
                    'status': status
                })
            
            save_data = {
                'class_id': class_id,
                'date': today,
                'attendance': attendance_records
            }
            
            response = requests.post(
                f"{BASE_URL}/teachers/attendance/",
                headers=headers,
                json=save_data
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Attendance saved successfully")
                print(f"   Created: {result.get('created', 0)}")
                print(f"   Updated: {result.get('updated', 0)}")
            else:
                print(f"   ❌ Failed to save attendance: {response.status_code}")
                print(f"   Response: {response.text}")
        except Exception as e:
            print(f"   ❌ Attendance save error: {e}")
    else:
        print("4. No students found to test attendance marking")
    
    print("\n🎉 Teacher attendance test completed!")
    print("\nTo use the attendance system:")
    print("1. Login as a teacher who is assigned as form teacher")
    print("2. Navigate to the Attendance page")
    print("3. Select the date and mark student attendance")
    print("4. Click 'Save Attendance' to record the data")

if __name__ == "__main__":
    test_teacher_attendance()