#!/usr/bin/env python
"""
Debug script to check student report visibility issues
"""
import os
import sys
import django

# Setup Django
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.append(backend_path)
os.chdir(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from django.contrib.auth import get_user_model
from students.models import Student
from reports.models import ReportCard
from scores.models import Term

User = get_user_model()

def debug_student_reports():
    print("=== DEBUGGING STUDENT REPORT VISIBILITY ===\n")
    
    # 1. Check for student users
    print("1. STUDENT USERS:")
    student_users = User.objects.filter(groups__name='Students').prefetch_related('student')
    print(f"   Total student users: {student_users.count()}")
    
    for user in student_users[:5]:  # Show first 5
        try:
            student = Student.objects.get(user=user)
            print(f"   - {user.username} ({user.get_full_name()}) -> Student ID: {student.id}")
        except Student.DoesNotExist:
            print(f"   - {user.username} -> NO STUDENT PROFILE!")
    
    print()
    
    # 2. Check published reports
    print("2. PUBLISHED REPORTS:")
    published_reports = ReportCard.objects.filter(status='PUBLISHED')
    print(f"   Total published reports: {published_reports.count()}")
    
    if published_reports.exists():
        for report in published_reports[:5]:  # Show first 5
            print(f"   - Report ID: {report.id}")
            print(f"     Student: {report.student.get_full_name()} (ID: {report.student.id})")
            print(f"     Term: {report.term}")
            print(f"     Published at: {report.published_at}")
            print(f"     Status: {report.status}")
            print(f"     PDF file: {report.pdf_file.name if report.pdf_file else 'None'}")
            print()
    
    # 3. Check specific student's reports
    print("3. STUDENT REPORT ACCESS TEST:")
    if student_users.exists():
        test_user = student_users.first()
        try:
            test_student = Student.objects.get(user=test_user)
            student_reports = ReportCard.objects.filter(
                student=test_student,
                status='PUBLISHED'
            )
            print(f"   Test student: {test_student.get_full_name()}")
            print(f"   Published reports for this student: {student_reports.count()}")
            
            for report in student_reports:
                print(f"   - Report: {report.term} ({report.status})")
                
        except Student.DoesNotExist:
            print(f"   Test user {test_user.username} has no student profile")
    
    print()
    
    # 4. Check for report status distribution
    print("4. REPORT STATUS DISTRIBUTION:")
    all_reports = ReportCard.objects.all()
    print(f"   Total reports: {all_reports.count()}")
    
    status_counts = {}
    for report in all_reports:
        status = report.status
        status_counts[status] = status_counts.get(status, 0) + 1
    
    for status, count in status_counts.items():
        print(f"   - {status}: {count}")
    
    print()
    
    # 5. Check terms with reports
    print("5. TERMS WITH REPORTS:")
    terms_with_reports = Term.objects.filter(report_cards__isnull=False).distinct()
    print(f"   Terms that have reports: {terms_with_reports.count()}")
    
    for term in terms_with_reports[:5]:
        term_reports = ReportCard.objects.filter(term=term)
        published_count = term_reports.filter(status='PUBLISHED').count()
        total_count = term_reports.count()
        print(f"   - {term}: {published_count}/{total_count} published")
        
    print()
    
    # 6. Check if students have User accounts
    print("6. STUDENT USER ACCOUNT CHECK:")
    all_students = Student.objects.all()
    print(f"   Total students: {all_students.count()}")
    
    students_with_users = 0
    students_without_users = 0
    
    for student in all_students:
        if hasattr(student, 'user') and student.user:
            students_with_users += 1
            print(f"   - {student.get_full_name()} -> User: {student.user.username}")
            # Check groups
            groups = student.user.groups.all()
            group_names = [g.name for g in groups]
            print(f"     Groups: {group_names}")
        else:
            students_without_users += 1
            print(f"   - {student.get_full_name()} -> NO USER ACCOUNT")
    
    print(f"\n   Summary: {students_with_users} with users, {students_without_users} without users")
    
    print()
    
    # 7. Check all groups
    print("7. ALL USER GROUPS:")
    from django.contrib.auth.models import Group
    all_groups = Group.objects.all()
    for group in all_groups:
        user_count = group.user_set.count()
        print(f"   - {group.name}: {user_count} users")

if __name__ == '__main__':
    debug_student_reports()