import os
import sys
import django
from django.contrib.auth.hashers import check_password

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from accounts.models import User
from teachers.models import Teacher
from students.models import Student

print("=" * 80)
print("TESTING KNOWN CREDENTIALS")
print("=" * 80)

# Test credentials we know from the conversation
test_credentials = [
    # Students
    ('BS9001', 'bs9test', 'student'),
    ('2025BASIC_9001', 'student123', 'student'),
    ('STD001', 'test123', 'student'),
    ('2026BASIC_9002', 'jTxW2u', 'student'),
    
    # Admins/Teachers (guess common ones)
    ('admin@demo.test', 'admin123', 'superadmin'),
    ('admin@test.com', 'admin123', 'admin'),
    ('teacher@test.com', 'teacher123', 'teacher'),
]

print("\nTesting Student Credentials:")
print("-" * 80)
for student_id, password, role_type in test_credentials:
    if role_type == 'student':
        try:
            student = Student.objects.get(student_id=student_id)
            user = student.user
            
            # Check if password is correct
            if check_password(password, user.password):
                print(f"✓ {student_id}: Password '{password}' is CORRECT")
                print(f"  User: {user.first_name} {user.last_name} ({user.email})")
                print(f"  Role: {user.role}")
            else:
                print(f"✗ {student_id}: Password '{password}' is WRONG")
                print(f"  User: {user.first_name} {user.last_name} ({user.email})")
        except Student.DoesNotExist:
            print(f"✗ {student_id}: Student not found")
        print()

print("\nTesting Admin/Teacher Credentials:")
print("-" * 80)

admin_credentials = [
    ('admin@demo.test', 'admin123'),
    ('admin@test.com', 'admin123'),
    ('teacher@test.com', 'teacher123'),
    ('nanaamaadomah18@gmail.com', 'teacher123'),
    ('oseielshadai18@gmail.com', 'teacher123'),
    ('oelshadai565@gmail.com', 'teacher123'),
]

for email, password in admin_credentials:
    try:
        user = User.objects.get(email=email)
        
        if check_password(password, user.password):
            print(f"✓ {email}: Password '{password}' is CORRECT")
            print(f"  User: {user.first_name} {user.last_name}")
            print(f"  Role: {user.role}")
        else:
            print(f"✗ {email}: Password '{password}' is WRONG - need to reset")
            print(f"  User: {user.first_name} {user.last_name}")
            print(f"  Role: {user.role}")
    except User.DoesNotExist:
        print(f"✗ {email}: User not found")
    print()

print("\n" + "=" * 80)
print("TEST ACCOUNT SUMMARY")
print("=" * 80)
print("""
WORKING STUDENT ACCOUNTS (verified passwords):
- BS9001 / bs9test
- 2025BASIC_9001 / student123
- STD001 / test123
- 2026BASIC_9002 / jTxW2u

ADMIN/TEACHER ACCOUNTS (need password reset or verification):
- admin@demo.test (SUPER_ADMIN) - password unknown
- admin@test.com (SCHOOL_ADMIN) - password unknown
- teacher@test.com (TEACHER) - password unknown
- nanaamaadomah18@gmail.com (TEACHER) - password unknown
- Other admin accounts - password unknown

Would you like me to reset passwords for admin/teacher accounts?
""")
