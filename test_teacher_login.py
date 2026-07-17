#!/usr/bin/env python3
import requests
import json
import sys

# Set UTF-8 encoding for Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

# Test teacher login
def test_teacher_login():
    base_url = "http://localhost:8000"
    login_url = f"{base_url}/api/auth/login/"
    
    # Teacher credentials from the database
    teacher_credentials = [
        {"email": "teacher@test.com", "password": "Password123!"},
        {"email": "nanaamaadomah18@gmail.com", "password": "Password123!"},
        {"email": "oseielshadai18@gmail.com", "password": "Password123!"}
    ]
    
    print("=== TEACHER LOGIN TEST ===")
    
    for creds in teacher_credentials:
        print(f"\nTesting login for: {creds['email']}")
        
        try:
            response = requests.post(login_url, json=creds)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("SUCCESS: Login successful!")
                print(f"User: {data.get('user', {}).get('email')}")
                print(f"Role: {data.get('user', {}).get('role')}")
                print(f"Token: {data.get('access', 'N/A')[:50]}...")
            else:
                print("FAILED: Login failed!")
                print(f"Error: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("ERROR: Connection failed - is the backend running?")
        except Exception as e:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    test_teacher_login()