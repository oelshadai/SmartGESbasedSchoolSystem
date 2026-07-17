#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student, DailyAttendance
from assignments.models import StudentAssignment, StudentPortalAccess, QuizAttempt, QuizAnswer
from scores.models import ContinuousAssessment, ExamScore, SubjectResult, TermResult
from reports.models import ReportCard
from django.contrib.auth.models import User

def clear_all_students():
    """Clear all student data from the database"""
    try:
        print("Clearing all student data...")
        
        # Delete student-related data
        print("Deleting quiz answers...")
        QuizAnswer.objects.all().delete()
        
        print("Deleting quiz attempts...")
        QuizAttempt.objects.all().delete()
        
        print("Deleting student assignments...")
        StudentAssignment.objects.all().delete()
        
        print("Deleting student portal access...")
        StudentPortalAccess.objects.all().delete()
        
        print("Deleting student scores...")
        ContinuousAssessment.objects.all().delete()
        ExamScore.objects.all().delete()
        SubjectResult.objects.all().delete()
        TermResult.objects.all().delete()
        
        print("Deleting student reports...")
        ReportCard.objects.all().delete()
        
        print("Deleting daily attendance...")
        DailyAttendance.objects.all().delete()
        
        # Get all students and their associated users
        students = Student.objects.all()
        student_users = []
        
        for student in students:
            if student.user:
                student_users.append(student.user)
        
        print(f"Deleting {students.count()} students...")
        students.delete()
        
        # Delete associated user accounts
        print(f"Deleting {len(student_users)} student user accounts...")
        for user in student_users:
            try:
                user.delete()
            except:
                pass
        
        print("All student data cleared successfully!")
        print("You can now create fresh student accounts.")
        
    except Exception as e:
        print(f"Error clearing student data: {e}")

if __name__ == "__main__":
    clear_all_students()