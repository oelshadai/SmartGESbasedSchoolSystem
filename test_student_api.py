#!/usr/bin/env python3
"""
Test the student assignment API endpoint directly
"""
import os
import sys
import django
import requests
import json

# Setup Django
sys.path.append('backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from django.contrib.auth import get_user_model
from students.models import Student
from assignments.models import Assignment, StudentAssignment

User = get_user_model()

def test_student_api():
    print("=== TESTING STUDENT ASSIGNMENT API ===\n")
    
    # Get student users
    student_users = User.objects.filter(role='STUDENT')
    print(f"Student users found: {student_users.count()}")
    
    for user in student_users:
        print(f"\nTesting API for user: {user.email}")
        
        try:
            student = Student.objects.get(user=user)
            print(f"Student profile: {student.get_full_name()} (ID: {student.id})")
            print(f"Current class: {student.current_class}")
            
            # Check assignments directly in database
            if student.current_class:
                published_assignments = Assignment.objects.filter(
                    class_instance=student.current_class,
                    status='PUBLISHED'
                )
                print(f"Published assignments in class: {published_assignments.count()}")
                
                student_assignments = StudentAssignment.objects.filter(
                    student=student,
                    assignment__status='PUBLISHED'
                )
                print(f"StudentAssignment records: {student_assignments.count()}")
                
                # List assignments
                for sa in student_assignments:
                    print(f"  - {sa.assignment.title} (Status: {sa.status})")
            
        except Student.DoesNotExist:
            print(f"  No student profile found for user {user.email}")
            continue

def test_api_endpoint_simulation():
    """Simulate the API endpoint logic"""
    print("\n=== SIMULATING API ENDPOINT LOGIC ===\n")
    
    student_users = User.objects.filter(role='STUDENT')
    
    for user in student_users:
        print(f"Simulating API call for: {user.email}")
        
        try:
            student = Student.objects.select_related('current_class').get(user=user)
            print(f"  Student: {student.get_full_name()}")
            print(f"  Class: {student.current_class}")
            
            if not student.current_class:
                print("  Result: Empty list (no class assigned)")
                continue
            
            # Get published assignments for student's class
            published_assignments = Assignment.objects.filter(
                class_instance=student.current_class,
                status='PUBLISHED'
            ).select_related('class_subject__subject')
            
            print(f"  Published assignments: {published_assignments.count()}")
            
            # Auto-create missing StudentAssignment records (like the API does)
            created_count = 0
            for assignment in published_assignments:
                try:
                    student_assignment, created = StudentAssignment.objects.get_or_create(
                        assignment=assignment,
                        student=student,
                        defaults={'status': 'NOT_STARTED'}
                    )
                    if created:
                        created_count += 1
                        print(f"    AUTO-CREATED: {assignment.title}")
                except Exception as e:
                    print(f"    ERROR creating for {assignment.title}: {e}")
            
            if created_count > 0:
                print(f"  Auto-created {created_count} StudentAssignment records")
            
            # Get final student assignments
            student_assignments = StudentAssignment.objects.filter(
                student=student,
                assignment__status='PUBLISHED'
            ).select_related('assignment', 'assignment__class_subject__subject')
            
            print(f"  Final assignments returned: {student_assignments.count()}")
            
            # Build response data (like the API does)
            assignment_data = []
            for sa in student_assignments:
                try:
                    assignment_data.append({
                        'id': sa.assignment.id,
                        'title': sa.assignment.title,
                        'description': sa.assignment.description,
                        'subject_name': sa.assignment.class_subject.subject.name if sa.assignment.class_subject else 'General',
                        'assignment_type': sa.assignment.assignment_type,
                        'due_date': sa.assignment.due_date.isoformat() if sa.assignment.due_date else None,
                        'points': sa.assignment.max_score,
                        'status': sa.status,
                        'score': sa.score,
                        'class_name': str(sa.assignment.class_instance) if sa.assignment.class_instance else 'Unknown Class'
                    })
                except Exception as e:
                    print(f"    ERROR serializing {sa.assignment.id}: {e}")
            
            print(f"  API would return: {len(assignment_data)} assignments")
            for assignment in assignment_data:
                print(f"    - {assignment['title']} ({assignment['status']})")
            
        except Student.DoesNotExist:
            print(f"  ERROR: No student profile found")
        except Exception as e:
            print(f"  ERROR: {e}")

if __name__ == "__main__":
    test_student_api()
    test_api_endpoint_simulation()