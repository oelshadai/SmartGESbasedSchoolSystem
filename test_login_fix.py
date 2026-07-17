import requests
import json

def test_student_login():
    url = "http://127.0.0.1:8000/api/auth/student-login/"
    data = {
        "student_id": "2025BASIC_9001",
        "password": "student123"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("SUCCESS: Login successful!")
        else:
            print("FAILED: Login failed")
            
    except requests.exceptions.ConnectionError:
        print("ERROR: Server not running. Start with: python manage.py runserver")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_student_login()