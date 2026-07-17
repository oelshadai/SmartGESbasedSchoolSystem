#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from assignments.models import Assignment, Question

def fix_backwards_compatibility():
    """Fix backwards compatibility for existing quizzes without question type configuration"""
    print("=== BACKWARDS COMPATIBILITY FIX ===\n")

    # Find quizzes/exams without question type configuration
    unconfigured_quizzes = Assignment.objects.filter(
        assignment_type__in=['QUIZ', 'EXAM'],
        has_mcq_questions=False,
        has_short_answer_questions=False
    )

    print(f"Found {unconfigured_quizzes.count()} quizzes/exams without question type configuration")

    fixed_count = 0
    for assignment in unconfigured_quizzes:
        # Auto-detect question types from existing questions
        has_mcq = assignment.questions.filter(question_type='mcq').exists()
        has_short = assignment.questions.filter(question_type='short_answer').exists()

        if has_mcq or has_short:
            # Update the assignment with detected types
            assignment.has_mcq_questions = has_mcq
            assignment.has_short_answer_questions = has_short
            assignment.save(skip_validation=True)  # Skip validation for backwards compatibility fix

            print(f"✅ Fixed {assignment.title}: MCQ={has_mcq}, Short Answer={has_short}")
            fixed_count += 1
        else:
            # No questions yet, set both to True for flexibility
            assignment.has_mcq_questions = True
            assignment.has_short_answer_questions = True
            assignment.save(skip_validation=True)  # Skip validation for backwards compatibility fix

            print(f"⚠️  {assignment.title}: No questions yet, enabled both types")
            fixed_count += 1

    print(f"\n✅ Fixed {fixed_count} assignments")

    # Verify all quizzes now have configuration
    still_unconfigured = Assignment.objects.filter(
        assignment_type__in=['QUIZ', 'EXAM'],
        has_mcq_questions=False,
        has_short_answer_questions=False
    )

    if still_unconfigured.exists():
        print(f"❌ Still {still_unconfigured.count()} unconfigured assignments")
    else:
        print("✅ All quizzes/exams now have question type configuration")

if __name__ == '__main__':
    fix_backwards_compatibility()