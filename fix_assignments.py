#!/usr/bin/env python
"""
Fix assignment visibility issue - ensure all published assignments 
have corresponding StudentAssignment records for students in the target class.
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from assignments.models import Assignment, StudentAssignment
from students.models import Student

def fix_assignments():
    """Create missing StudentAssignment records for published assignments"""
    
    print("🔍 Checking for assignment visibility issues...")
    
    # Get all published assignments
    published_assignments = Assignment.objects.filter(status='PUBLISHED')
    print(f"📚 Found {published_assignments.count()} published assignments")
    
    total_created = 0
    
    for assignment in published_assignments:
        print(f"\n📝 Processing assignment: {assignment.title}")
        print(f"   Class: {assignment.class_instance}")
        
        # Get all active students in the assignment's class
        students_in_class = Student.objects.filter(
            current_class=assignment.class_instance,
            is_active=True
        )
        
        print(f"   👥 Students in class: {students_in_class.count()}")
        
        # Check which students already have StudentAssignment records
        existing_student_assignments = StudentAssignment.objects.filter(
            assignment=assignment
        ).values_list('student_id', flat=True)
        
        print(f"   ✅ Existing student assignments: {len(existing_student_assignments)}")
        
        # Create missing StudentAssignment records
        created_count = 0
        for student in students_in_class:
            if student.id not in existing_student_assignments:
                StudentAssignment.objects.create(
                    assignment=assignment,
                    student=student,
                    status='NOT_STARTED'
                )
                created_count += 1
                print(f"   ➕ Created assignment for: {student.get_full_name()}")
        
        print(f"   🎯 Created {created_count} new student assignments")
        total_created += created_count
    
    print(f"\n✨ Fix complete! Created {total_created} student assignment records")
    
    # Verify the fix
    print("\n🔍 Verification:")
    for assignment in published_assignments:
        student_count = Student.objects.filter(
            current_class=assignment.class_instance,
            is_active=True
        ).count()
        
        assignment_count = StudentAssignment.objects.filter(
            assignment=assignment
        ).count()
        
        status = "✅ OK" if student_count == assignment_count else "❌ MISMATCH"
        print(f"   {assignment.title}: {assignment_count}/{student_count} students {status}")

def show_assignment_stats():
    """Show current assignment statistics"""
    
    print("\n📊 Assignment Statistics:")
    print(f"   Total assignments: {Assignment.objects.count()}")
    print(f"   Published assignments: {Assignment.objects.filter(status='PUBLISHED').count()}")
    print(f"   Draft assignments: {Assignment.objects.filter(status='DRAFT').count()}")
    print(f"   Total student assignments: {StudentAssignment.objects.count()}")
    print(f"   Total students: {Student.objects.filter(is_active=True).count()}")
    
    # Show assignments by class
    print("\n📚 Assignments by Class:")
    from django.db.models import Count
    class_stats = Assignment.objects.filter(status='PUBLISHED').values(
        'class_instance__level'
    ).annotate(
        assignment_count=Count('id')
    ).order_by('class_instance__level')
    
    for stat in class_stats:
        class_name = stat['class_instance__level'] or 'Unknown'
        count = stat['assignment_count']
        print(f"   {class_name}: {count} assignments")

if __name__ == '__main__':
    print("🚀 Assignment Fix Tool")
    print("=" * 50)
    
    show_assignment_stats()
    fix_assignments()
    
    print("\n" + "=" * 50)
    print("✅ Assignment fix completed successfully!")
    print("\nNext steps:")
    print("1. Test student login and check if assignments appear")
    print("2. Create a new assignment as a teacher")
    print("3. Verify it appears immediately in student portal")