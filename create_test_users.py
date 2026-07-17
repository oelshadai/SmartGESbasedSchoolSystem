#!/usr/bin/env python
"""
Quick script to create test users for login testing
"""
import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from django.contrib.auth import get_user_model
from schools.models import School, Class as SchoolClass
from students.models import Student

User = get_user_model()

def create_test_users():
    """Create test users for login testing"""
    
    print("Creating test users for login testing...")
    
    # Create or get test school
    school, created = School.objects.get_or_create(
        name="Test School",
        defaults={
            'address': "123 Test Street",
            'phone': "0123456789",
            'email': "test@school.edu",
            'subscription_plan': 'BASIC'
        }
    )
    if created:
        print(f"✓ Created school: {school.name}")
    else:
        print(f"✓ Using existing school: {school.name}")
    
    # Create test admin
    admin_email = "admin@school.edu"
    if not User.objects.filter(email=admin_email).exists():
        admin = User.objects.create_user(
            email=admin_email,
            password="password123",
            first_name="Admin",
            last_name="User",
            role="SCHOOL_ADMIN",
            school=school,
            is_active=True
        )
        print(f"✓ Created admin: {admin_email} / password123")
    else:
        print(f"✓ Admin already exists: {admin_email}")
    
    # Create test teacher
    teacher_email = "teacher@school.edu"
    if not User.objects.filter(email=teacher_email).exists():
        teacher = User.objects.create_user(
            email=teacher_email,
            password="password123",
            first_name="Test",
            last_name="Teacher",
            role="TEACHER",
            school=school,
            is_active=True
        )
        print(f"✓ Created teacher: {teacher_email} / password123")
    else:
        teacher = User.objects.get(email=teacher_email)
        print(f"✓ Teacher already exists: {teacher_email}")
    
    # Create test class
    test_class, created = SchoolClass.objects.get_or_create(
        name="Test Class",
        school=school,
        defaults={
            'class_teacher': teacher,
            'academic_year': '2024'
        }
    )
    if created:
        print(f"✓ Created class: {test_class.name}")
    else:
        print(f"✓ Using existing class: {test_class.name}")
    
    # Create test student
    student_username = "std_STD001"
    if not Student.objects.filter(username=student_username).exists():
        student = Student.objects.create(
            username=student_username,
            password="password123",  # Will be hashed automatically
            first_name="Test",
            last_name="Student",
            email="student@school.edu",
            class_id=test_class,
            school=school,
            student_id="STD001",
            is_active=True
        )
        print(f"✓ Created student: {student_username} / password123")
    else:
        print(f"✓ Student already exists: {student_username}")
    
    print("\n" + "="*50)
    print("TEST USERS CREATED SUCCESSFULLY!")
    print("="*50)
    print("\nLogin Credentials:")
    print(f"Admin:    {admin_email} / password123")
    print(f"Teacher:  {teacher_email} / password123") 
    print(f"Student:  {student_username} / password123")
    print("\nYou can now test login with these credentials.")
    print("Make sure both backend and frontend servers are running!")

if __name__ == "__main__":
    try:
        create_test_users()
    except Exception as e:
        print(f"Error creating test users: {e}")
        print("Make sure Django is properly configured and database is accessible.")