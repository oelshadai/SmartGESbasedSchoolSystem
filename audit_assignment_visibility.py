#!/usr/bin/env python3
"""
ASSIGNMENT VISIBILITY PIPELINE AUDIT
Comprehensive diagnostic to identify the exact root cause
"""
import os
import sys
import django

# Setup Django
sys.path.append('backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from assignments.models import Assignment, StudentAssignment
from students.models import Student
from schools.models import Class
from django.contrib.auth import get_user_model

User = get_user_model()

def audit_assignment_visibility():
    print("=== ASSIGNMENT VISIBILITY PIPELINE AUDIT ===\n")
    
    # STEP 1: Audit Assignment Model Structure
    print("[AUDIT] STEP 1 - ASSIGNMENT MODEL AUDIT")
    print("-" * 50)
    
    assignments = Assignment.objects.filter(status='PUBLISHED')
    print(f"Published assignments: {assignments.count()}")
    
    for assignment in assignments:
        print(f"\nAssignment: '{assignment.title}' (ID: {assignment.id})")
        print(f"  [OK] Status: {assignment.status}")
        print(f"  [OK] Class: {assignment.class_instance} (ID: {assignment.class_instance.id if assignment.class_instance else None})")
        print(f"  [OK] Created by: {assignment.created_by}")
        print(f"  [OK] Due date: {assignment.due_date}")
        print(f"  [OK] Published at: {assignment.published_at}")
        
        # Check if class has students
        if assignment.class_instance:
            students_in_class = assignment.class_instance.students.filter(is_active=True)
            print(f"  [OK] Students in class: {students_in_class.count()}")
            for student in students_in_class:
                print(f"    - {student.get_full_name()} (ID: {student.id})")
    
    # STEP 2: Audit Student-Class Relationship
    print(f"\n[AUDIT] STEP 2 - STUDENT-CLASS RELATIONSHIP AUDIT")
    print("-" * 50)
    
    students = Student.objects.filter(is_active=True)
    print(f"Active students: {students.count()}")
    
    for student in students:
        print(f"\nStudent: {student.get_full_name()} (ID: {student.id})")
        print(f"  [OK] Student ID: {student.student_id}")
        print(f"  [OK] Current class: {student.current_class}")
        print(f"  [OK] User account: {student.user}")
        print(f"  [OK] User role: {student.user.role if student.user else 'No user'}")
        
        # Check if student has access to published assignments
        if student.current_class:
            class_assignments = Assignment.objects.filter(
                class_instance=student.current_class,
                status='PUBLISHED'
            )
            print(f"  [OK] Assignments in student's class: {class_assignments.count()}")
            for assignment in class_assignments:
                print(f"    - {assignment.title}")
    
    # STEP 3: Audit StudentAssignment Records
    print(f"\n[AUDIT] STEP 3 - STUDENT ASSIGNMENT RECORDS AUDIT")
    print("-" * 50)
    
    student_assignments = StudentAssignment.objects.filter(
        assignment__status='PUBLISHED'
    ).select_related('assignment', 'student')
    
    print(f"StudentAssignment records for published assignments: {student_assignments.count()}")
    
    for sa in student_assignments:
        print(f"  [OK] {sa.student.get_full_name()} -> '{sa.assignment.title}' (Status: {sa.status})")
    
    # STEP 4: Identify Missing StudentAssignment Records
    print(f"\n[AUDIT] STEP 4 - MISSING RECORDS ANALYSIS")
    print("-" * 50)
    
    missing_records = []
    total_expected = 0
    
    for assignment in assignments:
        if assignment.class_instance:
            class_students = assignment.class_instance.students.filter(is_active=True)
            total_expected += class_students.count()
            
            print(f"\nAssignment: '{assignment.title}' -> Class: {assignment.class_instance}")
            print(f"  Expected students: {class_students.count()}")
            
            for student in class_students:
                exists = StudentAssignment.objects.filter(
                    assignment=assignment,
                    student=student
                ).exists()
                
                if not exists:
                    missing_records.append((student, assignment))
                    print(f"    [MISSING]: {student.get_full_name()}")
                else:
                    print(f"    [EXISTS]: {student.get_full_name()}")
    
    print(f"\n[SUMMARY]:")
    print(f"  Total expected StudentAssignment records: {total_expected}")
    print(f"  Actual StudentAssignment records: {student_assignments.count()}")
    print(f"  Missing records: {len(missing_records)}")
    
    # STEP 5: Test Student API Logic
    print(f"\n[AUDIT] STEP 5 - STUDENT API LOGIC TEST")
    print("-" * 50)
    
    for student in students:
        print(f"\nTesting API logic for: {student.get_full_name()}")
        
        # Simulate the API logic from StudentAssignmentViewSet.my_assignments
        if not student.current_class:
            print(f"  [ERROR] No current class assigned")
            continue
        
        # Test the exact query from the API
        published_assignments = Assignment.objects.filter(
            class_instance=student.current_class,
            status='PUBLISHED'
        )
        print(f"  [OK] Published assignments in class: {published_assignments.count()}")
        
        # Test StudentAssignment filtering
        student_assignments_api = StudentAssignment.objects.filter(
            student=student,
            assignment__status='PUBLISHED'
        )
        print(f"  [OK] StudentAssignment records: {student_assignments_api.count()}")
        
        # Check if auto-creation would work
        for assignment in published_assignments:
            sa_exists = StudentAssignment.objects.filter(
                assignment=assignment,
                student=student
            ).exists()
            print(f"    - '{assignment.title}': {'EXISTS' if sa_exists else 'MISSING'}")
    
    # STEP 6: Check User Authentication
    print(f"\n[AUDIT] STEP 6 - USER AUTHENTICATION AUDIT")
    print("-" * 50)
    
    student_users = User.objects.filter(role='STUDENT')
    print(f"Student user accounts: {student_users.count()}")
    
    for student in students:
        if student.user:
            print(f"  [OK] {student.get_full_name()} -> User: {student.user.email} (Role: {student.user.role})")
        else:
            print(f"  [ERROR] {student.get_full_name()} -> No user account")
    
    # STEP 7: Provide Fix Recommendations
    print(f"\n[RECOMMENDATIONS] FIX RECOMMENDATIONS")
    print("-" * 50)
    
    if missing_records:
        print(f"1. CREATE MISSING STUDENT ASSIGNMENT RECORDS:")
        print(f"   Found {len(missing_records)} missing StudentAssignment records")
        print(f"   These need to be created for proper visibility")
        
    if any(not student.user for student in students):
        print(f"2. FIX USER ACCOUNT ISSUES:")
        print(f"   Some students don't have user accounts")
        
    print(f"3. API LOGIC ISSUES:")
    print(f"   The StudentAssignmentViewSet.my_assignments method has auto-creation logic")
    print(f"   but it may not be working properly in all cases")
    
    return missing_records

def create_missing_student_assignments(missing_records):
    """Create missing StudentAssignment records"""
    print(f"\n[FIX] CREATING MISSING STUDENT ASSIGNMENT RECORDS")
    print("-" * 50)
    
    created_count = 0
    for student, assignment in missing_records:
        try:
            student_assignment, created = StudentAssignment.objects.get_or_create(
                assignment=assignment,
                student=student,
                defaults={'status': 'NOT_STARTED'}
            )
            
            if created:
                print(f"  [CREATED]: {student.get_full_name()} -> '{assignment.title}'")
                created_count += 1
            else:
                print(f"  [EXISTS]: {student.get_full_name()} -> '{assignment.title}'")
                
        except Exception as e:
            print(f"  [ERROR] Error creating for {student.get_full_name()}: {e}")
    
    print(f"\n[SUMMARY] Created {created_count} StudentAssignment records")
    return created_count

if __name__ == "__main__":
    missing_records = audit_assignment_visibility()
    
    if missing_records:
        print(f"\n[CRITICAL] ISSUE IDENTIFIED:")
        print(f"   {len(missing_records)} missing StudentAssignment records found")
        print(f"   This is the ROOT CAUSE of the visibility issue")
        
        response = input(f"\nDo you want to create the missing records? (y/n): ")
        if response.lower() == 'y':
            create_missing_student_assignments(missing_records)
            print(f"\n[SUCCESS] FIX APPLIED - Students should now see assignments")
        else:
            print(f"\n[WARNING] Fix not applied - assignments will remain invisible")
    else:
        print(f"\n[SUCCESS] NO MISSING RECORDS FOUND")
        print(f"   The issue may be in the API logic or frontend")