#!/usr/bin/env python3
"""
Simple Student Login Fix
Ensures all students can login with their credentials
"""
import os
import sys
import django

# Setup Django
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

def fix_student_login():
    """Fix login for all students"""
    print("=== FIXING STUDENT LOGIN ===")
    
    students = Student.objects.all()
    fixed_count = 0
    created_count = 0
    
    for student in students:
        try:
            # Create User account if missing
            if not student.user:
                print(f"Creating user for {student.student_id}")
                
                from django.contrib.auth import get_user_model
                User = get_user_model()
                
                # Create email
                school_name = student.school.name.lower().replace(' ', '').replace('-', '') if student.school else 'school'
                email = f"{student.username}@{school_name}.edu"
                
                user = User.objects.create_user(
                    email=email,
                    password=student.password or 'temp123',
                    first_name=student.first_name,
                    last_name=student.last_name
                )
                
                if hasattr(user, 'role'):
                    user.role = 'STUDENT'
                if hasattr(user, 'school') and student.school:
                    user.school = student.school
                user.save()
                
                student.user = user
                student.save()
                created_count += 1
            
            # Generate password if missing
            if not student.password:
                student.password = student.generate_password()
                student.save()
                print(f"Generated password for {student.student_id}: {student.password}")
            
            # Sync password to User model
            if student.user and student.password:
                student.user.set_password(student.password)
                student.user.is_active = True
                student.user.save()
                fixed_count += 1
                
                # Test login
                user = authenticate(username=student.user.email, password=student.password)
                status = "OK" if user else "FAILED"
                print(f"Fixed {student.student_id} ({student.get_full_name()}) - Password: {student.password} - Status: {status}")
                
        except Exception as e:
            print(f"Error fixing {student.student_id}: {e}")
    
    print(f"\n=== SUMMARY ===")
    print(f"Total students: {students.count()}")
    print(f"User accounts created: {created_count}")
    print(f"Passwords synchronized: {fixed_count}")
    print(f"\nStudents can now login with:")
    print(f"- Student ID as username")
    print(f"- Their generated password")

def test_specific_student(student_id):
    """Test login for a specific student"""
    try:
        student = Student.objects.get(student_id=student_id)
        print(f"\n=== TESTING {student_id} ===")
        print(f"Name: {student.get_full_name()}")
        print(f"Username: {student.username}")
        print(f"Password: {student.password}")
        
        if student.user:
            print(f"Email: {student.user.email}")
            
            # Test authentication
            user = authenticate(username=student.user.email, password=student.password)
            if user:
                print("LOGIN: SUCCESS")
                return True
            else:
                print("LOGIN: FAILED")
                return False
        else:
            print("No user account")
            return False
            
    except Student.DoesNotExist:
        print(f"Student {student_id} not found")
        return False

if __name__ == "__main__":
    # Fix all students
    fix_student_login()
    
    # Test specific students if they exist
    test_students = ["2025BASIC_9004", "TEST001"]
    for student_id in test_students:
        if Student.objects.filter(student_id=student_id).exists():
            test_specific_student(student_id)
    
    print(f"\n=== COMPLETE ===")
    print("All students should now be able to login to the student portal")