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

def test_behavior_api():
    """Test the behavior API endpoints and create sample data if needed"""
    
    from students.models import Student, Behaviour
    from schools.models import School, Term, AcademicYear
    from teachers.models import Teacher
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    print("Testing Behavior API...")
    
    # Check if we have schools
    schools = School.objects.all()
    print(f"Found {schools.count()} schools")
    
    if schools.exists():
        school = schools.first()
        print(f"Using school: {school.name}")
        
        # Check students
        students = Student.objects.filter(school=school)
        print(f"Found {students.count()} students in {school.name}")
        
        # Check terms
        terms = Term.objects.filter(academic_year__school=school)
        print(f"Found {terms.count()} terms in {school.name}")
        
        # Check behavior records
        behavior_records = Behaviour.objects.filter(student__school=school)
        print(f"Found {behavior_records.count()} behavior records")
        
        # Check teachers
        teachers = Teacher.objects.filter(school=school)
        print(f"Found {teachers.count()} teachers")
        
        # If we have students and terms but no behavior records, create some sample data
        if students.exists() and terms.exists() and behavior_records.count() == 0:
            print("\nCreating sample behavior records...")
            
            # Get first few students and current term
            sample_students = students[:3]
            current_term = terms.filter(is_current=True).first() or terms.first()
            
            if current_term:
                for student in sample_students:
                    behavior_record = Behaviour.objects.create(
                        student=student,
                        term=current_term,
                        conduct='GOOD',
                        attitude='VERY_GOOD',
                        interest='READING_WRITING',
                        punctuality='EXCELLENT',
                        class_teacher_remarks=f"Sample behavior record for {student.get_full_name()}. Student shows good progress and positive attitude towards learning.",
                        promoted_to=""
                    )
                    print(f"Created behavior record for {student.get_full_name()}")
                
                print(f"\nCreated {sample_students.count()} sample behavior records")
            else:
                print("No current term found to create behavior records")
        
        elif not students.exists() or not terms.exists():
            print("X No students or terms found to create behavior records")
            if not students.exists():
                print("  - No students found in the school")
            if not terms.exists():
                print("  - No terms found in the school")
        else:
            print(f"Behavior records already exist: {behavior_records.count()} records")
            
            # Show sample records
            for record in behavior_records[:3]:
                print(f"  - {record.student.get_full_name()} ({record.term.name}): {record.conduct}")
    
    else:
        print("No schools found in database")

if __name__ == "__main__":
    test_behavior_api()