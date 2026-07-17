#!/usr/bin/env python3
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from accounts.models import User

def fix_teacher_passwords():
    """Update teacher passwords to meet security requirements"""
    
    # Teacher emails and new secure passwords
    teachers = [
        {"email": "teacher@test.com", "password": "Password123!"},
        {"email": "nanaamaadomah18@gmail.com", "password": "Password123!"},
        {"email": "oseielshadai18@gmail.com", "password": "Password123!"}
    ]
    
    print("=== UPDATING TEACHER PASSWORDS ===")
    
    for teacher_data in teachers:
        try:
            user = User.objects.get(email=teacher_data["email"])
            user.set_password(teacher_data["password"])
            user.save()
            print(f"SUCCESS: Updated password for: {teacher_data['email']}")
        except User.DoesNotExist:
            print(f"ERROR: Teacher not found: {teacher_data['email']}")
        except Exception as e:
            print(f"ERROR: Error updating {teacher_data['email']}: {e}")
    
    print("\n=== PASSWORD UPDATE COMPLETE ===")

if __name__ == "__main__":
    fix_teacher_passwords()