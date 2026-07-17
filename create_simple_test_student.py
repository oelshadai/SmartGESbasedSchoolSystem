#!/usr/bin/env python3
"""
Create a simple test student for login testing
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

from django.contrib.auth.models import User
from students.models import Student
from schools.models import School, Class as SchoolClass

def create_test_student():
    """Create a test student with proper user account"""
    
    print("Creating test student...")
    
    # Get or create a school
    school, created = School.objects.get_or_create(
        name="Test School",
        defaults={
            'address': 'Test Address',
            'phone': '1234567890',
            'email': 'test@school.com'
        }
    )
    
    if created:
        print(f"Created test school: {school.name}")
    else:
        print(f"Using existing school: {school.name}")
    
    # Get or create a class
    school_class, created = SchoolClass.objects.get_or_create(
        level="Grade 10",
        school=school,
        defaults={'section': 'A'}
    )
    
    if created:
        print(f"Created test class: {school_class.level}")
    else:
        print(f"Using existing class: {school_class.level}")
    
    # Check if test student already exists
    student_id = "STD001"
    if Student.objects.filter(student_id=student_id).exists():
        student = Student.objects.get(student_id=student_id)
        print(f"Test student already exists: {student.get_full_name()}")
    else:
        # Create user account first
        username = student_id
        email = f"{student_id.lower()}@student.school.com"
        password = "student123"
        
        user = User.objects.create_user(
            username=username,
            email=email,
            first_name="Test",
            last_name="Student",
            password=password
        )
        
        # Create student
        student = Student.objects.create(
            student_id=student_id,
            first_name="Test",
            last_name="Student",
            date_of_birth="2005-01-01",
            gender="M",
            current_class=school_class,
            school=school,
            user=user,
            password=password  # Store plain text for testing
        )
        print(f"Created test student: {student.get_full_name()}")
    
    # Display login credentials
    print(f"\nLogin Credentials:")
    print(f"   Student ID: {student.student_id}")
    print(f"   Password: {getattr(student, 'password', 'student123')}")
    print(f"   User Email: {student.user.email if student.user else 'No user account'}")
    
    # Test authentication
    from django.contrib.auth import authenticate
    test_password = getattr(student, 'password', 'student123')
    user = authenticate(username=student.user.email, password=test_password)
    
    if user:
        print(f"Authentication test passed!")
    else:
        print(f"Authentication test failed!")
        # Try to fix it
        student.user.set_password(test_password)
        student.user.save()
        print(f"Fixed password, try again")

if __name__ == "__main__":
    create_test_student()