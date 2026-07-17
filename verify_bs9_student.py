#!/usr/bin/env python3
"""
Verify BS9 student creation and display login credentials
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

from students.models import Student
from schools.models import Class

def verify_bs9_student():
    """Verify the BS9 student exists and show credentials"""
    
    try:
        # Find BS9 student
        student = Student.objects.get(student_id="BS9001")
        
        print("=" * 50)
        print("BS9 STUDENT VERIFICATION")
        print("=" * 50)
        print(f"Student ID: {student.student_id}")
        print(f"Full Name: {student.get_full_name()}")
        print(f"Class: {student.current_class}")
        print(f"School: {student.school.name}")
        print(f"Username: {student.username}")
        print(f"Password: {student.password}")
        print(f"Email: {student.user.email}")
        print(f"User Role: {student.user.role}")
        print(f"Active: {student.is_active}")
        print(f"Guardian: {student.guardian_name}")
        print(f"Guardian Phone: {student.guardian_phone}")
        
        print("\n" + "=" * 50)
        print("LOGIN CREDENTIALS FOR TESTING")
        print("=" * 50)
        print(f"Portal URL: http://localhost:3000/student-portal")
        print(f"Username: {student.username}")
        print(f"Password: {student.password}")
        
        # Check if there are any assignments for this class
        print("\n" + "=" * 50)
        print("CLASS INFORMATION")
        print("=" * 50)
        print(f"Class: {student.current_class}")
        print(f"Class Level: {student.current_class.level}")
        print(f"Class Section: {student.current_class.section}")
        print(f"School: {student.current_class.school.name}")
        
        # Count students in the same class
        classmates = Student.objects.filter(current_class=student.current_class).count()
        print(f"Total students in class: {classmates}")
        
        print("\n" + "=" * 50)
        print("READY FOR VCLASS ASSIGNMENT TESTING!")
        print("=" * 50)
        
    except Student.DoesNotExist:
        print("ERROR: BS9 student (BS9001) not found!")
        print("Please run create_bs9_student.py first")
        
        # Show available students
        students = Student.objects.all()
        if students:
            print("\nAvailable students:")
            for s in students:
                print(f"- {s.student_id}: {s.get_full_name()} ({s.current_class})")
        else:
            print("No students found in database")
    
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify_bs9_student()