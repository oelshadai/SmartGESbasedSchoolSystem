#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student
from schools.models import School, Class, Term
from django.contrib.auth.models import User

def create_test_student():
    """Create a simple test student"""
    try:
        # Get the first school
        school = School.objects.first()
        if not school:
            print("No school found. Please create a school first.")
            return
        
        # Get the first class
        student_class = Class.objects.first()
        if not student_class:
            print("No class found. Please create a class first.")
            return
        
        # Create user account
        username = "teststudent"
        password = "test123"
        
        # Delete existing user if exists
        User.objects.filter(username=username).delete()
        
        user = User.objects.create_user(
            username=username,
            password=password,
            first_name="Test",
            last_name="Student"
        )
        
        # Create student
        student = Student.objects.create(
            user=user,
            school=school,
            student_class=student_class,
            first_name="Test",
            last_name="Student",
            admission_number="TEST001",
            username=username,
            password=password
        )
        
        print("Test student created successfully!")
        print(f"Username: {username}")
        print(f"Password: {password}")
        print(f"Student ID: {student.id}")
        print(f"School: {school.name}")
        print(f"Class: {student_class.name}")
        
    except Exception as e:
        print(f"Error creating student: {e}")

if __name__ == "__main__":
    create_test_student()