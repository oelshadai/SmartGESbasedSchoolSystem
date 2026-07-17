#!/usr/bin/env python3
"""
Create a simple test student account for testing the student portal
"""
import os
import sys
import django
from datetime import date

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from django.contrib.auth import get_user_model
from schools.models import School, Class
from students.models import Student

User = get_user_model()

def create_simple_student():
    """Create a simple test student account"""
    
    # Get or create a test school
    school, created = School.objects.get_or_create(
        name="Test School",
        defaults={
            'address': 'Test Address',
            'location': 'Test City',
            'phone_number': '1234567890',
            'email': 'test@school.com',
            'is_active': True
        }
    )
    
    if created:
        print(f"Created test school: {school.name}")
    else:
        print(f"Using existing school: {school.name}")
    
    # Get or create a test class
    test_class, created = Class.objects.get_or_create(
        school=school,
        level="BASIC_5",
        defaults={
            'section': 'A',
            'capacity': 30
        }
    )
    
    if created:
        print(f"Created test class: {test_class.level}")
    else:
        print(f"Using existing class: {test_class.level}")
    
    # Create test student
    student_id = "STD001"
    password = "test123"
    email = f"std_{student_id.lower()}@testschool.edu"
    
    # Check if student already exists
    if Student.objects.filter(student_id=student_id).exists():
        student = Student.objects.get(student_id=student_id)
        print(f"Student already exists: {student.get_full_name()}")
        print(f"Student ID: {student.student_id}")
        print(f"Password: {student.password}")
        return
    
    # Create Django user first
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'first_name': 'John',
            'last_name': 'Doe',
            'role': 'STUDENT',
            'school': school
        }
    )
    
    if created:
        user.set_password(password)
        user.save()
        print(f"Created Django user: {email}")
    else:
        print(f"Using existing Django user: {email}")
    
    # Create student profile
    student = Student.objects.create(
        school=school,
        user=user,
        student_id=student_id,
        first_name="John",
        last_name="Doe",
        other_names="Test",
        gender="M",
        date_of_birth=date(2010, 1, 15),
        current_class=test_class,
        username=f"std_{student_id}",
        password=password,  # Store plain text for easy testing
        guardian_name="Jane Doe",
        guardian_phone="1234567890",
        guardian_email="jane@example.com",
        guardian_address="123 Test Street",
        admission_date=date(2020, 9, 1)
    )
    
    print(f"\n✅ Test student created successfully!")
    print(f"Student ID: {student.student_id}")
    print(f"Name: {student.get_full_name()}")
    print(f"Class: {student.current_class.level}")
    print(f"Password: {student.password}")
    print(f"\n🔗 Login URL: http://localhost:3000/student-portal")
    print(f"Use Student ID: {student.student_id}")
    print(f"Use Password: {student.password}")

if __name__ == "__main__":
    try:
        create_simple_student()
    except Exception as e:
        print(f"Error creating test student: {e}")
        import traceback
        traceback.print_exc()