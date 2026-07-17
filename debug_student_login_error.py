#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student
from django.contrib.auth import get_user_model
import traceback

def debug_student_login():
    """Debug the student login issue"""
    try:
        student_id = "2025BASIC_9001"
        password = "student123"
        
        print(f"Looking for student with ID: {student_id}")
        
        # Find student
        try:
            student = Student.objects.select_related('user', 'current_class', 'school').get(
                student_id=student_id
            )
            print(f"Found student: {student.first_name} {student.last_name}")
            print(f"Student password: {student.password}")
            print(f"Student user: {student.user}")
            print(f"Student school: {student.school}")
            
        except Student.DoesNotExist:
            print("Student not found!")
            return
        
        # Check password
        password_valid = False
        if student.password and student.password == password:
            password_valid = True
            print("Password matches plain text")
        elif student.user and student.user.check_password(password):
            password_valid = True
            print("Password matches hashed")
        else:
            print("Password does not match")
            
        if not password_valid:
            print("Invalid password, stopping")
            return
            
        # Test user creation if needed
        if not student.user:
            print("Creating user account...")
            try:
                User = get_user_model()
                email = f"student_{student.student_id}@school.edu"
                print(f"Creating user with email: {email}")
                
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    first_name=student.first_name,
                    last_name=student.last_name
                )
                user.role = 'STUDENT'
                if student.school:
                    user.school = student.school
                user.save()
                
                student.user = user
                student.save(update_fields=['user'])
                print("User created successfully")
                
            except Exception as e:
                print(f"User creation error: {str(e)}")
                traceback.print_exc()
                return
        
        # Test token generation
        print("Testing token generation...")
        try:
            from rest_framework_simplejwt.tokens import RefreshToken
            
            refresh = RefreshToken.for_user(student.user)
            access = refresh.access_token
            
            print("Tokens generated successfully")
            print(f"Access token: {str(access)[:50]}...")
            print(f"Refresh token: {str(refresh)[:50]}...")
            
        except Exception as e:
            print(f"Token generation error: {str(e)}")
            traceback.print_exc()
            
    except Exception as e:
        print(f"Debug error: {str(e)}")
        traceback.print_exc()

if __name__ == "__main__":
    debug_student_login()