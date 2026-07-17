#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student
from accounts.models import User

def check_user_exists(identifier):
    """Check if user exists by student_id or username"""
    
    print(f"Checking for user: {identifier}")
    print("-" * 50)
    
    # Check if it's a student_id (remove 'std_' prefix if present)
    if identifier.startswith('std_'):
        student_id = identifier[4:]  # Remove 'std_' prefix
        username = identifier
    else:
        student_id = identifier
        username = f"std_{identifier}"
    
    # Check in Student model
    try:
        student = Student.objects.get(student_id=student_id)
        print(f"[FOUND] Student found in Student model:")
        print(f"   Student ID: {student.student_id}")
        print(f"   Name: {student.get_full_name()}")
        print(f"   Username: {student.username}")
        print(f"   School: {student.school.name if student.school else 'No school'}")
        print(f"   Class: {student.current_class if student.current_class else 'No class'}")
        print(f"   Active: {student.is_active}")
        
        # Check if associated User exists
        if student.user:
            print(f"   Associated User: {student.user.email}")
            print(f"   User Role: {student.user.role}")
        else:
            print(f"   [WARNING] No associated User account")
        
        return True
        
    except Student.DoesNotExist:
        print(f"[NOT FOUND] Student with ID '{student_id}' not found in Student model")
    
    # Also check in User model directly
    try:
        user = User.objects.get(email__icontains=username)
        print(f"[FOUND] User found in User model:")
        print(f"   Email: {user.email}")
        print(f"   Name: {user.get_full_name()}")
        print(f"   Role: {user.role}")
        print(f"   Active: {user.is_active}")
        return True
        
    except User.DoesNotExist:
        print(f"[NOT FOUND] User with username '{username}' not found in User model")
    
    return False

if __name__ == "__main__":
    # Check for the specific user
    user_identifier = "2025BASIC_9004"
    exists = check_user_exists(user_identifier)
    
    if not exists:
        print(f"\n[SEARCH] Searching for similar users...")
        
        # Search for similar student IDs
        similar_students = Student.objects.filter(student_id__icontains="2025")[:5]
        if similar_students:
            print(f"\nFound {similar_students.count()} students with '2025' in their ID:")
            for student in similar_students:
                print(f"   - {student.student_id}: {student.get_full_name()}")
        
        # Search for similar usernames
        similar_users = User.objects.filter(email__icontains="2025")[:5]
        if similar_users:
            print(f"\nFound {similar_users.count()} users with '2025' in their email:")
            for user in similar_users:
                print(f"   - {user.email}: {user.get_full_name()}")