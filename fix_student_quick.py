#!/usr/bin/env python3
"""
Quick fix for student login issue: std_2025BASIC_9004
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
    student_id = "std_2025BASIC_9004"
    password = "8AuoU2"
    
    print(f"Fixing login for student: {student_id}")
    
    try:
        # Find the student
        student = Student.objects.get(student_id=student_id)
        print(f"✓ Found student: {student.get_full_name()}")
        
        # Check if user exists
        if not student.user:
            print("✗ No User account linked - creating one...")
            
            # Create user account
            user = User.objects.create_user(
                username=student_id,
                email=f"{student_id}@school.edu",
                password=password,
                first_name=student.first_name,
                last_name=student.last_name
            )
            student.user = user
            student.save()
            print(f"✓ Created User account")
        else:
            print(f"✓ User account exists: {student.user.email}")
        
        # Ensure password is set correctly
        if not student.password:
            student.password = password
            student.save()
            print(f"✓ Set student password")
        
        # Sync password to User model
        student.user.set_password(password)
        student.user.is_active = True
        student.user.save()
        print(f"✓ Synced password to User model")
        
        # Test authentication
        auth_user = authenticate(username=student.user.email, password=password)
        if auth_user:
            print(f"✓ Authentication test PASSED")
            return True
        else:
            print(f"✗ Authentication test FAILED")
            return False
            
    except Student.DoesNotExist:
        print(f"✗ Student {student_id} not found")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    success = fix_student_login()
    if success:
        print("\n✓ Student login should now work!")
    else:
        print("\n✗ Failed to fix student login")