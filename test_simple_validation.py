#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from assignments.models import Assignment

def test_validation_logic():
    """Test the validation logic directly"""
    print("=== VALIDATION LOGIC TEST ===\n")

    # Get all quizzes
    quizzes = Assignment.objects.filter(assignment_type='QUIZ')
    print(f"Found {quizzes.count()} quizzes:")

    for quiz in quizzes:
        print(f"\n📝 Quiz: {quiz.title}")
        print(f"   Config: MCQ={quiz.has_mcq_questions}, Short Answer={quiz.has_short_answer_questions}")

        # Check existing questions
        mcq_questions = quiz.questions.filter(question_type='mcq').count()
        short_questions = quiz.questions.filter(question_type='short_answer').count()

        print(f"   Questions: {mcq_questions} MCQ, {short_questions} Short Answer")

        # Test validation logic
        issues = []

        if mcq_questions > 0 and not quiz.has_mcq_questions:
            issues.append("❌ Has MCQ questions but MCQ not enabled")

        if short_questions > 0 and not quiz.has_short_answer_questions:
            issues.append("❌ Has short answer questions but Short Answer not enabled")

        if not issues:
            print("   ✅ Configuration matches questions")
        else:
            for issue in issues:
                print(f"   {issue}")

    print("\n=== VALIDATION LOGIC TEST COMPLETE ===")

if __name__ == '__main__':
    test_validation_logic()