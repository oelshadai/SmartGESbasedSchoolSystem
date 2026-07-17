#!/usr/bin/env python
"""
Test script to verify assignment visibility fix
"""
import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from django.contrib.auth.models import User
from schools.models import School, Class, Subject, ClassSubject
from assignments.models import Assignment
from django.db.models import Q

def test_assignment_visibility():
    """Test assignment visibility after teacher re-login simulation"""
    
    print("Testing assignment visibility fix...")
    
    # Get test teacher
    try:
        teacher = User.objects.get(email='teacher@test.com')
        print(f"Found teacher: {teacher.email} (ID: {teacher.id})")
    except User.DoesNotExist:
        print("Teacher not found. Run create_test_teacher.py first.")
        return
    
    # Get test class
    try:
        test_class = Class.objects.get(level='BASIC_5', section='A')
        print(f"Found class: {test_class}")
    except Class.DoesNotExist:
        print("Test class not found.")
        return
    
    # Test assignment filtering logic (simulating API call)
    teacher_subjects = ClassSubject.objects.filter(
        class_instance=test_class,
        teacher=teacher
    ).values_list('id', flat=True)
    
    teacher_email = teacher.email
    
    # Use the same filtering logic as the API
    assignments = Assignment.objects.filter(
        class_instance=test_class
    ).filter(
        Q(created_by=teacher) |
        Q(created_by__email=teacher_email) |
        Q(class_subject__in=teacher_subjects) |
        Q(class_instance__class_teacher=teacher) |
        Q(class_instance__class_teacher__email=teacher_email)
    ).distinct()
    
    print(f"\nAssignment visibility test:")
    print(f"Teacher subjects in class: {list(teacher_subjects)}")
    print(f"Class teacher: {test_class.class_teacher}")
    print(f"Is class teacher: {test_class.class_teacher == teacher}")
    print(f"Assignments found: {assignments.count()}")
    
    for assignment in assignments:
        print(f"  - {assignment.title} (Status: {assignment.status})")
        print(f"    Created by: {assignment.created_by.email} (ID: {assignment.created_by.id})")
        print(f"    Class subject: {assignment.class_subject}")
    
    # Test teacher stats
    teacher_assignments = Assignment.objects.filter(
        Q(created_by=teacher) |
        Q(created_by__email=teacher_email) |
        Q(class_subject__in=teacher_subjects) |
        Q(class_instance__class_teacher=teacher) |
        Q(class_instance__class_teacher__email=teacher_email)
    ).distinct()
    
    print(f"\nTeacher stats:")
    print(f"Total assignments: {teacher_assignments.count()}")
    print(f"Published: {teacher_assignments.filter(status='PUBLISHED').count()}")
    print(f"Draft: {teacher_assignments.filter(status='DRAFT').count()}")
    
    # Simulate different user ID (re-login scenario)
    print(f"\n--- Simulating re-login scenario ---")
    print("Testing email-based matching...")
    
    email_based_assignments = Assignment.objects.filter(
        Q(created_by__email=teacher_email) |
        Q(class_instance__class_teacher__email=teacher_email)
    ).distinct()
    
    print(f"Assignments found by email: {email_based_assignments.count()}")
    for assignment in email_based_assignments:
        print(f"  - {assignment.title} (Created by: {assignment.created_by.email})")
    
    print("\nTest completed!")

if __name__ == '__main__':
    test_assignment_visibility()