#!/usr/bin/env python
"""
Debug script to check teacher class assignments
Run this from the backend directory: python ../debug_teacher_classes.py
"""

import os
import sys
import django

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from django.contrib.auth import get_user_model
from teachers.models import Teacher
from schools.models import Class

User = get_user_model()

def debug_teacher_classes():
    print("=== TEACHER CLASS ASSIGNMENT DEBUG ===\n")
    
    # Find ADOMAH JACKLINE
    try:
        # Try different ways to find the teacher
        teacher_user = None
        teacher_profile = None
        
        # Method 1: Search by name in User model
        users = User.objects.filter(
            first_name__icontains='ADOMAH',
            last_name__icontains='JACKLINE'
        )
        print(f"Found {users.count()} users with name containing 'ADOMAH JACKLINE':")
        for user in users:
            print(f"  - User ID: {user.id}, Email: {user.email}, Name: {user.get_full_name()}, Role: {user.role}")
            if hasattr(user, 'teacher_profile'):
                print(f"    Teacher Profile ID: {user.teacher_profile.id}")
                teacher_user = user
                teacher_profile = user.teacher_profile
        
        # Method 2: Search in Teacher model
        teachers = Teacher.objects.filter(
            user__first_name__icontains='ADOMAH',
            user__last_name__icontains='JACKLINE'
        )
        print(f"\nFound {teachers.count()} teachers with name containing 'ADOMAH JACKLINE':")
        for teacher in teachers:
            print(f"  - Teacher ID: {teacher.id}, User ID: {teacher.user.id}")
            print(f"    Name: {teacher.get_full_name()}, Employee ID: {teacher.employee_id}")
            print(f"    Email: {teacher.user.email}, Role: {teacher.user.role}")
            print(f"    School: {teacher.school.name if teacher.school else 'None'}")
            print(f"    Is Class Teacher: {teacher.is_class_teacher}")
            teacher_profile = teacher
            teacher_user = teacher.user
        
        if not teacher_user:
            print("\n❌ ADOMAH JACKLINE not found in the system!")
            return
        
        print(f"\n=== ANALYZING TEACHER: {teacher_user.get_full_name()} ===")
        
        # Check assigned classes
        assigned_classes = Class.objects.filter(class_teacher=teacher_user)
        print(f"\nClasses where {teacher_user.get_full_name()} is class teacher:")
        print(f"Found {assigned_classes.count()} assigned classes:")
        
        for cls in assigned_classes:
            print(f"  - Class ID: {cls.id}")
            print(f"    Name: {cls}")
            print(f"    Level: {cls.get_level_display()}")
            print(f"    Section: {cls.section or 'No section'}")
            print(f"    School: {cls.school.name}")
            print(f"    Class Teacher User ID: {cls.class_teacher.id if cls.class_teacher else 'None'}")
            print(f"    Class Teacher Name: {cls.class_teacher.get_full_name() if cls.class_teacher else 'None'}")
            
            # Count students
            student_count = cls.students.filter(is_active=True).count()
            print(f"    Active Students: {student_count}")
            print()
        
        # Check if teacher profile method works
        if teacher_profile:
            profile_classes = teacher_profile.get_assigned_classes()
            print(f"Classes from teacher.get_assigned_classes() method:")
            print(f"Found {profile_classes.count()} classes:")
            for cls in profile_classes:
                print(f"  - {cls} (ID: {cls.id})")
        
        # Check teaching subjects
        if teacher_profile:
            teaching_subjects = teacher_profile.get_teaching_subjects()
            print(f"\nSubjects {teacher_user.get_full_name()} teaches:")
            print(f"Found {teaching_subjects.count()} subject assignments:")
            for cs in teaching_subjects:
                print(f"  - Subject: {cs.subject.name}")
                print(f"    Class: {cs.class_instance}")
                print(f"    Teacher User ID: {cs.teacher.id if cs.teacher else 'None'}")
                print()
        
        # Check all classes in the school to see assignments
        if teacher_profile and teacher_profile.school:
            print(f"\n=== ALL CLASSES IN {teacher_profile.school.name} ===")
            all_classes = Class.objects.filter(school=teacher_profile.school)
            for cls in all_classes:
                teacher_name = cls.class_teacher.get_full_name() if cls.class_teacher else 'Not Assigned'
                print(f"  - {cls} -> {teacher_name}")
        
    except Exception as e:
        print(f"Error during debug: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    debug_teacher_classes()