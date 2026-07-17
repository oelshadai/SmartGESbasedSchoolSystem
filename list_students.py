#!/usr/bin/env python3
"""
List all students in the database
"""
import os
import sys
import django

# Setup Django
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student

def list_all_students():
    print("All students in database:")
    print("-" * 50)
    
    students = Student.objects.all()
    
    if not students:
        print("No students found in database")
        return
    
    for student in students:
        print(f"ID: {student.student_id}")
        print(f"Name: {student.get_full_name()}")
        print(f"Email: {student.user.email if student.user else 'No email'}")
        print(f"Class: {student.current_class.level if student.current_class else 'No class assigned'}")
        print(f"Guardian Email: {student.guardian_email or 'Not provided'}")
        print(f"Has User: {'Yes' if student.user else 'No'}")
        print(f"Username: {student.username or 'Not set'}")
        print(f"Password: {student.password or 'Not set'}")
        print("-" * 30)

if __name__ == "__main__":
    list_all_students()