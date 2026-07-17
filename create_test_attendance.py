#!/usr/bin/env python3
"""
Create test daily attendance records
"""
import os
import sys
import django
from datetime import date, timedelta

# Setup Django
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student, DailyAttendance
from schools.models import Class

def create_test_attendance():
    try:
        # Get all students
        students = Student.objects.all()
        if not students:
            print("No students found. Please create students first.")
            return
        
        # Get today's date
        today = date.today()
        
        print(f"Creating attendance records for {today}")
        
        created_count = 0
        
        for student in students:
            if student.current_class:
                # Create attendance record for today
                attendance, created = DailyAttendance.objects.get_or_create(
                    student=student,
                    date=today,
                    defaults={
                        'class_instance': student.current_class,
                        'status': 'present',  # Mark all as present for testing
                        'marked_by': None
                    }
                )
                
                if created:
                    created_count += 1
                    print(f"Created attendance for {student.get_full_name()} - {student.current_class.level}")
                else:
                    print(f"Attendance already exists for {student.get_full_name()}")
        
        print(f"\nSuccessfully created {created_count} attendance records")
        
        # Also create some records for yesterday with mixed attendance
        yesterday = today - timedelta(days=1)
        print(f"\nCreating mixed attendance records for {yesterday}")
        
        yesterday_count = 0
        for i, student in enumerate(students):
            if student.current_class:
                # Alternate between present and absent for variety
                status = 'present' if i % 2 == 0 else 'absent'
                
                attendance, created = DailyAttendance.objects.get_or_create(
                    student=student,
                    date=yesterday,
                    defaults={
                        'class_instance': student.current_class,
                        'status': status,
                        'marked_by': None
                    }
                )
                
                if created:
                    yesterday_count += 1
                    print(f"Created {status} attendance for {student.get_full_name()}")
        
        print(f"\nSuccessfully created {yesterday_count} attendance records for yesterday")
        
        # Show summary
        total_records = DailyAttendance.objects.count()
        print(f"\nTotal attendance records in database: {total_records}")
        
        # Show records by date
        for check_date in [yesterday, today]:
            records = DailyAttendance.objects.filter(date=check_date)
            present_count = records.filter(status='present').count()
            absent_count = records.filter(status='absent').count()
            print(f"{check_date}: {present_count} present, {absent_count} absent")
        
    except Exception as e:
        print(f"Error creating attendance records: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_test_attendance()