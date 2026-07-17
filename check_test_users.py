#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
sys.path.append('backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from accounts.models import User
from students.models import Student

def check_test_users():
    print("=== TEST USERS CHECK ===")
    
    # Check Users
    users = User.objects.all()
    print(f"Total Users: {users.count()}")
    
    if users.exists():
        print("\nUsers found:")
        for user in users:
            print(f"  - {user.email} ({user.role}) - {user.get_full_name()}")
    
    # Check Students
    students = Student.objects.all()
    print(f"\nTotal Students: {students.count()}")
    
    if students.exists():
        print("\nStudents found:")
        for student in students:
            print(f"  - {student.student_id}: {student.get_full_name()} (Class: {student.current_class})")
            if student.user:
                print(f"    Auth: {student.user.email}")
            print(f"    Login: {student.username} / {student.password}")
    
    # Check for test data
    test_users = users.filter(email__icontains='test')
    test_students = students.filter(student_id__icontains='test')
    
    print(f"\nTest Users: {test_users.count()}")
    print(f"Test Students: {test_students.count()}")

if __name__ == "__main__":
    check_test_users()