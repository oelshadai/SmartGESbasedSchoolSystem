#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from students.models import Student
from fees.models import FeeType, FeeStructure, TermBill
from schools.models import Term, School

def debug_fee_generation():
    school = School.objects.first()
    print(f'=== SCHOOL: {school} ===')
    
    print('\n=== STUDENTS ===')
    students = Student.objects.filter(school=school, is_active=True)
    print(f'Active students: {students.count()}')
    for s in students[:3]:
        print(f'- {s.student_id}: {s.first_name} {s.last_name}, Class: {s.current_class}')
        if s.current_class:
            print(f'  Class level: {s.current_class.level}')

    print('\n=== TERMS ===')
    terms = Term.objects.filter(academic_year__school=school)
    print(f'Terms: {terms.count()}')
    current_term = None
    for t in terms:
        print(f'- {t.name} (current: {t.is_current})')
        if t.is_current:
            current_term = t

    print('\n=== FEE TYPES ===')
    fee_types = FeeType.objects.filter(school=school, is_active=True)
    print(f'Active fee types: {fee_types.count()}')
    term_year_fee_types = []
    for ft in fee_types:
        print(f'- {ft.name} ({ft.collection_frequency})')
        if ft.collection_frequency in ['TERM', 'YEAR']:
            term_year_fee_types.append(ft)

    print(f'\nTERM/YEAR fee types: {len(term_year_fee_types)}')

    print('\n=== FEE STRUCTURES ===')
    structures = FeeStructure.objects.filter(school=school)
    print(f'Fee structures: {structures.count()}')
    for fs in structures:
        print(f'- {fs.fee_type.name} | {fs.level} | ₵{fs.amount}')

    # Now simulate bill generation logic
    if current_term and students.exists() and term_year_fee_types:
        print(f'\n=== BILL GENERATION SIMULATION ===')
        print(f'Current term: {current_term.name}')
        print(f'Students to process: {students.count()}')
        
        created_count = 0
        skipped_count = 0
        
        for fee_type in term_year_fee_types:
            print(f'\nProcessing fee type: {fee_type.name}')
            
            for student in students:
                if not student.current_class:
                    print(f'  - {student.student_id}: SKIP (no current class)')
                    skipped_count += 1
                    continue

                # Find fee structure for student's class level
                structure = FeeStructure.objects.filter(
                    school=school,
                    fee_type=fee_type,
                    level=student.current_class.level
                ).first()

                if not structure:
                    print(f'  - {student.student_id}: SKIP (no fee structure for {student.current_class.level})')
                    skipped_count += 1
                    continue

                # Check if bill already exists
                existing = TermBill.objects.filter(
                    student=student,
                    term=current_term,
                    fee_type=fee_type
                ).first()

                if existing:
                    print(f'  - {student.student_id}: SKIP (bill already exists)')
                    skipped_count += 1
                else:
                    print(f'  - {student.student_id}: CREATE BILL (₵{structure.amount})')
                    created_count += 1

        print(f'\nSUMMARY: {created_count} would be created, {skipped_count} would be skipped')
    
    print('\n=== EXISTING TERM BILLS ===')
    existing_bills = TermBill.objects.filter(school=school)
    print(f'Existing bills: {existing_bills.count()}')
    for bill in existing_bills[:5]:
        print(f'- {bill.student.student_id} | {bill.fee_type.name} | {bill.term.name} | ₵{bill.amount_billed}')

if __name__ == '__main__':
    debug_fee_generation()