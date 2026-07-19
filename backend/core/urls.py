from django.urls import path
from core import views
from rest_framework.permissions import IsAuthenticated

urlpatterns = [
    # Risk
    path('students/<int:student_id>/risk/', views.student_risk_profile, name='ai-student-risk'),
    path('classes/<int:class_id>/risk-summary/', views.class_risk_summary, name='ai-class-risk-summary'),

    # Attendance patterns
    path('students/<int:student_id>/attendance-patterns/', views.attendance_patterns, name='ai-attendance-patterns'),

    # Academic trends
    path('students/<int:student_id>/academic-trends/', views.academic_trends, name='ai-academic-trends'),

    # Fee risk
    path('students/<int:student_id>/fee-risk/', views.fee_default_risk, name='ai-fee-risk'),

    # Smart SMS
    path('students/<int:student_id>/smart-sms/', views.send_smart_sms, name='ai-smart-sms'),

    # Gemini
    path('students/<int:student_id>/generate-report/', views.generate_student_report, name='ai-generate-report'),
    path('lesson-plan/', views.generate_lesson_plan, name='ai-lesson-plan'),
    path('classes/<int:class_id>/insights/', views.generate_class_insights, name='ai-class-insights'),

    # ── Student AI (student JWT auth) ──────────────────────────────────────────
    path('student/chat/', views.student_chat, name='ai-student-chat'),
    path('student/my-analysis/', views.student_my_analysis, name='ai-student-analysis'),
    path('student/study-timetable/', views.student_study_timetable, name='ai-student-timetable'),
    path('student/practice-questions/', views.student_practice_questions, name='ai-student-questions'),
    path('student/explain-report/<int:term_id>/', views.student_explain_report, name='ai-student-explain-report'),
]
