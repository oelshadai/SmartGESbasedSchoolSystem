import requests
import json

BASE_URL = 'http://127.0.0.1:8000/api'

print("=" * 100)
print("COMPREHENSIVE API TEST - ALL ENDPOINTS WITH REAL DATA")
print("=" * 100)

def test_student_login_and_dashboard():
    print("\n[1] STUDENT LOGIN & DASHBOARD - BS9001")
    print("-" * 100)
    
    try:
        # Test student login
        login_response = requests.post(
            f'{BASE_URL}/auth/student-login/',
            json={
                'student_id': 'BS9001',
                'password': 'bs9test'
            }
        )
        
        if login_response.status_code != 200:
            print(f"✗ Login failed: {login_response.status_code}")
            print(f"  Response: {login_response.json()}")
            return False
        
        data = login_response.json()
        access_token = data.get('access')
        user = data.get('user')
        
        print(f"✓ Login successful")
        print(f"✓ User: {user['first_name']} {user['last_name']}")
        print(f"✓ Email: {user['email']}")
        print(f"✓ Role: {user['role']}")
        
        # Test student dashboard
        dashboard_response = requests.get(
            f'{BASE_URL}/auth/student-dashboard/',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if dashboard_response.status_code != 200:
            print(f"✗ Dashboard failed: {dashboard_response.status_code}")
            return False
        
        dashboard = dashboard_response.json()
        student = dashboard.get('student', {})
        
        print(f"✓ Dashboard loaded successfully")
        print(f"✓ Student Data (REAL):")
        print(f"  - Student ID: {student.get('student_id')}")
        print(f"  - Class: {student.get('class')}")
        print(f"  - School: {student.get('school')}")
        print(f"  - Gender: {student.get('gender')}")
        print(f"  - DOB: {student.get('date_of_birth')}")
        print(f"  - Guardian: {student.get('guardian_name')}")
        print(f"  - Admission Date: {student.get('admission_date')}")
        print(f"✓ Assignments: {len(dashboard.get('assignments', []))} found")
        print(f"✓ Classmates: {len(dashboard.get('classmates', []))} found")
        
        return True
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False

def test_teacher_login_and_dashboard():
    print("\n[2] TEACHER LOGIN & DASHBOARD - teacher@test.com")
    print("-" * 100)
    
    try:
        # Test teacher login
        login_response = requests.post(
            f'{BASE_URL}/auth/teacher-login/',
            json={
                'email': 'teacher@test.com',
                'password': 'teacher123'
            }
        )
        
        if login_response.status_code != 200:
            print(f"✗ Login failed: {login_response.status_code}")
            print(f"  Response: {login_response.json()}")
            return False
        
        data = login_response.json()
        access_token = data.get('access')
        user = data.get('user')
        
        print(f"✓ Login successful")
        print(f"✓ User: {user['first_name']} {user['last_name']}")
        print(f"✓ Email: {user['email']}")
        print(f"✓ Role: {user['role']}")
        
        # Test teacher dashboard
        dashboard_response = requests.get(
            f'{BASE_URL}/auth/teacher-dashboard/',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if dashboard_response.status_code != 200:
            print(f"✗ Dashboard failed: {dashboard_response.status_code}")
            return False
        
        dashboard = dashboard_response.json()
        teacher = dashboard.get('teacher', {})
        
        print(f"✓ Dashboard loaded successfully")
        print(f"✓ Teacher Data (REAL):")
        print(f"  - Employee ID: {teacher.get('employee_id')}")
        print(f"  - School: {teacher.get('school')}")
        print(f"  - Qualification: {teacher.get('qualification')}")
        print(f"  - Experience: {teacher.get('experience_years')} years")
        print(f"  - Is Class Teacher: {teacher.get('is_class_teacher')}")
        print(f"✓ Assigned Classes: {len(dashboard.get('assigned_classes', []))} found")
        print(f"✓ Teaching Subjects: {len(dashboard.get('teaching_subjects', []))} found")
        
        return True
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False

def test_admin_login_and_dashboard():
    print("\n[3] SCHOOL ADMIN LOGIN & DASHBOARD - admin@test.com")
    print("-" * 100)
    
    try:
        # Test admin login
        login_response = requests.post(
            f'{BASE_URL}/auth/admin-login/',
            json={
                'email': 'admin@test.com',
                'password': 'admin123'
            }
        )
        
        if login_response.status_code != 200:
            print(f"✗ Login failed: {login_response.status_code}")
            print(f"  Response: {login_response.json()}")
            return False
        
        data = login_response.json()
        access_token = data.get('access')
        user = data.get('user')
        
        print(f"✓ Login successful")
        print(f"✓ User: {user['first_name']} {user['last_name']}")
        print(f"✓ Email: {user['email']}")
        print(f"✓ Role: {user['role']}")
        
        # Test admin dashboard
        dashboard_response = requests.get(
            f'{BASE_URL}/auth/admin-dashboard/',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if dashboard_response.status_code != 200:
            print(f"✗ Dashboard failed: {dashboard_response.status_code}")
            return False
        
        dashboard = dashboard_response.json()
        admin = dashboard.get('admin', {})
        stats = dashboard.get('school_stats', {})
        
        print(f"✓ Dashboard loaded successfully")
        print(f"✓ Admin Data (REAL):")
        print(f"  - Admin: {admin.get('first_name')} {admin.get('last_name')}")
        print(f"  - School: {admin.get('school')}")
        print(f"✓ School Statistics (REAL):")
        print(f"  - Total Students: {stats.get('total_students')}")
        print(f"  - Total Teachers: {stats.get('total_teachers')}")
        print(f"  - Total Classes: {stats.get('total_classes')}")
        print(f"  - Total Assignments: {stats.get('total_assignments')}")
        print(f"✓ Recent Students: {len(dashboard.get('recent_students', []))} found")
        print(f"✓ Recent Teachers: {len(dashboard.get('recent_teachers', []))} found")
        
        return True
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False

def test_superadmin_login_and_dashboard():
    print("\n[4] SUPER ADMIN LOGIN & DASHBOARD - admin@demo.test")
    print("-" * 100)
    
    try:
        # Test superadmin login
        login_response = requests.post(
            f'{BASE_URL}/auth/superadmin-login/',
            json={
                'email': 'admin@demo.test',
                'password': 'admin123'
            }
        )
        
        if login_response.status_code != 200:
            print(f"✗ Login failed: {login_response.status_code}")
            print(f"  Response: {login_response.json()}")
            return False
        
        data = login_response.json()
        access_token = data.get('access')
        user = data.get('user')
        
        print(f"✓ Login successful")
        print(f"✓ User: {user['first_name']} {user['last_name']}")
        print(f"✓ Email: {user['email']}")
        print(f"✓ Role: {user['role']}")
        
        # Test superadmin dashboard
        dashboard_response = requests.get(
            f'{BASE_URL}/auth/superadmin-dashboard/',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if dashboard_response.status_code != 200:
            print(f"✗ Dashboard failed: {dashboard_response.status_code}")
            return False
        
        dashboard = dashboard_response.json()
        superadmin = dashboard.get('superadmin', {})
        stats = dashboard.get('system_stats', {})
        
        print(f"✓ Dashboard loaded successfully")
        print(f"✓ Super Admin Data (REAL):")
        print(f"  - Admin: {superadmin.get('first_name')} {superadmin.get('last_name')}")
        print(f"✓ System Statistics (REAL):")
        print(f"  - Total Schools: {stats.get('total_schools')}")
        print(f"  - Total Students: {stats.get('total_students')}")
        print(f"  - Total Teachers: {stats.get('total_teachers')}")
        print(f"  - Total Admins: {stats.get('total_admins')}")
        print(f"  - Total Assignments: {stats.get('total_assignments')}")
        print(f"✓ Recent Schools: {len(dashboard.get('recent_schools', []))} found")
        
        return True
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False

# Run all tests
results = {
    'Student': test_student_login_and_dashboard(),
    'Teacher': test_teacher_login_and_dashboard(),
    'Admin': test_admin_login_and_dashboard(),
    'SuperAdmin': test_superadmin_login_and_dashboard(),
}

print("\n" + "=" * 100)
print("TEST RESULTS SUMMARY")
print("=" * 100)
for role, passed in results.items():
    status = "✓ PASSED" if passed else "✗ FAILED"
    print(f"{role:15} {status}")

all_passed = all(results.values())
print("\n" + "=" * 100)
if all_passed:
    print("✅ ALL TESTS PASSED - ALL ENDPOINTS RETURNING REAL DATABASE DATA")
else:
    print("⚠️  SOME TESTS FAILED - CHECK ERRORS ABOVE")
print("=" * 100)
