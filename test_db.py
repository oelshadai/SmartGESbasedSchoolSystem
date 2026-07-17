from django.test import TestCase, Client
from django.contrib.auth.models import User
from students.models import Student
from scores.models import SubjectResult, ContinuousAssessment, ExamScore
from reports.models import ReportCard

def quick_test():
    print("=== QUICK DATABASE CHECK ===")
    
    # Count records
    students = Student.objects.count()
    ca_scores = ContinuousAssessment.objects.count()
    exam_scores = ExamScore.objects.count()
    subject_results = SubjectResult.objects.count()
    report_cards = ReportCard.objects.count()
    
    print(f"Students: {students}")
    print(f"CA Scores: {ca_scores}")
    print(f"Exam Scores: {exam_scores}")
    print(f"Subject Results: {subject_results}")
    print(f"Report Cards: {report_cards}")
    
    if subject_results > 0:
        print("\n=== SAMPLE SUBJECT RESULTS ===")
        for sr in SubjectResult.objects.select_related('student', 'class_subject__subject')[:3]:
            print(f"{sr.student.get_full_name()} - {sr.class_subject.subject.name}:")
            print(f"  CA Score: {sr.ca_score}")
            print(f"  Exam Score: {sr.exam_score}")
            print(f"  Total Score: {sr.total_score}")
            print(f"  Grade: {sr.grade}")
    else:
        print("❌ NO SUBJECT RESULTS FOUND - This is the problem!")
        print("Teachers need to enter scores first using the score entry system")
        
quick_test()