#!/usr/bin/env python3
"""
Debug script to check student assignments API
"""
import os
import sys
import django

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student
from assignments.models import Assignment, StudentAssignment
from django.contrib.auth import get_user_model

User = get_user_model()

def debug_student_assignments():
    print("=== Student Assignments Debug ===\n")
    
    # Check if there are any students
    students = Student.objects.all()
    print(f"Total students in database: {students.count()}")
    
    if students.exists():
        for student in students[:5]:  # Show first 5 students
            print(f"Student: {student.get_full_name()} (ID: {student.student_id})")
            print(f"  - User: {student.user}")
            print(f"  - Class: {student.current_class}")
            print(f"  - School: {student.school}")
    
    print("\n" + "="*50 + "\n")
    
    # Check if there are any assignments
    assignments = Assignment.objects.all()
    print(f"Total assignments in database: {assignments.count()}")
    
    if assignments.exists():
        for assignment in assignments[:5]:  # Show first 5 assignments
            print(f"Assignment: {assignment.title}")
            print(f"  - Type: {assignment.assignment_type}")
            print(f"  - Status: {assignment.status}")
            print(f"  - Class: {assignment.class_instance}")
            print(f"  - Created by: {assignment.created_by}")
            print(f"  - Due date: {assignment.due_date}")
    
    print("\n" + "="*50 + "\n")
    
    # Check published assignments
    published_assignments = Assignment.objects.filter(status='PUBLISHED')
    print(f"Published assignments: {published_assignments.count()}")
    
    if published_assignments.exists():
        for assignment in published_assignments:
            print(f"Published: {assignment.title} (Class: {assignment.class_instance})")
    
    print("\n" + "="*50 + "\n")
    
    # Check student assignments
    student_assignments = StudentAssignment.objects.all()
    print(f"Total student assignments: {student_assignments.count()}")
    
    if student_assignments.exists():
        for sa in student_assignments[:10]:  # Show first 10
            print(f"StudentAssignment: {sa.student.get_full_name()} -> {sa.assignment.title}")
            print(f"  - Status: {sa.status}")
            print(f"  - Score: {sa.score}")
    
    print("\n" + "="*50 + "\n")
    
    # Test the API endpoint logic
    print("Testing API endpoint logic...")
    
    # Get a test student
    test_student = students.first()
    if test_student and test_student.current_class:
        print(f"Testing with student: {test_student.get_full_name()}")
        print(f"Student's class: {test_student.current_class}")
        
        # Get published assignments for student's class
        published_for_class = Assignment.objects.filter(
            class_instance=test_student.current_class,
            status='PUBLISHED'
        )
        print(f"Published assignments for {test_student.current_class}: {published_for_class.count()}")
        
        # Check if StudentAssignment records exist
        student_assignments_for_student = StudentAssignment.objects.filter(
            student=test_student,
            assignment__status='PUBLISHED'
        )
        print(f"StudentAssignment records for this student: {student_assignments_for_student.count()}")
        
        # Create missing StudentAssignment records (like the API does)
        created_count = 0
        for assignment in published_for_class:
            sa, created = StudentAssignment.objects.get_or_create(
                assignment=assignment,
                student=test_student,
                defaults={'status': 'NOT_STARTED'}
            )
            if created:
                created_count += 1
        
        print(f"Created {created_count} new StudentAssignment records")
        
        # Final count
        final_count = StudentAssignment.objects.filter(
            student=test_student,
            assignment__status='PUBLISHED'
        ).count()
        print(f"Final StudentAssignment count for this student: {final_count}")

if __name__ == '__main__':
    debug_student_assignments()