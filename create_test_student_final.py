#!/usr/bin/env python3
"""
Create a test student for authentication testing
"""
import os
import sys
import django
from datetime import date

# Setup Django
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student
from schools.models import School, Class
from django.contrib.auth import get_user_model

User = get_user_model()

def create_test_student():
    try:
        # Get or create a school
        school, created = School.objects.get_or_create(
            name="Test School",
            defaults={
                'address': '123 Test Street',
                'phone': '123-456-7890',
                'email': 'test@school.com',
                'website': 'https://testschool.com'
            }
        )
        
        if created:
            print(f"Created school: {school.name}")
        else:
            print(f"Using existing school: {school.name}")
        
        # Get or create a class
        test_class, created = Class.objects.get_or_create(
            school=school,
            level="Grade 10A",
            defaults={
                'section': 'A',
                'capacity': 30
            }
        )
        
        if created:
            print(f"Created class: {test_class.level}")
        else:
            print(f"Using existing class: {test_class.level}")
        
        # Create test student
        student_data = {
            'school': school,
            'student_id': 'STD001',
            'first_name': 'John',
            'last_name': 'Doe',
            'other_names': 'Michael',
            'gender': 'M',
            'date_of_birth': date(2008, 5, 15),
            'current_class': test_class,
            'guardian_name': 'Jane Doe',
            'guardian_phone': '123-456-7890',
            'guardian_email': 'jane.doe@email.com',
            'guardian_address': '123 Main Street, City, State',
            'admission_date': date(2023, 9, 1),
            'username': 'std_STD001',
            'password': 'test123'
        }
        
        # Check if student already exists
        existing_student = Student.objects.filter(student_id='STD001').first()
        if existing_student:
            print(f"Student {existing_student.student_id} already exists")
            print(f"Username: {existing_student.username}")
            print(f"Password: {existing_student.password}")
            return existing_student
        
        # Create the student
        student = Student.objects.create(**student_data)
        
        print(f"Successfully created student:")
        print(f"  Student ID: {student.student_id}")
        print(f"  Name: {student.get_full_name()}")
        print(f"  Username: {student.username}")
        print(f"  Password: {student.password}")
        print(f"  Class: {student.current_class.level}")
        print(f"  School: {student.school.name}")
        
        if student.user:
            print(f"  Django User Email: {student.user.email}")
            print(f"  Django User Role: {getattr(student.user, 'role', 'Not set')}")
        else:
            print("  Warning: No Django user account created")
        
        return student
        
    except Exception as e:
        print(f"Error creating student: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    create_test_student()