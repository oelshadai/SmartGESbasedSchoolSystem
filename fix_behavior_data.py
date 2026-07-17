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

def fix_behavior_data():
    """Fix behavior data by using existing students or creating new ones with unique IDs"""
    
    from students.models import Student, Behaviour
    from schools.models import School, Term, AcademicYear, Class
    from teachers.models import Teacher
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    print("Fixing behavior data...")
    
    # Get first school
    school = School.objects.first()
    if not school:
        print("No school found!")
        return
    
    print(f"Using school: {school.name}")
    
    # Check existing students
    existing_students = Student.objects.filter(school=school)
    print(f"Found {existing_students.count()} existing students")
    
    if existing_students.count() == 0:
        # Get or create a class
        test_class = Class.objects.filter(school=school).first()
        if not test_class:
            test_class = Class.objects.create(
                school=school,
                name="Test Class 7A",
                level="7"
            )
            print(f"Created test class: {test_class.name}")
        
        # Create students with unique IDs
        import random
        students_data = []
        for i in range(3):
            unique_id = f"STD{random.randint(1000, 9999)}"
            # Ensure uniqueness
            while Student.objects.filter(student_id=unique_id).exists():
                unique_id = f"STD{random.randint(1000, 9999)}"
            
            students_data.append({
                'student_id': unique_id,
                'first_name': ['John', 'Mary', 'David'][i],
                'last_name': ['Doe', 'Smith', 'Johnson'][i],
                'gender': ['M', 'F', 'M'][i],
                'date_of_birth': date(2010, [5, 8, 12][i], [15, 22, 3][i]),
                'guardian_name': ['Jane Doe', 'Robert Smith', 'Sarah Johnson'][i],
                'guardian_phone': ['+233123456789', '+233987654321', '+233555666777'][i],
                'guardian_address': ['123 Test Street, Accra', '456 Sample Avenue, Kumasi', '789 Demo Road, Tamale'][i],
                'admission_date': date(2023, 9, 1)
            })
        
        created_students = []
        for student_data in students_data:
            try:
                student = Student.objects.create(
                    school=school,
                    current_class=test_class,
                    **student_data
                )
                created_students.append(student)
                print(f"Created student: {student.get_full_name()} ({student.student_id})")
            except Exception as e:
                print(f"Failed to create student {student_data['student_id']}: {e}")
        
        existing_students = created_students
    
    # Create behavior records if none exist
    current_term = Term.objects.filter(academic_year__school=school, is_current=True).first()
    if not current_term:
        current_term = Term.objects.filter(academic_year__school=school).first()
    
    if current_term and existing_students:
        print(f"Creating behavior records for term: {current_term.name}")
        
        behavior_templates = [
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
        
        created_behaviors = 0
        for i, student in enumerate(existing_students[:3]):  # Limit to first 3 students
            # Check if behavior record already exists
            if not Behaviour.objects.filter(student=student, term=current_term).exists():
                behavior_data = behavior_templates[i % len(behavior_templates)]
                try:
                    behavior_record = Behaviour.objects.create(
                        student=student,
                        term=current_term,
                        **behavior_data
                    )
                    created_behaviors += 1
                    print(f"Created behavior record for {student.get_full_name()}")
                except Exception as e:
                    print(f"Failed to create behavior record for {student.get_full_name()}: {e}")
            else:
                print(f"Behavior record already exists for {student.get_full_name()}")
        
        print(f"Created {created_behaviors} new behavior records")
    else:
        print("No term found or no students available to create behavior records")
    
    # Summary
    students_count = Student.objects.filter(school=school).count()
    behavior_count = Behaviour.objects.filter(student__school=school).count()
    
    print(f"\nSummary:")
    print(f"- Students in {school.name}: {students_count}")
    print(f"- Behavior records: {behavior_count}")
    print(f"- Fix complete!")

if __name__ == "__main__":
    fix_behavior_data()