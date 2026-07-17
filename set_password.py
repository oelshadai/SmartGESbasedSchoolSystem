#!/usr/bin/env python3
"""
Interactive password setting script
Allows setting any password for any student ID with proper hashing
"""
import os
import sys
import django
import hashlib

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student
from django.contrib.auth import get_user_model

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def set_student_password():
    """Interactive password setting"""
    print("=== Student Password Setting Tool ===")
    print("This tool allows you to set any password for any student.")
    print()
    
    # Get student ID
    student_id = input("Enter Student ID: ").strip()
    if not student_id:
        print("❌ Student ID cannot be empty")
        return
    
    # Get new password
    new_password = input("Enter new password: ").strip()
    if not new_password:
        print("❌ Password cannot be empty")
        return
    
    try:
        # Find student
        student = Student.objects.get(student_id=student_id)
        print(f"\n✅ Found student: {student.first_name} {student.last_name}")
        
        # Hash and store password
        hashed_password = hash_password(new_password)
        student.password = hashed_password
        student.save(update_fields=['password'])
        
        # Also update Django user password if exists
        if student.user:
            student.user.set_password(new_password)
            student.user.save()
            print("✅ Updated both student and Django user passwords")
        else:
            print("✅ Updated student password (no Django user found)")
        
        print(f"\n🔐 Password successfully set!")
        print(f"Student ID: {student_id}")
        print(f"New Password: {new_password}")
        print(f"Hashed Password: {hashed_password}")
        print("\nThe password has been securely hashed and stored in the database.")
        
    except Student.DoesNotExist:
        print(f"❌ Student with ID '{student_id}' not found!")
        print("Please check the student ID and try again.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    set_student_password()