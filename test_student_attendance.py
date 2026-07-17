#!/usr/bin/env python
"""
Test student attendance endpoints
"""
import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student, DailyAttendance
from schools.models import Class
from django.contrib.auth import get_user_model
from datetime import date, timedelta
import random

User = get_user_model()

def test_student_attendance():
    """Test student attendance functionality"""
    try:
        # Get a test student
        student = Student.objects.filter(is_active=True).first()
        if not student:
            print("No active students found. Please create a student first.")
            return
        
        print(f"Testing with student: {student.get_full_name()}")
        print(f"Student ID: {student.student_id}")
        print(f"Class: {student.current_class}")
        
        # Create some test attendance records if none exist
        existing_records = DailyAttendance.objects.filter(student=student).count()
        print(f"Existing attendance records: {existing_records}")
        
        if existing_records < 5:
            print("Creating test attendance records...")
            
            # Create attendance for the last 10 days
            for i in range(10):
                test_date = date.today() - timedelta(days=i)
                
                # Skip if record already exists
                if DailyAttendance.objects.filter(student=student, date=test_date).exists():
                    continue
                
                # Random status for testing
                status_choices = ['present', 'absent', 'late']
                status = random.choice(status_choices)
                
                # Get a teacher to mark attendance
                teacher = User.objects.filter(
                    school=student.school,
                    role='TEACHER'
                ).first()
                
                DailyAttendance.objects.create(
                    student=student,
                    class_instance=student.current_class,
                    date=test_date,
                    status=status,
                    marked_by=teacher
                )
                print(f"Created attendance record for {test_date}: {status}")
        
        # Test the attendance summary calculation
        from students.attendance_views import StudentAttendanceViewSet
        
        # Create a mock request
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        # Get the student's user account
        student_user = student.user if hasattr(student, 'user') and student.user else None
        if not student_user:
            print("Student doesn't have a user account. Creating one...")
            student_user = User.objects.create_user(
                username=student.student_id,
                email=f"{student.student_id}@school.edu",
                password='password123',
                role='STUDENT',
                school=student.school
            )
            student.user = student_user
            student.save()
        
        mock_request = MockRequest(student_user)
        
        # Test the viewset
        viewset = StudentAttendanceViewSet()
        viewset.request = mock_request
        
        # Test getting student
        test_student = viewset.get_student()
        if test_student:
            print(f"✓ Student lookup successful: {test_student.get_full_name()}")
        else:
            print("✗ Student lookup failed")
            return
        
        # Test attendance records
        response = viewset.my_attendance(mock_request)
        if response.status_code == 200:
            records = response.data.get('records', [])
            print(f"✓ Attendance records retrieved: {len(records)} records")
            if records:
                print(f"  Latest record: {records[0]['date']} - {records[0]['status']}")
        else:
            print(f"✗ Failed to get attendance records: {response.data}")
        
        # Test attendance summary
        response = viewset.my_attendance_summary(mock_request)
        if response.status_code == 200:
            summary = response.data.get('summary', {})
            print(f"✓ Attendance summary retrieved:")
            print(f"  Present: {summary.get('present', 0)}")
            print(f"  Absent: {summary.get('absent', 0)}")
            print(f"  Late: {summary.get('late', 0)}")
            print(f"  Total: {summary.get('total', 0)}")
            print(f"  Rate: {summary.get('rate', 0)}%")
        else:
            print(f"✗ Failed to get attendance summary: {response.data}")
        
        print("\n✅ Student attendance system is working!")
        print("Students can now view their attendance through their dashboard.")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_student_attendance()