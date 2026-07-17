#!/usr/bin/env python3
"""
Create a test student for production testing
"""
import os
import sys
import django
from datetime import date

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student
from schools.models import School, Class
from django.contrib.auth import get_user_model

User = get_user_model()

def create_test_student():
    """Create a test student for production testing"""
    try:
        # Get or create a school
        school, created = School.objects.get_or_create(
            name="Test School",
            defaults={
                'address': 'Test Address',
                'phone': '1234567890',
                'email': 'test@school.edu',
                'levels': ['PRIMARY', 'SECONDARY']
            }
        )
        print(f"School: {school.name} ({'created' if created else 'exists'})")
        
        # Get or create a class
        test_class, created = Class.objects.get_or_create(
            school=school,
            level="Grade 10",
            defaults={
                'section': 'A',
                'capacity': 30
            }
        )
        print(f"Class: {test_class} ({'created' if created else 'exists'})")
        
        # Create test student
        student_id = "STD001"
        
        # Delete existing student if exists
        Student.objects.filter(student_id=student_id).delete()
        User.objects.filter(email__icontains=f"std_{student_id}").delete()
        
        student = Student.objects.create(
            school=school,
            student_id=student_id,
            first_name="John",
            last_name="Doe",
            gender="M",
            date_of_birth=date(2008, 5, 15),
            current_class=test_class,
            guardian_name="Jane Doe",
            guardian_phone="1234567890",
            guardian_address="123 Test Street",
            admission_date=date.today(),
            password="test123"  # Simple password for testing
        )
        
        print(f"\n✅ Test student created successfully!")
        print(f"Student ID: {student.student_id}")
        print(f"Password: {student.password}")
        print(f"Name: {student.get_full_name()}")
        print(f"Class: {student.current_class}")
        print(f"User Account: {student.user.email if student.user else 'Not created'}")
        
        # Test login credentials
        print(f"\n🔐 Login Credentials:")
        print(f"Student ID: {student.student_id}")
        print(f"Password: {student.password}")
        
        return student
        
    except Exception as e:
        print(f"❌ Error creating test student: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    print("Creating test student for production testing...")
    student = create_test_student()
    if student:
        print(f"\n🎉 Ready for testing!")
        print(f"Use Student ID: {student.student_id} and Password: {student.password}")