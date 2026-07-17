#!/usr/bin/env python3
"""
Create a test student for BS9 class to test the vclass assignment flow
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

def create_bs9_student():
    """Create a test student for BS9 class"""
    
    # Get or create a test school
    school, created = School.objects.get_or_create(
        name="Elite Tech Academy",
        defaults={
            'address': '123 Education Street, Accra',
            'location': 'Accra, Ghana',
            'phone_number': '+233123456789',
            'email': 'info@elitetech.edu.gh',
            'motto': 'Excellence in Education',
            'current_academic_year': '2024/2025',
            'is_active': True
        }
    )
    
    if created:
        print(f"Created school: {school.name}")
    else:
        print(f"Using existing school: {school.name}")
    
    # Get or create BS9 class
    bs9_class, created = Class.objects.get_or_create(
        school=school,
        level="BASIC_9",
        section="A",
        defaults={
            'capacity': 35
        }
    )
    
    if created:
        print(f"Created class: {bs9_class}")
    else:
        print(f"Using existing class: {bs9_class}")
    
    # Create test student for BS9
    student_id = "BS9001"
    username = f"std_{student_id.lower()}"
    password = "bs9test"
    
    # Check if student already exists
    if Student.objects.filter(student_id=student_id).exists():
        student = Student.objects.get(student_id=student_id)
        print(f"Student already exists: {student.get_full_name()}")
        print(f"Username: {student.username}")
        print(f"Password: {student.password}")
        print(f"Class: {student.current_class}")
        return student
    
    # Create Django user first
    email = f"{username}@elitetech.edu.gh"
    user, user_created = User.objects.get_or_create(
        email=email,
        defaults={
            'first_name': 'Kwame',
            'last_name': 'Asante',
            'role': 'STUDENT',
            'school': school
        }
    )
    
    if user_created:
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
        first_name="Kwame",
        last_name="Asante",
        other_names="Kofi",
        gender="M",
        date_of_birth=date(2009, 3, 15),  # Appropriate age for BS9
        current_class=bs9_class,
        username=username,
        password=password,
        guardian_name="Akosua Asante",
        guardian_phone="+233244567890",
        guardian_email="akosua.asante@gmail.com",
        guardian_address="P.O. Box 123, Kumasi, Ghana",
        admission_date=date(2021, 9, 1)
    )
    
    print(f"\nBS9 Test student created successfully!")
    print(f"Student ID: {student.student_id}")
    print(f"Name: {student.get_full_name()}")
    print(f"Class: {student.current_class}")
    print(f"Username: {student.username}")
    print(f"Password: {student.password}")
    print(f"Email: {user.email}")
    print(f"\nStudent Portal URL: http://localhost:3000/student-portal")
    print(f"Use these credentials to test the vclass assignment flow!")
    
    return student

if __name__ == "__main__":
    try:
        create_bs9_student()
    except Exception as e:
        print(f"Error creating BS9 student: {e}")
        import traceback
        traceback.print_exc()