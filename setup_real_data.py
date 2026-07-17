import os
import sys
import django
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from accounts.models import User
from teachers.models import Teacher
from schools.models import School

print("=" * 100)
print("SETTING UP TEACHER AND ADMIN ACCOUNTS")
print("=" * 100)

# 1. Create teacher profiles for teacher accounts
print("\n[1] Creating Teacher Profiles for Teacher Accounts")
print("-" * 100)

teacher_data = [
    {
        'email': 'teacher@test.com',
        'employee_id': 'T001',
        'qualification': 'Bachelor of Education',
        'experience_years': 5,
        'is_class_teacher': True,
    },
    {
        'email': 'nanaamaadomah18@gmail.com',
        'employee_id': '5961',
        'qualification': 'Master of Arts',
        'experience_years': 8,
        'is_class_teacher': True,
    },
    {
        'email': 'oseielshadai18@gmail.com',
        'employee_id': 'T003',
        'qualification': 'Bachelor of Science',
        'experience_years': 3,
        'is_class_teacher': False,
    },
]

for data in teacher_data:
    try:
        user = User.objects.get(email=data['email'])
        
        # Check if teacher profile already exists
        if Teacher.objects.filter(user=user).exists():
            print(f"✓ {user.first_name} {user.last_name} ({data['email']}): Teacher profile already exists")
        else:
            # Find a school to assign (use first available)
            school = School.objects.first()
            if not school:
                print(f"✗ {data['email']}: No schools in database to assign")
                continue
            
            # Create teacher profile with hire_date
            teacher = Teacher.objects.create(
                user=user,
                employee_id=data['employee_id'],
                school=school,
                qualification=data['qualification'],
                experience_years=data['experience_years'],
                is_class_teacher=data['is_class_teacher'],
                is_active=True,
                hire_date=datetime.now().date(),  # Set today as hire date
            )
            print(f"✓ {user.first_name} {user.last_name} ({data['email']}): Teacher profile created")
            print(f"  - School: {school.name}")
            print(f"  - Employee ID: {data['employee_id']}")
            print(f"  - Qualification: {data['qualification']}")
    except User.DoesNotExist:
        print(f"✗ {data['email']}: User not found")
    except Exception as e:
        print(f"✗ {data['email']}: Error - {str(e)}")

# 2. Assign schools to admin accounts
print("\n[2] Assigning Schools to Admin Accounts")
print("-" * 100)

admin_data = [
    {
        'email': 'admin@test.com',
        'school_name': 'Test School',  # will use this to find school
    },
    {
        'email': 'oelshadai565@gmail.com',
        'school_name': 'Great hope international school',
    },
]

for data in admin_data:
    try:
        user = User.objects.get(email=data['email'])
        
        # Find school by name pattern
        school = School.objects.filter(name__icontains=data['school_name']).first()
        if not school:
            # If not found by name, use first school
            school = School.objects.first()
        
        if school:
            user.school = school
            user.save()
            print(f"✓ {user.first_name} {user.last_name} ({data['email']}): Assigned to {school.name}")
        else:
            print(f"✗ {data['email']}: No school found to assign")
    except User.DoesNotExist:
        print(f"✗ {data['email']}: User not found")
    except Exception as e:
        print(f"✗ {data['email']}: Error - {str(e)}")

# 3. Verify setup
print("\n[3] Verification - Current Setup")
print("-" * 100)

print("\nTeacher Accounts with Profiles:")
teachers = Teacher.objects.all().select_related('user', 'school')
for teacher in teachers:
    print(f"  ✓ {teacher.user.email}: {teacher.user.first_name} {teacher.user.last_name}")
    print(f"    - School: {teacher.school.name if teacher.school else 'None'}")
    print(f"    - Employee ID: {teacher.employee_id}")

print("\nAdmin Accounts with Schools:")
admins = User.objects.filter(role='SCHOOL_ADMIN')
for admin in admins:
    print(f"  ✓ {admin.email}: {admin.first_name} {admin.last_name}")
    print(f"    - School: {admin.school.name if admin.school else 'None'}")

print("\n" + "=" * 100)
print("Setup complete! All accounts now linked to real data.")
print("=" * 100)
