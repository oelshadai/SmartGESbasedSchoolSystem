#!/usr/bin/env python3
"""
Fix student login issues by creating User accounts for students that don't have them
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
from django.contrib.auth import get_user_model
import secrets
import string

User = get_user_model()

def generate_password():
    """Generate a simple 6-character password"""
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(6))

def fix_student_accounts():
    """Create User accounts for students that don't have them"""
    
    students_without_users = Student.objects.filter(user__isnull=True)
    print(f"Found {students_without_users.count()} students without User accounts")
    
    fixed_count = 0
    
    for student in students_without_users:
        try:
            # Generate username and password if not set
            if not student.username:
                student.username = f"std_{student.student_id}"
            
            if not student.password:
                student.password = generate_password()
            
            # Create email using student ID and school domain
            school_domain = student.school.name.lower().replace(' ', '').replace('-', '') if student.school else 'school'
            email = f"{student.username}@{school_domain}.edu"
            
            # Create Django user
            user = User.objects.create_user(
                email=email,
                password=student.password,
                first_name=student.first_name,
                last_name=student.last_name
            )
            
            # Set role and school if the User model supports it
            if hasattr(user, 'role'):
                user.role = 'STUDENT'
            if hasattr(user, 'school') and student.school:
                user.school = student.school
            user.save()
            
            # Link user to student
            student.user = user
            student.save()
            
            print(f"[SUCCESS] Fixed {student.get_full_name()} (ID: {student.student_id})")
            print(f"   Username: {student.username}")
            print(f"   Password: {student.password}")
            print(f"   Email: {email}")
            
            fixed_count += 1
            
        except Exception as e:
            print(f"[ERROR] Failed to fix {student.get_full_name()} (ID: {student.student_id}): {e}")
    
    print(f"\n[SUCCESS] Successfully fixed {fixed_count} student accounts")
    
    # Verify all students now have accounts
    remaining_without_users = Student.objects.filter(user__isnull=True).count()
    if remaining_without_users == 0:
        print("[SUCCESS] All students now have User accounts!")
    else:
        print(f"[WARNING] {remaining_without_users} students still don't have User accounts")

if __name__ == "__main__":
    fix_student_accounts()