import requests
import json

BASE_URL = 'http://127.0.0.1:8000/api'

print("=" * 100)
print("DEBUGGING DASHBOARD ENDPOINTS")
print("=" * 100)

# Test student dashboard with correct URL
print("\n[1] TESTING STUDENT DASHBOARD - Different URLs")
print("-" * 100)

student_response = requests.post(
    f'{BASE_URL}/auth/student-login/',
    json={'student_id': 'BS9001', 'password': 'bs9test'}
)

if student_response.status_code == 200:
    access_token = student_response.json()['access']
    
    # Try different URLs
    urls = [
        f'{BASE_URL}/auth/student-dashboard/',
        f'{BASE_URL}/students/auth/dashboard/',
        f'{BASE_URL}/students/dashboard/',
    ]
    
    for url in urls:
        resp = requests.get(url, headers={'Authorization': f'Bearer {access_token}'})
        print(f"URL: {url}")
        print(f"  Status: {resp.status_code}")
        if resp.status_code != 200:
            try:
                print(f"  Response: {resp.json()}")
            except:
                print(f"  Response (text): {resp.text[:200]}")
        else:
            data = resp.json()
            print(f"  ✓ Success - Keys: {list(data.keys())}")
        print()

# Test teacher dashboard error
print("\n[2] TESTING TEACHER DASHBOARD - Debug Error")
print("-" * 100)

teacher_response = requests.post(
    f'{BASE_URL}/auth/teacher-login/',
    json={'email': 'teacher@test.com', 'password': 'teacher123'}
)

if teacher_response.status_code == 200:
    access_token = teacher_response.json()['access']
    
    resp = requests.get(
        f'{BASE_URL}/auth/teacher-dashboard/',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    print(f"Status: {resp.status_code}")
    try:
        print(f"Response: {json.dumps(resp.json(), indent=2)}")
    except:
        print(f"Response (text): {resp.text[:500]}")

# Test admin dashboard error
print("\n[3] TESTING ADMIN DASHBOARD - Debug Error")
print("-" * 100)

admin_response = requests.post(
    f'{BASE_URL}/auth/admin-login/',
    json={'email': 'admin@test.com', 'password': 'admin123'}
)

if admin_response.status_code == 200:
    access_token = admin_response.json()['access']
    
    resp = requests.get(
        f'{BASE_URL}/auth/admin-dashboard/',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    print(f"Status: {resp.status_code}")
    try:
        print(f"Response: {json.dumps(resp.json(), indent=2)}")
    except:
        print(f"Response (text): {resp.text[:500]}")
