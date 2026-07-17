import os
import sys
import django
from django.contrib.auth.hashers import make_password

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from accounts.models import User

print("=" * 80)
print("RESETTING ADMIN/TEACHER PASSWORDS")
print("=" * 80)

# Define password resets
password_resets = [
    ('admin@demo.test', 'admin123', 'SUPER_ADMIN'),
    ('admin@test.com', 'admin123', 'SCHOOL_ADMIN'),
    ('teacher@test.com', 'teacher123', 'TEACHER'),
    ('nanaamaadomah18@gmail.com', 'teacher123', 'TEACHER'),
    ('oseielshadai18@gmail.com', 'teacher123', 'TEACHER'),
    ('oelshadai565@gmail.com', 'admin123', 'SCHOOL_ADMIN'),
]

print("\nResetting passwords...\n")

for email, new_password, role in password_resets:
    try:
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()
        print(f"✓ {role:15} | {email:40} | Password: {new_password}")
    except User.DoesNotExist:
        print(f"✗ {role:15} | {email:40} | User not found")
    except Exception as e:
        print(f"✗ {role:15} | {email:40} | Error: {str(e)}")

print("\n" + "=" * 80)
print("NEW TEST CREDENTIALS")
print("=" * 80)

print("""
SUPER_ADMIN Login:
  Email:    admin@demo.test
  Password: admin123

SCHOOL_ADMIN Logins:
  Email:    admin@test.com
  Password: admin123
  
  Email:    oelshadai565@gmail.com
  Password: admin123

TEACHER Logins:
  Email:    teacher@test.com
  Password: teacher123
  
  Email:    nanaamaadomah18@gmail.com
  Password: teacher123
  
  Email:    oseielshadai18@gmail.com
  Password: teacher123

STUDENT Logins (already working):
  Student ID: BS9001
  Password:   bs9test
  
  Student ID: 2025BASIC_9001
  Password:   student123
  
  Student ID: STD001
  Password:   test123
  
  Student ID: 2026BASIC_9002
  Password:   jTxW2u
""")

print("=" * 80)
print("Ready to test authentication!")
print("=" * 80)
