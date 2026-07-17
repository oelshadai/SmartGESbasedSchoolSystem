#!/usr/bin/env python3
"""
Create the specific student account with credentials: std_2025BASIC_9004 / 8AuoU2
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

def create_specific_student():
    """Create the specific student account"""
    
    # Get or create a test school
    school, created = School.objects.get_or_create(
        name="Elite Academy",
        defaults={
            'address': '123 Education Street',
            'location': 'Academic City',
            'phone_number': '1234567890',
            'email': 'admin@eliteacademy.edu',
            'is_active': True
        }
    )
    
    if created:
        print(f"Created school: {school.name}")
    else:
        print(f"Using existing school: {school.name}")
    
    # Get or create a test class
    test_class, created = Class.objects.get_or_create(
        school=school,
        level="Grade 12",
        defaults={
            'section': 'A',
            'capacity': 30
        }
    )
    
    if created:
        print(f"Created class: {test_class.level}")
    else:
        print(f"Using existing class: {test_class.level}")
    
    # Student credentials
    student_id = "std_2025BASIC_9004"
    username = "std_2025BASIC_9004"
    password = "8AuoU2"
    
    # Check if student already exists
    if Student.objects.filter(student_id=student_id).exists():
        student = Student.objects.get(student_id=student_id)
        print(f"Student already exists: {student.get_full_name()}")
        print(f"Username: {student.username}")
        print(f"Password: {student.password}")
        return
    
    # Create Django user first
    email = f"{username}@eliteacademy.edu"
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'first_name': 'Alex',
            'last_name': 'Johnson',
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
        first_name="Alex",
        last_name="Johnson",
        other_names="Basic",
        gender="M",
        date_of_birth=date(2007, 3, 15),
        current_class=test_class,
        username=username,
        password=password,
        guardian_name="Sarah Johnson",
        guardian_phone="0987654321",
        guardian_email="sarah.johnson@email.com",
        guardian_address="456 Student Avenue",
        admission_date=date(2025, 1, 1)
    )
    
    print(f"\n✅ Student created successfully!")
    print(f"Student ID: {student.student_id}")
    print(f"Name: {student.get_full_name()}")
    print(f"Class: {student.current_class.level}")
    print(f"Username: {student.username}")
    print(f"Password: {student.password}")
    print(f"\n🔗 Login URL: http://localhost:3000/student-portal")
    print(f"Use these exact credentials:")
    print(f"Username: {username}")
    print(f"Password: {password}")

if __name__ == "__main__":
    try:
        create_specific_student()
    except Exception as e:
        print(f"Error creating student: {e}")
        import traceback
        traceback.print_exc()