#!/usr/bin/env python3
"""
Assignment Visibility Fix Script - FINAL VERSION
Resolves validation errors by ensuring all required fields are populated
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
from schools.models import Class, ClassSubject, Subject, Term, AcademicYear, School

def fix_assignment_visibility():
    """Fix assignment visibility issues with proper validation"""
    
    print("=== FIXING ASSIGNMENT VALIDATION ISSUES ===\n")
    
    with transaction.atomic():
        # 1. Fix assignments missing required fields
        print("1. Fixing assignments with missing required fields:")
        
        # Get or create a default academic year and term
        school = School.objects.first()
        if not school:
            print("   ❌ No school found. Please create a school first.")
            return
        
        # Get or create default academic year
        academic_year, created = AcademicYear.objects.get_or_create(
            school=school,
            name='2024/2025',
            defaults={
                'start_date': '2024-01-01',
                'end_date': '2024-12-31',
                'is_current': True
            }
        )
        if created:
            print(f"   + Created default academic year: {academic_year}")
        
        # Get or create default term
        default_term, created = Term.objects.get_or_create(
            academic_year=academic_year,
            name='FIRST',
            defaults={
                'start_date': '2024-01-01',
                'end_date': '2024-04-30',
                'is_current': True,
                'total_days': 120
            }
        )
        if created:
            print(f"   + Created default term: {default_term}")
        
        # Process all assignments
        assignments = Assignment.objects.all()
        fixed_count = 0
        
        for assignment in assignments:
            needs_fix = False
            
            # Fix missing instructions
            if not assignment.instructions or assignment.instructions.strip() == '':
                assignment.instructions = f"Complete this {assignment.assignment_type.lower()} assignment. Follow the description provided above."
                needs_fix = True
                print(f"   + Fixed instructions for: {assignment.title}")
            
            # Fix missing term
            if not assignment.term:
                assignment.term = default_term
                needs_fix = True
                print(f"   + Added term to: {assignment.title}")
            
            # Fix missing class_subject for published assignments
            if assignment.status == 'PUBLISHED' and not assignment.class_subject:
                if assignment.class_instance:
                    # Try to find or create a default subject for this class
                    default_subject, created = Subject.objects.get_or_create(
                        name='General Studies',
                        defaults={
                            'code': 'GEN', 
                            'description': 'General academic work',
                            'category': 'BOTH'
                        }
                    )
                    
                    class_subject, created = ClassSubject.objects.get_or_create(
                        class_instance=assignment.class_instance,
                        subject=default_subject,
                        defaults={'teacher': assignment.created_by}
                    )
                    
                    assignment.class_subject = class_subject
                    needs_fix = True
                    print(f"   + Added subject to: {assignment.title}")
            
            if needs_fix:
                try:
                    assignment.save()
                    fixed_count += 1
                    print(f"   + Fixed assignment: {assignment.title}")
                except Exception as e:
                    print(f"   - Failed to fix {assignment.title}: {e}")
        
        print(f"\nFixed {fixed_count} assignments\n")
        
        # 2. Create missing StudentAssignment records
        print("2. Creating missing student assignment records:")
        
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
                        print(f"   + Created record: {student.get_full_name()} -> {assignment.title}")
        
        print(f"\nCreated {created_count} student assignment records\n")
        
        # 3. Verify the fix
        print("3. Verification:")
        
        total_published = Assignment.objects.filter(status='PUBLISHED').count()
        total_student_records = StudentAssignment.objects.filter(assignment__status='PUBLISHED').count()
        
        print(f"   Published assignments: {total_published}")
        print(f"   Student assignment records: {total_student_records}")
        
        # Check for any remaining validation issues
        print("\n4. Checking for remaining validation issues:")
        
        problem_assignments = []
        for assignment in Assignment.objects.filter(status='PUBLISHED'):
            try:
                assignment.full_clean()
            except Exception as e:
                problem_assignments.append((assignment, str(e)))
        
        if problem_assignments:
            print("   WARNING: Assignments with validation issues:")
            for assignment, error in problem_assignments:
                print(f"     - {assignment.title}: {error}")
        else:
            print("   + All published assignments pass validation")
        
        print(f"\nASSIGNMENT VISIBILITY FIX COMPLETED")

def investigate_current_state():
    """Investigate current assignment state"""
    
    print("=== CURRENT STATE INVESTIGATION ===\n")
    
    # Check assignments
    total_assignments = Assignment.objects.count()
    published_assignments = Assignment.objects.filter(status='PUBLISHED').count()
    
    print(f"ASSIGNMENTS:")
    print(f"   Total: {total_assignments}")
    print(f"   Published: {published_assignments}")
    
    # Check students
    total_students = Student.objects.count()
    students_with_class = Student.objects.filter(current_class__isnull=False).count()
    
    print(f"\nSTUDENTS:")
    print(f"   Total: {total_students}")
    print(f"   With class: {students_with_class}")
    
    # Check student assignment records
    total_records = StudentAssignment.objects.count()
    published_records = StudentAssignment.objects.filter(assignment__status='PUBLISHED').count()
    
    print(f"\nSTUDENT ASSIGNMENT RECORDS:")
    print(f"   Total: {total_records}")
    print(f"   For published assignments: {published_records}")
    
    # Check for validation issues
    print(f"\nVALIDATION CHECK:")
    
    assignments_with_issues = []
    for assignment in Assignment.objects.all():
        issues = []
        
        if not assignment.instructions or assignment.instructions.strip() == '':
            issues.append("Missing instructions")
        
        if assignment.status == 'PUBLISHED':
            if not assignment.class_subject:
                issues.append("Missing class_subject")
            if not assignment.term:
                issues.append("Missing term")
        
        if issues:
            assignments_with_issues.append((assignment, issues))
    
    if assignments_with_issues:
        print(f"   Found {len(assignments_with_issues)} assignments with validation issues:")
        for assignment, issues in assignments_with_issues:
            print(f"     - {assignment.title}: {', '.join(issues)}")
    else:
        print("   + No validation issues found")
    
    print()

if __name__ == '__main__':
    print("ASSIGNMENT VISIBILITY FIX TOOL - FINAL VERSION\n")
    
    # Step 1: Investigate current state
    investigate_current_state()
    
    # Step 2: Fix issues
    fix_assignment_visibility()
    
    # Step 3: Final verification
    print("\n=== FINAL VERIFICATION ===")
    investigate_current_state()
    
    print("Fix completed! You can now test the student portal.")