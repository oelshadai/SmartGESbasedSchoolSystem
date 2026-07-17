#!/usr/bin/env python3
"""
Assignment Visibility Fix Script
Resolves issues where teacher-created assignments don't appear in student portal
"""

import os
import sys
import django

# Setup Django
sys.path.append('backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from django.db import transaction
from assignments.models import Assignment, StudentAssignment
from students.models import Student
from schools.models import Class

def investigate_assignment_issues():
    """Investigate and report assignment visibility issues"""
    
    print("=== ASSIGNMENT INVESTIGATION REPORT ===\n")
    
    # 1. Check total assignments
    total_assignments = Assignment.objects.count()
    published_assignments = Assignment.objects.filter(status='PUBLISHED').count()
    draft_assignments = Assignment.objects.filter(status='DRAFT').count()
    
    print(f"📊 ASSIGNMENT SUMMARY:")
    print(f"   Total Assignments: {total_assignments}")
    print(f"   Published: {published_assignments}")
    print(f"   Draft: {draft_assignments}")
    print()
    
    # 2. Check students
    total_students = Student.objects.count()
    students_with_class = Student.objects.filter(current_class__isnull=False).count()
    students_without_class = total_students - students_with_class
    
    print(f"👥 STUDENT SUMMARY:")
    print(f"   Total Students: {total_students}")
    print(f"   With Class: {students_with_class}")
    print(f"   Without Class: {students_without_class}")
    print()
    
    # 3. Check student assignment records
    total_student_assignments = StudentAssignment.objects.count()
    
    print(f"📝 STUDENT ASSIGNMENT RECORDS:")
    print(f"   Total Records: {total_student_assignments}")
    print()
    
    # 4. Detailed assignment analysis
    print("🔍 DETAILED ASSIGNMENT ANALYSIS:")
    assignments = Assignment.objects.all().order_by('-created_at')
    
    for assignment in assignments:
        print(f"   Assignment: {assignment.title}")
        print(f"   - ID: {assignment.id}")
        print(f"   - Status: {assignment.status}")
        print(f"   - Class: {assignment.class_instance}")
        print(f"   - Created by: {assignment.created_by.username if assignment.created_by else 'Unknown'}")
        
        # Check how many students should have access
        if assignment.class_instance:
            class_students = assignment.class_instance.students.count()
            student_records = StudentAssignment.objects.filter(assignment=assignment).count()
            print(f"   - Students in class: {class_students}")
            print(f"   - Student records created: {student_records}")
            print(f"   - Missing records: {class_students - student_records}")
        else:
            print(f"   - ⚠️  No class assigned!")
        print()
    
    # 5. Check for orphaned students
    print("🔍 STUDENTS WITHOUT ASSIGNMENTS:")
    students_without_assignments = Student.objects.filter(
        current_class__isnull=False,
        assignments__isnull=True
    ).distinct()
    
    for student in students_without_assignments:
        print(f"   - {student.get_full_name()} (Class: {student.current_class})")
    
    if not students_without_assignments:
        print("   ✅ All students with classes have assignment records")
    print()

def fix_assignment_visibility():
    """Fix assignment visibility issues"""
    
    print("=== FIXING ASSIGNMENT VISIBILITY ISSUES ===\n")
    
    with transaction.atomic():
        # 1. Auto-publish draft assignments that are ready
        draft_assignments = Assignment.objects.filter(status='DRAFT')
        published_count = 0
        
        for assignment in draft_assignments:
            # Check if assignment has basic requirements
            if assignment.title and assignment.description and assignment.class_instance:
                assignment.status = 'PUBLISHED'
                assignment.save()
                published_count += 1
                print(f"✅ Published: {assignment.title}")
        
        print(f"📊 Published {published_count} draft assignments\n")
        
        # 2. Create missing StudentAssignment records
        published_assignments = Assignment.objects.filter(status='PUBLISHED')
        created_count = 0
        
        for assignment in published_assignments:
            if assignment.class_instance:
                students = assignment.class_instance.students.all()
                
                for student in students:
                    student_assignment, created = StudentAssignment.objects.get_or_create(
                        assignment=assignment,
                        student=student,
                        defaults={'status': 'NOT_STARTED'}
                    )
                    
                    if created:
                        created_count += 1
                        print(f"✅ Created assignment record: {student.get_full_name()} -> {assignment.title}")
        
        print(f"📊 Created {created_count} missing student assignment records\n")
        
        # 3. Fix students without classes
        students_without_class = Student.objects.filter(current_class__isnull=True)
        
        if students_without_class.exists():
            print("⚠️  STUDENTS WITHOUT CLASSES:")
            for student in students_without_class:
                print(f"   - {student.get_full_name()} (ID: {student.student_id})")
            
            # Try to assign them to a default class if available
            default_class = Class.objects.first()
            if default_class:
                print(f"\n🔧 Assigning students to default class: {default_class}")
                students_without_class.update(current_class=default_class)
                print(f"✅ Assigned {students_without_class.count()} students to {default_class}")
        
        print("\n=== FIX COMPLETED ===")

def create_test_data():
    """Create test data if none exists"""
    
    print("=== CREATING TEST DATA ===\n")
    
    # Check if we need test data
    if Assignment.objects.exists() and Student.objects.exists():
        print("✅ Test data already exists")
        return
    
    from django.contrib.auth.models import User
    from schools.models import Subject
    
    with transaction.atomic():
        # Create test teacher user
        teacher_user, created = User.objects.get_or_create(
            username='test_teacher',
            defaults={
                'email': 'teacher@test.com',
                'first_name': 'Test',
                'last_name': 'Teacher',
                'is_active': True
            }
        )
        
        if created:
            teacher_user.set_password('password123')
            teacher_user.save()
            print(f"✅ Created teacher user: {teacher_user.username}")
        
        # Create test class
        test_class, created = Class.objects.get_or_create(
            level='Grade 10',
            section='A',
            defaults={'class_teacher': teacher_user}
        )
        
        if created:
            print(f"✅ Created test class: {test_class}")
        
        # Create test student
        student_user, created = User.objects.get_or_create(
            username='test_student',
            defaults={
                'email': 'student@test.com',
                'first_name': 'Test',
                'last_name': 'Student',
                'is_active': True
            }
        )
        
        if created:
            student_user.set_password('password123')
            student_user.save()
            print(f"✅ Created student user: {student_user.username}")
        
        # Create test student record
        test_student, created = Student.objects.get_or_create(
            student_id='TEST001',
            defaults={
                'user': student_user,
                'first_name': 'Test',
                'last_name': 'Student',
                'current_class': test_class
            }
        )
        
        if created:
            print(f"✅ Created student record: {test_student}")
        
        # Create test assignment
        test_assignment, created = Assignment.objects.get_or_create(
            title='Test Assignment',
            defaults={
                'description': 'This is a test assignment to verify the system works',
                'assignment_type': 'HOMEWORK',
                'class_instance': test_class,
                'created_by': teacher_user,
                'due_date': '2024-12-31 23:59:59',
                'max_score': 10,
                'status': 'PUBLISHED'
            }
        )
        
        if created:
            print(f"✅ Created test assignment: {test_assignment}")
            
            # Create student assignment record
            StudentAssignment.objects.get_or_create(
                assignment=test_assignment,
                student=test_student,
                defaults={'status': 'NOT_STARTED'}
            )
            print(f"✅ Created student assignment record")

if __name__ == '__main__':
    print("🔍 ASSIGNMENT INVESTIGATION & FIX TOOL\n")
    
    # Step 1: Investigate issues
    investigate_assignment_issues()
    
    # Step 2: Create test data if needed
    create_test_data()
    
    # Step 3: Fix issues
    fix_assignment_visibility()
    
    # Step 4: Final verification
    print("\n=== FINAL VERIFICATION ===")
    investigate_assignment_issues()
    
    print("✅ Investigation and fix completed!")
    print("\nNext steps:")
    print("1. Check the investigation dashboard: investigate_assignments.html")
    print("2. Test student login with username: test_student, password: password123")
    print("3. Test teacher login with username: test_teacher, password: password123")