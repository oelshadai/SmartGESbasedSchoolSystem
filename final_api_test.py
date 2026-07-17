import requests
import json

BASE_URL = 'http://127.0.0.1:8000/api'

print('='*100)
print('FINAL API TEST - ALL ENDPOINTS WITH REAL DATA')
print('='*100)

results = {}

# Test 1: Student
print('\n[1] STUDENT LOGIN & DASHBOARD')
print('-'*100)
try:
    student_resp = requests.post(f'{BASE_URL}/auth/student-login/', json={'student_id': 'BS9001', 'password': 'bs9test'})
    if student_resp.status_code == 200:
        print('[OK] Login successful')
        student_data = student_resp.json()['user']
        print('     Student: {} {}'.format(student_data['first_name'], student_data['last_name']))
        print('     Email: {}'.format(student_data['email']))
        access_token = student_resp.json()['access']
        dashboard = requests.get(f'{BASE_URL}/students/auth/dashboard/', headers={'Authorization': 'Bearer ' + access_token})
        if dashboard.status_code == 200:
            print('[OK] Dashboard loaded')
            dash_data = dashboard.json()['student']
            print('     Class: {}'.format(dash_data['class']))
            print('     School: {}'.format(dash_data['school']))
            print('     Guardian: {}'.format(dash_data['guardian_name']))
            results['Student'] = True
        else:
            print('[FAIL] Dashboard failed (status {})'.format(dashboard.status_code))
            results['Student'] = False
    else:
        print('[FAIL] Login failed (status {})'.format(student_resp.status_code))
        results['Student'] = False
except Exception as e:
    print('[ERROR] {}'.format(str(e)))
    results['Student'] = False

# Test 2: Teacher
print('\n[2] TEACHER LOGIN & DASHBOARD')
print('-'*100)
try:
    teacher_resp = requests.post(f'{BASE_URL}/auth/teacher-login/', json={'email': 'teacher@test.com', 'password': 'teacher123'})
    if teacher_resp.status_code == 200:
        print('[OK] Login successful')
        teacher_data = teacher_resp.json()['user']
        print('     Teacher: {} {}'.format(teacher_data['first_name'], teacher_data['last_name']))
        print('     Email: {}'.format(teacher_data['email']))
        access_token = teacher_resp.json()['access']
        dashboard = requests.get(f'{BASE_URL}/auth/teacher-dashboard/', headers={'Authorization': 'Bearer ' + access_token})
        if dashboard.status_code == 200:
            print('[OK] Dashboard loaded')
            dash_data = dashboard.json()['teacher']
            print('     Employee ID: {}'.format(dash_data['employee_id']))
            print('     School: {}'.format(dash_data['school']))
            print('     Qualification: {}'.format(dash_data['qualification']))
            results['Teacher'] = True
        else:
            print('[FAIL] Dashboard failed (status {})'.format(dashboard.status_code))
            results['Teacher'] = False
    else:
        print('[FAIL] Login failed (status {})'.format(teacher_resp.status_code))
        results['Teacher'] = False
except Exception as e:
    print('[ERROR] {}'.format(str(e)))
    results['Teacher'] = False

# Test 3: Admin
print('\n[3] SCHOOL ADMIN LOGIN & DASHBOARD')
print('-'*100)
try:
    admin_resp = requests.post(f'{BASE_URL}/auth/admin-login/', json={'email': 'admin@test.com', 'password': 'admin123'})
    if admin_resp.status_code == 200:
        print('[OK] Login successful')
        admin_data = admin_resp.json()['user']
        print('     Admin: {} {}'.format(admin_data['first_name'], admin_data['last_name']))
        print('     Email: {}'.format(admin_data['email']))
        print('     School: {}'.format(admin_data.get('school_name', 'N/A')))
        access_token = admin_resp.json()['access']
        dashboard = requests.get(f'{BASE_URL}/auth/admin-dashboard/', headers={'Authorization': 'Bearer ' + access_token})
        if dashboard.status_code == 200:
            print('[OK] Dashboard loaded')
            dash_data = dashboard.json()['school_stats']
            print('     Students: {}'.format(dash_data['total_students']))
            print('     Teachers: {}'.format(dash_data['total_teachers']))
            print('     Classes: {}'.format(dash_data['total_classes']))
            results['Admin'] = True
        else:
            print('[FAIL] Dashboard failed (status {})'.format(dashboard.status_code))
            results['Admin'] = False
    else:
        print('[FAIL] Login failed (status {})'.format(admin_resp.status_code))
        results['Admin'] = False
except Exception as e:
    print('[ERROR] {}'.format(str(e)))
    results['Admin'] = False

# Test 4: SuperAdmin
print('\n[4] SUPER ADMIN LOGIN & DASHBOARD')
print('-'*100)
try:
    super_resp = requests.post(f'{BASE_URL}/auth/superadmin-login/', json={'email': 'admin@demo.test', 'password': 'admin123'})
    if super_resp.status_code == 200:
        print('[OK] Login successful')
        super_data = super_resp.json()['user']
        print('     Super Admin: {} {}'.format(super_data['first_name'], super_data['last_name']))
        print('     Email: {}'.format(super_data['email']))
        access_token = super_resp.json()['access']
        dashboard = requests.get(f'{BASE_URL}/auth/superadmin-dashboard/', headers={'Authorization': 'Bearer ' + access_token})
        if dashboard.status_code == 200:
            print('[OK] Dashboard loaded')
            dash_data = dashboard.json()['system_stats']
            print('     Schools: {}'.format(dash_data['total_schools']))
            print('     Students: {}'.format(dash_data['total_students']))
            print('     Teachers: {}'.format(dash_data['total_teachers']))
            results['SuperAdmin'] = True
        else:
            print('[FAIL] Dashboard failed (status {})'.format(dashboard.status_code))
            results['SuperAdmin'] = False
    else:
        print('[FAIL] Login failed (status {})'.format(super_resp.status_code))
        results['SuperAdmin'] = False
except Exception as e:
    print('[ERROR] {}'.format(str(e)))
    results['SuperAdmin'] = False

print('\n' + '='*100)
for role, passed in results.items():
    status = '[PASS]' if passed else '[FAIL]'
    print('{} {}'.format(status, role))
print('='*100)

if all(results.values()):
    print('\nSUCCESS: ALL ENDPOINTS RETURNING REAL DATABASE DATA')
else:
    print('\nWARNING: SOME ENDPOINTS FAILED')
