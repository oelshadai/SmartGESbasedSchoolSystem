#!/usr/bin/env python3
"""
Test login credentials for available accounts
"""
import requests
import json

# Backend URL
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/auth/login/"

# Test accounts from database
test_accounts = [
    # Teachers
    {"email": "teacher@test.com", "password": "password123", "type": "Teacher"},
    {"email": "nanaamaadomah18@gmail.com", "password": "password123", "type": "Teacher"},
    {"email": "oseielshadai18@gmail.com", "password": "password123", "type": "Teacher"},
    
    # School Admins
    {"email": "admin@test.com", "password": "password123", "type": "School Admin"},
    {"email": "admin@demo.test", "password": "password123", "type": "Super Admin"},
    {"email": "oelshadai565@gmail.com", "password": "password123", "type": "School Admin"},
    
    # Students (using student ID as email)
    {"email": "std_bs9001@elitetech.edu.gh", "password": "bs9test", "type": "Student"},
    {"email": "std_STD001@testschool.edu", "password": "test123", "type": "Student"},
    {"email": "std_2025BASIC_9001@greathopeinternationalschool.edu", "password": "R4qGr6", "type": "Student"},
]

def test_login(email, password, account_type):
    """Test login with given credentials"""
    try:
        response = requests.post(LOGIN_URL, json={
            "email": email,
            "password": password
        })
        
        if response.status_code == 200:
            data = response.json()
            user_info = data.get('user', {})
            print(f"✅ SUCCESS - {account_type}")
            print(f"   Email: {email}")
            print(f"   Password: {password}")
            print(f"   Role: {user_info.get('role')}")
            print(f"   School: {user_info.get('school')}")
            return True
        else:
            print(f"❌ FAILED - {account_type}")
            print(f"   Email: {email}")
            print(f"   Password: {password}")
            print(f"   Status: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR - {account_type}")
        print(f"   Email: {email}")
        print(f"   Exception: {str(e)}")
        return False

def main():
    print("Testing login credentials...")
    print("=" * 50)
    
    successful_logins = []
    
    for account in test_accounts:
        success = test_login(account["email"], account["password"], account["type"])
        if success:
            successful_logins.append(account)
        print("-" * 30)
    
    print("\n" + "=" * 50)
    print("SUMMARY - Working Credentials:")
    print("=" * 50)
    
    if successful_logins:
        for account in successful_logins:
            print(f"✅ {account['type']}: {account['email']} / {account['password']}")
    else:
        print("❌ No working credentials found!")
        print("\nTry creating a new test user:")
        print("cd backend && python create_test_teacher.py")

if __name__ == "__main__":
    main()