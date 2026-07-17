#!/usr/bin/env python3

import os
import sys
import django
from django.contrib.auth.models import User, Group

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_management.settings')
django.setup()

from students.models import Student

def create_student_user_accounts():
    """Create User accounts for all students that don't have them yet"""
    
    # Get or create Students group
    students_group, created = Group.objects.get_or_create(name='Students')
    if created:
        print("✓ Created 'Students' group")
    else:
        print("✓ Found existing 'Students' group")
    
    # Get all students without User accounts
    students_without_users = Student.objects.filter(user__isnull=True)
    
    print(f"\n📊 Found {students_without_users.count()} students without User accounts:")
    
    for student in students_without_users:
        try:
            # Create username from first name and student ID
            username = f"{student.first_name.lower()}.{student.student_id}"
            
            # Create User account
            user = User.objects.create_user(
                username=username,
                email=student.email or f"{username}@school.edu",
                password='student123',  # Default password
                first_name=student.first_name,
                last_name=student.last_name
            )
            
            # Add user to Students group
            user.groups.add(students_group)
            
            # Link user to student
            student.user = user
            student.save()
            
            print(f"✓ Created account for {student.first_name} {student.last_name}")
            print(f"  Username: {username}")
            print(f"  Password: student123")
            print(f"  Email: {user.email}")
            print()
            
        except Exception as e:
            print(f"✗ Failed to create account for {student.first_name} {student.last_name}: {e}")
    
    # Verify the results
    print("\n" + "="*50)
    print("VERIFICATION:")
    print("="*50)
    
    students_with_users = Student.objects.filter(user__isnull=False)
    print(f"✓ Students with User accounts: {students_with_users.count()}")
    
    users_in_students_group = User.objects.filter(groups__name='Students').count()
    print(f"✓ Users in 'Students' group: {users_in_students_group}")
    
    print("\n📋 Student Login Credentials:")
    print("-" * 30)
    for student in Student.objects.filter(user__isnull=False):
        print(f"{student.first_name} {student.last_name}")
        print(f"  Username: {student.user.username}")
        print(f"  Password: student123")
        print(f"  Class: {student.class_enrolled}")
        print()

if __name__ == "__main__":
    create_student_user_accounts()