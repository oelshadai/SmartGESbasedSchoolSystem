#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from assignments.models import Assignment, Question
from django.test import RequestFactory
from assignments.api_views import TeacherAssignmentViewSet

def test_question_validation():
    """Test that question type validation works correctly"""
    print("=== QUESTION TYPE VALIDATION TEST ===\n")

    # Get the existing quiz
    quiz = Assignment.objects.filter(assignment_type='QUIZ').first()
    if not quiz:
        print("❌ No quiz found to test with")
        return

    print(f"Testing with quiz: {quiz.title}")
    print(f"Quiz config: MCQ={quiz.has_mcq_questions}, Short Answer={quiz.has_short_answer_questions}")

    # Create a mock request factory
    factory = RequestFactory()
    viewset = TeacherAssignmentViewSet()

    # Test 1: Try to add MCQ question to MCQ-only quiz (should work)
    if quiz.has_mcq_questions:
        request = factory.post(f'/assignments/teacher/{quiz.id}/add-question/',
            data={
                'question_text': 'Test MCQ question',
                'question_type': 'mcq',
                'points': 1,
                'options': [
                    {'option_text': 'Option A', 'is_correct': True},
                    {'option_text': 'Option B', 'is_correct': False}
                ]
            },
            content_type='application/json'
        )
        request.user = quiz.created_by

        try:
            response = viewset.add_question(request, pk=quiz.id)
            if response.status_code == 200:
                print("✅ MCQ question added successfully to MCQ quiz")
                # Clean up
                Question.objects.filter(assignment=quiz, question_text='Test MCQ question').delete()
            else:
                print(f"❌ Failed to add MCQ question: {response.data}")
        except Exception as e:
            print(f"❌ Error adding MCQ question: {e}")

    # Test 2: Try to add short answer question to MCQ-only quiz (should fail)
    if not quiz.has_short_answer_questions:
        request = factory.post(f'/assignments/teacher/{quiz.id}/add-question/',
            data={
                'question_text': 'Test short answer question',
                'question_type': 'short_answer',
                'points': 1
            },
            content_type='application/json'
        )
        request.user = quiz.created_by

        try:
            response = viewset.add_question(request, pk=quiz.id)
            if response.status_code == 400 and 'not allowed' in str(response.data):
                print("✅ Short answer question correctly rejected from MCQ-only quiz")
            else:
                print(f"❌ Short answer question was incorrectly allowed: {response.data}")
        except Exception as e:
            print(f"❌ Error testing short answer rejection: {e}")

    print("\n=== VALIDATION TEST COMPLETE ===")

if __name__ == '__main__':
    test_question_validation()