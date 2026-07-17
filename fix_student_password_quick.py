#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student
from django.contrib.auth import get_user_model

def fix_student_password():
    """Fix student password to match expected credentials"""
    try:
        student_id = "2025BASIC_9001"
        new_password = "student123"  # Standard password for testing
        
        print(f"Updating password for student: {student_id}")
        
        # Find student
        student = Student.objects.get(student_id=student_id)
        print(f"Found student: {student.first_name} {student.last_name}")
        print(f"Current password: {student.password}")
        
        # Update password
        student.password = new_password
        student.save(update_fields=['password'])
        
        # Also update user password if exists
        if student.user:
            student.user.set_password(new_password)
            student.user.save()
            print("Updated both student and user passwords")
        else:
            print("Updated student password only")
            
        print(f"Password updated to: {new_password}")
        
    except Student.DoesNotExist:
        print("Student not found!")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    fix_student_password()