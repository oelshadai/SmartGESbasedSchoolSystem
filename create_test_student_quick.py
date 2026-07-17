#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from django.contrib.auth.models import User
from students.models import Student
from schools.models import School, Class

def create_test_student():
    """Create a test student for login testing"""
    try:
        # Create or get a test school
        school, created = School.objects.get_or_create(
            name="Test School",
            defaults={
                'address': 'Test Address',
                'phone': '1234567890',
                'email': 'test@school.com'
            }
        )
        
        # Create or get a test class
        test_class, created = Class.objects.get_or_create(
            level="Grade 10",
            school=school,
            defaults={'section': 'A'}
        )
        
        # Create or get test user
        username = 'std_test123'
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': 'student@test.com',
                'first_name': 'Test',
                'last_name': 'Student'
            }
        )
        
        if created:
            user.set_password('password123')
            user.save()
            print(f"Created user: {username}")
        else:
            # Reset password for existing user
            user.set_password('password123')
            user.save()
            print(f"Reset password for existing user: {username}")
        
        # Create or get student
        student, created = Student.objects.get_or_create(
            student_id='std_test123',
            defaults={
                'user': user,
                'first_name': 'Test',
                'last_name': 'Student',
                'current_class': test_class,
                'school': school,
                'date_of_birth': '2005-01-01',
                'gender': 'M',
                'address': 'Test Address'
            }
        )
        
        if created:
            print(f"Created student: {student.student_id}")
        else:
            # Update existing student
            student.user = user
            student.current_class = test_class
            student.school = school
            student.save()
            print(f"Updated existing student: {student.student_id}")
        
        print("\n=== Test Student Created Successfully ===")
        print(f"Username/Student ID: {student.student_id}")
        print(f"Password: password123")
        print(f"Name: {student.get_full_name()}")
        print(f"Class: {student.current_class}")
        print("=====================================\n")
        
        return True
        
    except Exception as e:
        print(f"Error creating test student: {e}")
        return False

if __name__ == "__main__":
    create_test_student()