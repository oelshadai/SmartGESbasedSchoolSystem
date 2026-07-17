#!/usr/bin/env python3
"""
Fix student user account password
"""
import os
import sys
import django

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student

def fix_student_password():
    """Fix student user account password"""
    
    try:
        student = Student.objects.get(student_id="STD001")
        print(f"Found student: {student.get_full_name()}")
        
        if student.user:
            # Set the password properly in Django user
            student.user.set_password(student.password)
            student.user.save()
            print(f"✅ Updated Django user password for {student.user.email}")
            print(f"Password: {student.password}")
            
            # Test authentication
            from django.contrib.auth import authenticate
            auth_user = authenticate(username=student.user.email, password=student.password)
            print(f"Authentication test: {'✅ Success' if auth_user else '❌ Failed'}")
            
        else:
            print("❌ Student has no Django user account")
            
    except Student.DoesNotExist:
        print("❌ Test student not found")

if __name__ == "__main__":
    fix_student_password()