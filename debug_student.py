#!/usr/bin/env python3
import os
import sys
import django

backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student
from django.contrib.auth.models import User

print("=== Student Debug Info ===")

# List all students
students = Student.objects.all()
print(f"Total students: {students.count()}")

for student in students:
    print(f"\nStudent: {student.get_full_name()}")
    print(f"  Student ID: {student.student_id}")
    print(f"  Has User: {student.user is not None}")
    if student.user:
        print(f"  User ID: {student.user.id}")
        print(f"  Username: {student.user.username}")
        print(f"  Email: {student.user.email}")
        print(f"  User Active: {student.user.is_active}")
    print(f"  Student Password: {getattr(student, 'password', 'None')}")
    print(f"  Username attr: {getattr(student, 'username', 'None')}")
    
    # Test authentication
    if student.user:
        from django.contrib.auth import authenticate
        test_password = getattr(student, 'password', 'student123')
        
        # Try different auth methods
        print(f"  Testing auth with password: {test_password}")
        
        # Method 1: email
        user1 = authenticate(username=student.user.email, password=test_password)
        print(f"  Auth with email: {'SUCCESS' if user1 else 'FAILED'}")
        
        # Method 2: username
        user2 = authenticate(username=student.user.username, password=test_password)
        print(f"  Auth with username: {'SUCCESS' if user2 else 'FAILED'}")
        
        # Method 3: student_id
        user3 = authenticate(username=student.student_id, password=test_password)
        print(f"  Auth with student_id: {'SUCCESS' if user3 else 'FAILED'}")
        
        # Check password directly
        pwd_check = student.user.check_password(test_password)
        print(f"  Direct password check: {'SUCCESS' if pwd_check else 'FAILED'}")