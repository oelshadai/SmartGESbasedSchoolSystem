#!/usr/bin/env python
"""
Login Diagnostic Script
Run this to quickly diagnose and fix login issues
Usage: python login_diagnostic.py
"""

import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.core.cache import cache
from students.models import Student
from schools.models import School, Class
import json

User = get_user_model()

def clear_rate_limiting():
    """Clear all rate limiting and lockout cache"""
    print("🔧 Clearing rate limiting cache...")
    cache.clear()
    print("✅ Cache cleared")

def check_user_exists(email):
    """Check if user exists and is active"""
    try:
        user = User.objects.get(email=email)
        print(f"✅ User found: {user.email}")
        print(f"   - Active: {user.is_active}")
        print(f"   - Role: {user.role}")
        print(f"   - School: {user.school.name if user.school else 'None'}")
        return user
    except User.DoesNotExist:
        print(f"❌ User not found: {email}")
        return None

def check_student_exists(student_id):
    """Check if student exists"""
    try:
        student = Student.objects.get(student_id=student_id)
        print(f"✅ Student found: {student.student_id}")
        print(f"   - Name: {student.get_full_name()}")
        print(f"   - Password: {student.password}")
        print(f"   - Class: {student.current_class.level if student.current_class else 'None'}")
        print(f"   - User Account: {'Yes' if student.user else 'No'}")
        return student
    except Student.DoesNotExist:
        print(f"❌ Student not found: {student_id}")
        return None

def create_test_teacher():
    """Create a test teacher account"""
    print("🔧 Creating test teacher account...")
    
    # Get or create a school
    school, created = School.objects.get_or_create(
        name="Test School",
        defaults={
            'address': 'Test Address',
            'phone': '1234567890',
            'email': 'admin@testschool.edu'
        }
    )
    
    # Create teacher
    try:
        user = User.objects.create_user(
            email='teacher@test.com',
            password='Password123!',
            first_name='Test',
            last_name='Teacher',
            role='TEACHER',
            school=school
        )
        print("✅ Test teacher created:")
        print(f"   - Email: teacher@test.com")
        print(f"   - Password: Password123!")
        print(f"   - Role: TEACHER")
        return user
    except Exception as e:
        print(f"❌ Failed to create teacher: {e}")
        return None

def create_test_student():
    """Create a test student account"""
    print("🔧 Creating test student account...")
    
    # Get or create school and class
    school, _ = School.objects.get_or_create(
        name="Test School",
        defaults={
            'address': 'Test Address',
            'phone': '1234567890',
            'email': 'admin@testschool.edu'
        }
    )
    
    class_obj, _ = Class.objects.get_or_create(
        level="Grade 9",
        school=school,
        defaults={'section': 'A'}
    )
    
    try:
        student = Student.objects.create(
            student_id='STD001',
            first_name='Test',
            last_name='Student',
            password='Password123!',
            school=school,
            current_class=class_obj
        )
        print("✅ Test student created:")
        print(f"   - Student ID: STD001")
        print(f"   - Password: Password123!")
        print(f"   - Class: {class_obj.level}")
        return student
    except Exception as e:
        print(f"❌ Failed to create student: {e}")
        return None

def reset_user_password(email, new_password='Password123!'):
    """Reset user password"""
    try:
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()
        print(f"✅ Password reset for {email}")
        print(f"   - New password: {new_password}")
        return True
    except User.DoesNotExist:
        print(f"❌ User not found: {email}")
        return False

def test_api_connectivity():
    """Test API connectivity"""
    print("🔧 Testing API connectivity...")
    
    import requests
    
    api_urls = [
        'http://localhost:8000/api/auth/login/',
        'https://school-report-saas.onrender.com/api/auth/login/'
    ]
    
    for url in api_urls:
        try:
            response = requests.post(url, 
                json={'email': 'test@example.com', 'password': 'test'},
                timeout=5
            )
            print(f"✅ API reachable: {url} (Status: {response.status_code})")
        except requests.exceptions.RequestException as e:
            print(f"❌ API unreachable: {url} - {e}")

def main():
    print("🚀 School Management System - Login Diagnostic Tool")
    print("=" * 60)
    
    while True:
        print("\nSelect an option:")
        print("1. Clear rate limiting cache")
        print("2. Check if user exists (staff)")
        print("3. Check if student exists")
        print("4. Create test teacher account")
        print("5. Create test student account")
        print("6. Reset user password")
        print("7. Test API connectivity")
        print("8. Run full diagnostic")
        print("9. Exit")
        
        choice = input("\nEnter your choice (1-9): ").strip()
        
        if choice == '1':
            clear_rate_limiting()
            
        elif choice == '2':
            email = input("Enter email address: ").strip()
            check_user_exists(email)
            
        elif choice == '3':
            student_id = input("Enter student ID: ").strip()
            check_student_exists(student_id)
            
        elif choice == '4':
            create_test_teacher()
            
        elif choice == '5':
            create_test_student()
            
        elif choice == '6':
            email = input("Enter email address: ").strip()
            password = input("Enter new password (or press Enter for 'Password123!'): ").strip()
            if not password:
                password = 'Password123!'
            reset_user_password(email, password)
            
        elif choice == '7':
            test_api_connectivity()
            
        elif choice == '8':
            print("\n🔍 Running full diagnostic...")
            clear_rate_limiting()
            test_api_connectivity()
            
            # Check for existing test accounts
            print("\n📋 Checking existing test accounts...")
            check_user_exists('teacher@test.com')
            check_student_exists('STD001')
            
            print("\n✅ Full diagnostic complete!")
            
        elif choice == '9':
            print("👋 Goodbye!")
            break
            
        else:
            print("❌ Invalid choice. Please try again.")

if __name__ == '__main__':
    main()