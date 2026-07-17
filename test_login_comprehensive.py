#!/usr/bin/env python3
"""
Comprehensive Login Test Script
Tests both regular user login and student login endpoints
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

def test_regular_login():
    """Test regular user login endpoint"""
    print("\n=== Testing Regular User Login ===")
    
    # Test data - you can modify these
    test_users = [
        {
            "email": "admin@school.com",
            "password": "admin123"
        },
        {
            "email": "teacher@school.com", 
            "password": "teacher123"
        }
    ]
    
    for user in test_users:
        print(f"\nTesting login for: {user['email']}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/accounts/login/",
                headers=HEADERS,
                json=user,
                timeout=10
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Login successful!")
                print(f"User Role: {data.get('user', {}).get('role', 'Unknown')}")
                print(f"School: {data.get('user', {}).get('school', 'Unknown')}")
                print(f"Access Token: {data.get('access', 'Not provided')[:50]}...")
                return data.get('access')  # Return token for further tests
            else:
                print("❌ Login failed!")
                try:
                    error_data = response.json()
                    print(f"Error: {error_data}")
                except:
                    print(f"Error: {response.text}")
                    
        except requests.exceptions.RequestException as e:
            print(f"❌ Connection error: {e}")
            
    return None

def test_student_login():
    """Test student login endpoint"""
    print("\n=== Testing Student Login ===")
    
    # Test student data - you can modify these
    test_students = [
        {
            "student_id": "STD001",
            "password": "student123"
        },
        {
            "student_id": "BS9001",
            "password": "password123"
        }
    ]
    
    for student in test_students:
        print(f"\nTesting student login for: {student['student_id']}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/accounts/student-login/",
                headers=HEADERS,
                json=student,
                timeout=10
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Student login successful!")
                print(f"Student Name: {data.get('student', {}).get('name', 'Unknown')}")
                print(f"Class: {data.get('student', {}).get('class', 'Unknown')}")
                print(f"School: {data.get('student', {}).get('school', 'Unknown')}")
                print(f"Access Token: {data.get('access', 'Not provided')[:50]}...")
                return data.get('access')  # Return token for further tests
            else:
                print("❌ Student login failed!")
                try:
                    error_data = response.json()
                    print(f"Error: {error_data}")
                except:
                    print(f"Error: {response.text}")
                    
        except requests.exceptions.RequestException as e:
            print(f"❌ Connection error: {e}")
            
    return None

def test_protected_endpoint(token, endpoint_type="user"):
    """Test accessing protected endpoints with token"""
    print(f"\n=== Testing Protected Endpoint ({endpoint_type}) ===")
    
    if not token:
        print("❌ No token available for testing")
        return
    
    auth_headers = HEADERS.copy()
    auth_headers['Authorization'] = f'Bearer {token}'
    
    # Choose endpoint based on type
    if endpoint_type == "student":
        endpoint = f"{BASE_URL}/api/students/auth/dashboard/"
    else:
        endpoint = f"{BASE_URL}/api/accounts/profile/"
    
    try:
        response = requests.get(endpoint, headers=auth_headers, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Protected endpoint access successful!")
            data = response.json()
            if endpoint_type == "student":
                print(f"Student Dashboard loaded for: {data.get('student', {}).get('name', 'Unknown')}")
                print(f"Total Assignments: {data.get('stats', {}).get('total_assignments', 0)}")
            else:
                print(f"Profile loaded for: {data.get('email', 'Unknown')}")
        else:
            print("❌ Protected endpoint access failed!")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Error: {response.text}")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")

def test_logout(token):
    """Test logout endpoint"""
    print("\n=== Testing Logout ===")
    
    if not token:
        print("❌ No token available for logout test")
        return
    
    auth_headers = HEADERS.copy()
    auth_headers['Authorization'] = f'Bearer {token}'
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/accounts/logout/",
            headers=auth_headers,
            json={},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Logout successful!")
        else:
            print("❌ Logout failed!")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Error: {response.text}")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")

def check_server_status():
    """Check if the server is running"""
    print("=== Checking Server Status ===")
    
    try:
        response = requests.get(f"{BASE_URL}/api/", timeout=5)
        print(f"✅ Server is running (Status: {response.status_code})")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Server is not accessible: {e}")
        print("Make sure your Django server is running on http://localhost:8000")
        return False

def main():
    """Main test function"""
    print(f"🚀 Starting Login Tests - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Check server status first
    if not check_server_status():
        sys.exit(1)
    
    # Test regular user login
    user_token = test_regular_login()
    if user_token:
        test_protected_endpoint(user_token, "user")
        test_logout(user_token)
    
    # Test student login
    student_token = test_student_login()
    if student_token:
        test_protected_endpoint(student_token, "student")
    
    print("\n" + "=" * 60)
    print("🏁 Login tests completed!")
    print("\nTips:")
    print("- If login fails, check your test credentials")
    print("- Make sure you have test users/students in your database")
    print("- Check Django server logs for detailed error information")

if __name__ == "__main__":
    main()