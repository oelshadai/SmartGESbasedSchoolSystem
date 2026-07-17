#!/usr/bin/env python3

import os
import sys
import django
from datetime import datetime, date

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

def create_test_data():
    """Create test students and behavior data"""
    
    from students.models import Student, Behaviour
    from schools.models import School, Term, AcademicYear, Class
    from teachers.models import Teacher
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    print("Creating test data for behavior system...")
    
    # Get first school
    school = School.objects.first()
    if not school:
        print("No school found!")
        return
    
    print(f"Using school: {school.name}")
    
    # Get or create a class
    test_class = Class.objects.filter(school=school).first()
    if not test_class:
        test_class = Class.objects.create(
            school=school,
            name="Test Class 7A",
            level="7"
        )
        print(f"Created test class: {test_class.name}")
    
    # Create test students if none exist
    if Student.objects.filter(school=school).count() == 0:
        print("Creating test students...")
        
        students_data = [
            {
                'student_id': 'STD001',
                'first_name': 'John',
                'last_name': 'Doe',
                'gender': 'M',
                'date_of_birth': date(2010, 5, 15),
                'guardian_name': 'Jane Doe',
                'guardian_phone': '+233123456789',
                'guardian_address': '123 Test Street, Accra',
                'admission_date': date(2023, 9, 1)
            },
            {
                'student_id': 'STD002',
                'first_name': 'Mary',
                'last_name': 'Smith',
                'gender': 'F',
                'date_of_birth': date(2010, 8, 22),
                'guardian_name': 'Robert Smith',
                'guardian_phone': '+233987654321',
                'guardian_address': '456 Sample Avenue, Kumasi',
                'admission_date': date(2023, 9, 1)
            },
            {
                'student_id': 'STD003',
                'first_name': 'David',
                'last_name': 'Johnson',
                'gender': 'M',
                'date_of_birth': date(2010, 12, 3),
                'guardian_name': 'Sarah Johnson',
                'guardian_phone': '+233555666777',
                'guardian_address': '789 Demo Road, Tamale',
                'admission_date': date(2023, 9, 1)
            }
        ]
        
        created_students = []
        for student_data in students_data:
            student = Student.objects.create(
                school=school,
                current_class=test_class,
                **student_data
            )
            created_students.append(student)
            print(f"Created student: {student.get_full_name()} ({student.student_id})")
        
        print(f"Created {len(created_students)} test students")
        
        # Create behavior records for these students
        current_term = Term.objects.filter(academic_year__school=school, is_current=True).first()
        if not current_term:
            current_term = Term.objects.filter(academic_year__school=school).first()
        
        if current_term:
            print(f"Creating behavior records for term: {current_term.name}")
            
            behavior_data = [
                {
                    'conduct': 'EXCELLENT',
                    'attitude': 'VERY_GOOD',
                    'interest': 'READING_WRITING',
                    'punctuality': 'EXCELLENT',
                    'class_teacher_remarks': 'Excellent student with outstanding performance. Shows leadership qualities and helps fellow students.',
                    'promoted_to': 'Basic 8A'
                },
                {
                    'conduct': 'VERY_GOOD',
                    'attitude': 'GOOD',
                    'interest': 'MATHEMATICS_SCIENCE',
                    'punctuality': 'GOOD',
                    'class_teacher_remarks': 'Very good student with consistent academic performance. Shows good cooperation with peers.',
                    'promoted_to': 'Basic 8B'
                },
                {
                    'conduct': 'GOOD',
                    'attitude': 'VERY_GOOD',
                    'interest': 'SPORTS_GAMES',
                    'punctuality': 'SATISFACTORY',
                    'class_teacher_remarks': 'Good student with positive attitude. Shows improvement in academic work and participation.',
                    'promoted_to': 'Basic 8A'
                }
            ]
            
            for i, student in enumerate(created_students):
                behavior_record = Behaviour.objects.create(
                    student=student,
                    term=current_term,
                    **behavior_data[i]
                )
                print(f"Created behavior record for {student.get_full_name()}")
            
            print(f"Created {len(created_students)} behavior records")
        else:
            print("No term found to create behavior records")
    
    else:
        print("Students already exist in the database")
    
    # Summary
    students_count = Student.objects.filter(school=school).count()
    behavior_count = Behaviour.objects.filter(student__school=school).count()
    
    print(f"\nSummary:")
    print(f"- Students in {school.name}: {students_count}")
    print(f"- Behavior records: {behavior_count}")
    print(f"- Test data creation complete!")

if __name__ == "__main__":
    create_test_data()