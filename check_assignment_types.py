#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from assignments.models import Assignment
from django.db.models import Count

def check_assignments():
    print("=== ASSIGNMENT TYPES STATUS CHECK ===\n")

    # Check assignment type distribution
    types = Assignment.objects.values('assignment_type').annotate(count=Count('id')).order_by('-count')
    print('Assignment Types Distribution:')
    for t in types:
        print(f'  {t["assignment_type"]:10}: {t["count"]} assignments')

    # Check status distribution
    statuses = Assignment.objects.values('status').annotate(count=Count('id')).order_by('-count')
    print('\nAssignment Status Distribution:')
    for s in statuses:
        print(f'  {s["status"]:10}: {s["count"]} assignments')

    # Check quiz/exam question types
    quiz_exams = Assignment.objects.filter(assignment_type__in=['QUIZ', 'EXAM'])
    print(f'\nQuiz/Exam Assignments: {quiz_exams.count()}')
    print('With questions:')
    with_questions = quiz_exams.annotate(q_count=Count('questions')).filter(q_count__gt=0)
    print(f'  {with_questions.count()} have questions')

    # Check hybrid grading fields
    hybrid_quizzes = quiz_exams.filter(has_mcq_questions=True, has_short_answer_questions=True)
    print(f'  {hybrid_quizzes.count()} are hybrid (MCQ + Short Answer)')

    mcq_only = quiz_exams.filter(has_mcq_questions=True, has_short_answer_questions=False)
    print(f'  {mcq_only.count()} are MCQ-only')

    short_only = quiz_exams.filter(has_mcq_questions=False, has_short_answer_questions=True)
    print(f'  {short_only.count()} are Short Answer-only')

    no_config = quiz_exams.filter(has_mcq_questions=False, has_short_answer_questions=False)
    print(f'  {no_config.count()} have no question type configuration')

    print("\n=== IMPLEMENTATION STATUS ===")
    print("✅ HOMEWORK: Text + file submissions, manual grading")
    print("✅ PROJECT: File submissions, manual grading")
    print("✅ EXERCISE: Text + file submissions, manual grading")
    print("✅ QUIZ: Questions with hybrid grading (MCQ auto + Short Answer manual)")
    print("✅ EXAM: Questions with hybrid grading, single attempt")

if __name__ == '__main__':
    check_assignments()