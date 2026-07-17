import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from accounts.models import User
from teachers.models import Teacher
from students.models import Student
from schools.models import School

print("=" * 80)
print("USER ACCOUNTS AUDIT")
print("=" * 80)

# Get all users
users = User.objects.all().select_related('school')

print(f"\nTotal Users: {users.count()}\n")

# Group by role
roles = {}
for user in users:
    role = user.role
    if role not in roles:
        roles[role] = []
    roles[role].append(user)

for role in ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT']:
    users_with_role = roles.get(role, [])
    print(f"\n{role} ({len(users_with_role)} accounts):")
    print("-" * 80)
    
    if not users_with_role:
        print(f"  No {role} accounts found")
    else:
        for user in users_with_role:
            school_info = f" - School: {user.school.name}" if user.school else ""
            print(f"  • {user.first_name} {user.last_name}")
            print(f"    Email: {user.email}")
            print(f"    Username: {user.username}")
            print(f"    Active: {user.is_active}{school_info}")
            
            # Check for teacher profile
            if role == 'TEACHER':
                try:
                    teacher = Teacher.objects.get(user=user)
                    print(f"    Employee ID: {teacher.employee_id}")
                    print(f"    Qualification: {teacher.qualification}")
                except Teacher.DoesNotExist:
                    print(f"    [No teacher profile]")
            
            # Check for student profile
            if role == 'STUDENT':
                try:
                    student = Student.objects.get(user=user)
                    print(f"    Student ID: {student.student_id}")
                    print(f"    Class: {student.current_class}")
                except Student.DoesNotExist:
                    print(f"    [No student profile]")
            
            print()

print("\n" + "=" * 80)
print("RECOMMENDED TEST ACCOUNTS")
print("=" * 80)

# Find one of each role that's active
for role in ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT']:
    test_user = User.objects.filter(role=role, is_active=True).first()
    if test_user:
        print(f"\n{role}:")
        print(f"  Email: {test_user.email}")
        print(f"  Note: You need the actual password to test login")
        if role == 'STUDENT':
            try:
                student = Student.objects.get(user=test_user)
                print(f"  Student ID: {student.student_id}")
            except:
                pass
    else:
        print(f"\n{role}: NOT FOUND - Need to create test account")

print("\n" + "=" * 80)
