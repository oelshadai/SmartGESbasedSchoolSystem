#!/usr/bin/env python
import requests
import json

# Test admin login
def test_admin_login():
    url = "http://localhost:8000/api/auth/login/"
    
    # Test data - replace with actual admin credentials
    data = {
        "email": "admin@school.edu",
        "password": "admin123"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Admin login successful")
            return response.json()
        else:
            print("❌ Admin login failed")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    test_admin_login()