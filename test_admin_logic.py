import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from accounts.models import User
from students.models import Student
from teachers.models import Teacher
from schools.models import Class
from assignments.models import Assignment

print("Testing admin dashboard logic...")

user = User.objects.get(email='admin@test.com')
print(f"User: {user.first_name} {user.last_name}")
print(f"School: {user.school}")

if user.school:
    print(f"\nQuerying school data for {user.school.name}...")
    
    try:
        students = Student.objects.filter(school=user.school)
        print(f"Students count: {students.count()}")
        print(f"First student: {students.first()}")
    except Exception as e:
        print(f"Error querying students: {str(e)}")
    
    try:
        teachers = Teacher.objects.filter(school=user.school)
        print(f"Teachers count: {teachers.count()}")
    except Exception as e:
        print(f"Error querying teachers: {str(e)}")
    
    try:
        classes = Class.objects.filter(school=user.school)
        print(f"Classes count: {classes.count()}")
    except Exception as e:
        print(f"Error querying classes: {str(e)}")
    
    try:
        assignments = Assignment.objects.filter(school=user.school)
        print(f"Assignments count: {assignments.count()}")
    except Exception as e:
        print(f"Error querying assignments: {str(e)}")
    
    # Test recent students
    try:
        recent_students = Student.objects.filter(school=user.school).order_by('-created_at')[:5]
        print(f"\nRecent students count: {recent_students.count()}")
        for s in recent_students:
            try:
                print(f"  - {s.get_full_name()} ({s.student_id})")
            except Exception as e:
                print(f"  - Error on student: {str(e)}")
    except Exception as e:
        print(f"Error querying recent students: {str(e)}")
    
    # Test recent teachers
    try:
        recent_teachers = Teacher.objects.filter(school=user.school).order_by('-created_at')[:5]
        print(f"\nRecent teachers count: {recent_teachers.count()}")
        for t in recent_teachers:
            try:
                print(f"  - {t.get_full_name()} ({t.employee_id})")
            except Exception as e:
                print(f"  - Error on teacher: {str(e)}")
    except Exception as e:
        print(f"Error querying recent teachers: {str(e)}")
