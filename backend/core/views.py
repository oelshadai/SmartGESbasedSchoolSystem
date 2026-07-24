import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from accounts.permissions import IsSchoolAdmin, IsTeacher, IsSuperAdminOrSchoolAdmin
from students.models import Student
from schools.models import Term, Class
from core import ai_service
from core.models import (
    StudentRiskProfile, AttendanceInsight, AcademicTrend,
    AIGeneratedReport, SmartSMSLog,
)

logger = logging.getLogger(__name__)


def _get_student_and_term(student_id, term_id, school):
    """Helper: fetch student (scoped to school) and term, or raise ValueError."""
    try:
        student = Student.objects.get(id=student_id, school=school)
    except Student.DoesNotExist:
        raise ValueError('Student not found')
    try:
        term = Term.objects.get(id=term_id, academic_year__school=school)
    except Term.DoesNotExist:
        raise ValueError('Term not found')
    return student, term


# ─────────────────────────────────────────────────────────────────────────────
# Risk Profile
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsSuperAdminOrSchoolAdmin])
def student_risk_profile(request, student_id):
    """
    GET /api/ai/students/<student_id>/risk/?term_id=<id>
    Calculates and caches the risk profile for a student in a term.
    """
    term_id = request.query_params.get('term_id')
    if not term_id:
        return Response({'error': 'term_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        student, term = _get_student_and_term(student_id, term_id, request.user.school)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

    data = ai_service.calculate_student_risk(student, term)

    profile, _ = StudentRiskProfile.objects.update_or_create(
        student=student, term=term,
        defaults={
            'risk_level': data['risk_level'],
            'attendance_score': data['attendance_score'],
            'academic_score': data['academic_score'],
            'fee_score': data['fee_score'],
            'risk_factors': data['risk_factors'],
            'recommendations': data['recommendations'],
        }
    )
    return Response(data)


@api_view(['GET'])
@permission_classes([IsSuperAdminOrSchoolAdmin])
def class_risk_summary(request, class_id):
    """
    GET /api/ai/classes/<class_id>/risk-summary/?term_id=<id>
    Returns risk breakdown for all students in a class.
    """
    term_id = request.query_params.get('term_id')
    if not term_id:
        return Response({'error': 'term_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        class_obj = Class.objects.get(id=class_id, school=request.user.school)
        term = Term.objects.get(id=term_id, academic_year__school=request.user.school)
    except (Class.DoesNotExist, Term.DoesNotExist):
        return Response({'error': 'Class or Term not found'}, status=status.HTTP_404_NOT_FOUND)

    students = class_obj.students.filter(is_active=True)
    summary = {'HIGH': 0, 'MEDIUM': 0, 'LOW': 0, 'EXCELLING': 0, 'students': []}

    for student in students:
        data = ai_service.calculate_student_risk(student, term)
        summary[data['risk_level']] += 1
        summary['students'].append({
            'id': student.id,
            'name': student.get_full_name(),
            'risk_level': data['risk_level'],
            'attendance_score': data['attendance_score'],
            'academic_score': data['academic_score'],
        })

    return Response(summary)


# ─────────────────────────────────────────────────────────────────────────────
# Attendance Patterns
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsSuperAdminOrSchoolAdmin])
def attendance_patterns(request, student_id):
    """
    GET /api/ai/students/<student_id>/attendance-patterns/?term_id=<id>
    """
    term_id = request.query_params.get('term_id')
    if not term_id:
        return Response({'error': 'term_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        student, term = _get_student_and_term(student_id, term_id, request.user.school)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

    data = ai_service.detect_attendance_patterns(student, term)

    AttendanceInsight.objects.update_or_create(
        student=student, term=term,
        defaults={
            'pattern_type': data['pattern_type'],
            'absent_day': data['absent_day'],
            'trend': data['trend'],
            'consecutive_absences': data['consecutive_absences'],
            'late_count': data['late_count'],
            'alert_needed': data['alert_needed'],
        }
    )
    return Response(data)


# ─────────────────────────────────────────────────────────────────────────────
# Academic Trends
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsSuperAdminOrSchoolAdmin])
def academic_trends(request, student_id):
    """
    GET /api/ai/students/<student_id>/academic-trends/?term_id=<id>
    """
    term_id = request.query_params.get('term_id')
    if not term_id:
        return Response({'error': 'term_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        student, term = _get_student_and_term(student_id, term_id, request.user.school)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

    data = ai_service.analyse_academic_trends(student, term)

    AcademicTrend.objects.update_or_create(
        student=student, term=term,
        defaults={
            'overall_trend': data['overall_trend'],
            'percentage_change': data['percentage_change'],
            'best_subject': data['best_subject'],
            'worst_subject': data['worst_subject'],
            'subjects_declined': data['subjects_declined'],
            'subjects_improved': data['subjects_improved'],
            'alert_needed': data['alert_needed'],
            'alert_reason': data['alert_reason'],
        }
    )
    return Response(data)


# ─────────────────────────────────────────────────────────────────────────────
# Fee Default Risk
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsSuperAdminOrSchoolAdmin])
def fee_default_risk(request, student_id):
    """
    GET /api/ai/students/<student_id>/fee-risk/?term_id=<id>
    """
    term_id = request.query_params.get('term_id')
    if not term_id:
        return Response({'error': 'term_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        student, term = _get_student_and_term(student_id, term_id, request.user.school)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

    data = ai_service.predict_fee_default_risk(student, term)
    return Response(data)


# ─────────────────────────────────────────────────────────────────────────────
# Smart SMS
# ─────────────────────────────────────────────────────────────────────────────

def _enrich_sms_data(student, term, alert_type, data):
    """
    Auto-populate missing SMS data fields from the database so the
    generated message always contains real values.
    """
    data = dict(data)  # don't mutate the original

    if alert_type == 'FEE_REMINDER':
        from fees.models import TermBill, StudentFee
        from datetime import date

        # Total outstanding balance across all term bills for this term
        if 'balance' not in data or not data['balance']:
            bills = TermBill.objects.filter(
                student=student, term=term, status__in=['UNPAID', 'PARTIAL']
            )
            total_balance = sum(float(b.balance) for b in bills)
            if not total_balance:
                # Fall back to the global StudentFee balance
                try:
                    sf = StudentFee.objects.get(student=student, school=student.school)
                    total_balance = float(sf.balance)
                except StudentFee.DoesNotExist:
                    total_balance = 0.0
            data['balance'] = total_balance

        # Nearest upcoming due date
        if 'due_date' not in data or not data['due_date']:
            upcoming = (
                TermBill.objects.filter(
                    student=student, term=term,
                    status__in=['UNPAID', 'PARTIAL'],
                    due_date__isnull=False,
                )
                .order_by('due_date')
                .values_list('due_date', flat=True)
                .first()
            )
            data['due_date'] = str(upcoming) if upcoming else 'end of term'

        # MoMo number from school settings
        if 'momo_number' not in data or not data['momo_number']:
            data['momo_number'] = getattr(student.school, 'phone_number', '') or ''

    elif alert_type == 'EXAM_POOR':
        from scores.models import TermResult, SubjectResult
        if 'average' not in data or not data['average']:
            try:
                tr = TermResult.objects.get(student=student, term=term)
                data['average'] = float(tr.average_score)
            except TermResult.DoesNotExist:
                pass
        if 'worst_subject' not in data or not data['worst_subject']:
            worst = (
                SubjectResult.objects.filter(student=student, term=term)
                .select_related('class_subject__subject')
                .order_by('total_score')
                .first()
            )
            if worst:
                data['worst_subject'] = worst.class_subject.subject.name

    elif alert_type == 'ATTENDANCE_LOW':
        from students.models import Attendance
        if 'attendance' not in data or not data['attendance']:
            try:
                att = Attendance.objects.get(student=student, term=term)
                data['attendance'] = float(att.attendance_percentage)
            except Attendance.DoesNotExist:
                pass
        if 'school_phone' not in data or not data['school_phone']:
            data['school_phone'] = getattr(student.school, 'phone_number', '') or ''

    elif alert_type == 'POSITIVE_FEEDBACK':
        from scores.models import TermResult, SubjectResult
        if 'average' not in data or not data['average']:
            try:
                tr = TermResult.objects.get(student=student, term=term)
                data['average'] = float(tr.average_score)
            except TermResult.DoesNotExist:
                pass
        if 'best_subject' not in data or not data['best_subject']:
            best = (
                SubjectResult.objects.filter(student=student, term=term)
                .select_related('class_subject__subject')
                .order_by('-total_score')
                .first()
            )
            if best:
                data['best_subject'] = best.class_subject.subject.name

    return data


@api_view(['POST'])
@permission_classes([IsSuperAdminOrSchoolAdmin])
def send_smart_sms(request, student_id):
    """
    POST /api/ai/students/<student_id>/smart-sms/
    Body: { term_id, alert_type, data: {...}, send: true|false }

    If send=true, dispatches via SmsService and logs the result.
    If send=false (default), returns the generated message only (preview).
    """
    term_id = request.data.get('term_id')
    alert_type = request.data.get('alert_type')
    sms_data = request.data.get('data', {})
    do_send = request.data.get('send', False)

    if not term_id or not alert_type:
        return Response({'error': 'term_id and alert_type are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        student, term = _get_student_and_term(student_id, term_id, request.user.school)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

    sms_data = _enrich_sms_data(student, term, alert_type, sms_data)
    message = ai_service.generate_smart_sms(student, alert_type, sms_data)
    phone = student.guardian_phone

    if not do_send:
        return Response({'message': message, 'recipient': phone, 'sent': False})

    if not phone:
        return Response({'error': 'Student has no guardian phone number'}, status=status.HTTP_400_BAD_REQUEST)

    from notifications.sms_service import SmsService
    svc = SmsService()
    school = request.user.school
    success = svc.send([phone], message, school)
    sms_status = 'SENT' if success else 'FAILED'

    SmartSMSLog.objects.create(
        student=student,
        term=term,
        alert_type=alert_type,
        message=message,
        recipient_phone=phone,
        status=sms_status,
    )

    return Response({'message': message, 'recipient': phone, 'sent': True, 'status': sms_status})


# ─────────────────────────────────────────────────────────────────────────────
# Gemini AI Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsSuperAdminOrSchoolAdmin])
def generate_student_report(request, student_id):
    """
    POST /api/ai/students/<student_id>/generate-report/
    Body: { term_id }
    """
    term_id = request.data.get('term_id')
    if not term_id:
        return Response({'error': 'term_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        student, term = _get_student_and_term(student_id, term_id, request.user.school)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

    try:
        report_text = ai_service.generate_ai_student_report(student, term)
    except (ImportError, ValueError) as e:
        return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        logger.exception('Gemini student report failed')
        return Response({'error': 'AI service error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    AIGeneratedReport.objects.create(
        student=student, term=term,
        report_type='STUDENT_REPORT',
        content=report_text,
    )
    return Response({'report': report_text})


@api_view(['POST'])
@permission_classes([IsTeacher | IsSuperAdminOrSchoolAdmin])
def generate_assignment_ai(request):
    """
    POST /api/ai/generate-assignment/
    Body: { subject, topic, assignment_type, class_level, num_questions, duration_minutes? }
    Returns a full assignment JSON ready to pre-fill the create form.
    """
    subject = request.data.get('subject', '').strip()
    topic = request.data.get('topic', '').strip()
    assignment_type = request.data.get('assignment_type', 'HOMEWORK').upper()
    class_level = request.data.get('class_level', '').strip()
    num_questions = request.data.get('num_questions', 5)
    duration_minutes = request.data.get('duration_minutes')
    has_mcq_questions = request.data.get('has_mcq_questions', False)
    has_short_answer_questions = request.data.get('has_short_answer_questions', False)

    if not all([subject, topic, class_level]):
        return Response({'error': 'subject, topic, and class_level are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        result = ai_service.generate_assignment(
            subject,
            topic,
            assignment_type,
            class_level,
            num_questions,
            duration_minutes,
            has_mcq_questions=has_mcq_questions,
            has_short_answer_questions=has_short_answer_questions,
        )
    except (ImportError, ValueError) as e:
        return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception:
        logger.exception('AI generate_assignment failed')
        return Response({'error': 'AI service error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(result)


@api_view(['POST'])
@permission_classes([IsTeacher | IsSuperAdminOrSchoolAdmin])
def generate_questions_ai(request):
    """
    POST /api/ai/generate-questions/
    Body: { subject, topic, class_level, num_questions, question_type? }
    Returns a list of question objects ready to add to an existing assignment.
    """
    subject = request.data.get('subject', '').strip()
    topic = request.data.get('topic', '').strip()
    class_level = request.data.get('class_level', '').strip()
    num_questions = request.data.get('num_questions', 5)
    question_type = request.data.get('question_type', 'mcq')

    if not all([subject, topic, class_level]):
        return Response({'error': 'subject, topic, and class_level are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        questions = ai_service.generate_questions(subject, topic, class_level, num_questions, question_type)
    except (ImportError, ValueError) as e:
        return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception:
        logger.exception('AI generate_questions failed')
        return Response({'error': 'AI service error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'questions': questions})


@api_view(['POST'])
@permission_classes([IsTeacher | IsSuperAdminOrSchoolAdmin])
def generate_lesson_plan(request):
    """
    POST /api/ai/lesson-plan/
    Body: { subject, topic, class_level, duration_minutes }
    """
    subject = request.data.get('subject', '')
    topic = request.data.get('topic', '')
    class_level = request.data.get('class_level', '')
    duration = request.data.get('duration_minutes', 40)

    if not all([subject, topic, class_level]):
        return Response({'error': 'subject, topic, and class_level are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        plan = ai_service.generate_lesson_plan(subject, topic, class_level, int(duration))
    except (ImportError, ValueError) as e:
        return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        logger.exception('Gemini lesson plan failed')
        return Response({'error': 'AI service error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'lesson_plan': plan})


@api_view(['POST'])
@permission_classes([IsSuperAdminOrSchoolAdmin])
def generate_class_insights(request, class_id):
    """
    POST /api/ai/classes/<class_id>/insights/
    Body: { term_id }
    """
    term_id = request.data.get('term_id')
    if not term_id:
        return Response({'error': 'term_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        class_obj = Class.objects.get(id=class_id, school=request.user.school)
        term = Term.objects.get(id=term_id, academic_year__school=request.user.school)
    except (Class.DoesNotExist, Term.DoesNotExist):
        return Response({'error': 'Class or Term not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        insights = ai_service.generate_class_insights(class_obj, term)
    except (ImportError, ValueError) as e:
        return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        logger.exception('Gemini class insights failed')
        return Response({'error': 'AI service error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    AIGeneratedReport.objects.create(
        class_obj=class_obj, term=term,
        report_type='CLASS_INSIGHTS',
        content=insights,
    )
    return Response({'insights': insights})


# ─────────────────────────────────────────────────────────────────────────────
# STUDENT AI ENDPOINTS  (auth: student JWT — request.user.student_profile)
# ─────────────────────────────────────────────────────────────────────────────

def _get_request_student(request):
    """Return the Student for the authenticated student user, or raise ValueError."""
    try:
        return request.user.student_profile
    except Exception:
        raise ValueError('Student profile not found for this user')


def _gemini_call(prompt):
    """Call Gemini and return a friendly fallback message on any failure."""
    try:
        from core.ai_service import _gemini_generate_text

        return _gemini_generate_text(prompt)
    except Exception as exc:
        error_str = str(exc).lower()
        logger.warning('Gemini call failed: %s', exc)

        if 'authentication failed' in error_str or ('api key' in error_str and 'invalid' in error_str):
            raise ValueError('AI service configuration error. Please contact the administrator.')

        if 'getaddrinfo failed' in error_str or 'connecterror' in error_str or 'timed out' in error_str:
            raise ValueError('AI service is temporarily unavailable. Please check your internet connection and try again.')

        if '429' in error_str or 'rate limit' in error_str or 'quota' in error_str:
            raise ValueError('AI service is busy right now. Please try again in 1 minute.')

        raise ValueError('AI is temporarily unavailable. Please try again shortly.')


# ── Feature 1: AI Study Chatbot ───────────────────────────────────────────────

@api_view(['POST'])
def student_chat(request):
    """
    POST /api/ai/student/chat/
    Body: { message, subject? }
    Auth: any authenticated user with a student_profile.
    Rate-limited to 20 messages/day per student via Django cache.
    """
    from django.core.cache import cache

    try:
        student = _get_request_student(request)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    message = (request.data.get('message') or '').strip()
    subject = (request.data.get('subject') or '').strip()
    if not message:
        return Response({'error': 'message is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Daily rate limit
    cache_key = f'student_chat_count:{student.id}:{__import__("datetime").date.today()}'
    count = cache.get(cache_key, 0)
    DAILY_LIMIT = 20
    if count >= DAILY_LIMIT:
        return Response(
            {'error': f'Daily limit of {DAILY_LIMIT} questions reached. Try again tomorrow!'},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )

    class_level = str(student.current_class) if student.current_class else 'Basic School'
    student_name = getattr(student, 'get_full_name', lambda: '')()
    if not student_name:
        student_name = getattr(student, 'first_name', '') or getattr(student, 'name', '') or 'student'
    subject_context = f' about {subject}' if subject else ''

    prompt = (
        f"You are a friendly school tutor for a Ghana Basic/SHS student named {student_name} in {class_level}. "
        f"Answer this question{subject_context} simply and clearly, using examples relevant to Ghana. "
        f"Address the student by their name naturally when appropriate. "
        f"If it's a homework question, guide them to the answer with hints — don't just give it directly. "
        f"Keep response under 200 words. "
        f"Question: {message}"
    )

    try:
        reply = _gemini_call(prompt)
    except (ImportError, ValueError) as e:
        return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception:
        logger.exception('Student chat Gemini call failed')
        return Response({'error': 'AI service error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Increment counter (expires at midnight via 86400s TTL)
    cache.set(cache_key, count + 1, 86400)

    # Simple follow-up suggestions based on subject
    suggestions = []
    if subject:
        suggestions = [
            f'Can you give me an example of {subject}?',
            f'What are the key points I should remember about this?',
            f'Can you make it simpler?',
        ]
    else:
        suggestions = [
            'Can you explain that again more simply?',
            'Give me an example.',
            'What should I study next?',
        ]

    return Response({
        'reply': reply,
        'suggestions': suggestions,
        'messages_used': count + 1,
        'messages_limit': DAILY_LIMIT,
    })


# ── Feature 2: Personal AI Performance Analysis ───────────────────────────────

@api_view(['GET'])
def student_my_analysis(request):
    """
    GET /api/ai/student/my-analysis/
    Rule-based — no Gemini needed.
    """
    try:
        student = _get_request_student(request)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    from scores.models import SubjectResult, TermResult
    from students.models import Attendance
    from schools.models import Term

    # Current term
    term = Term.objects.filter(school=student.school, is_current=True).first()
    if not term:
        term = Term.objects.filter(school=student.school).order_by('-end_date').first()

    if not term:
        return Response({'error': 'No term data found'}, status=status.HTTP_404_NOT_FOUND)

    # Subject results this term
    subject_results = list(
        SubjectResult.objects.filter(student=student, term=term)
        .select_related('class_subject__subject')
        .order_by('-total_score')
    )

    if not subject_results:
        return Response({
            'strengths': [], 'weaknesses': [],
            'attendance_status': 'No Data',
            'overall_trend': 'Stable',
            'ai_message': f"{student.first_name}, no results recorded yet for this term. Keep attending classes!",
            'study_tips': ['Attend all classes', 'Complete all assignments on time'],
            'predicted_grade': 'Not enough data yet',
        })

    # Strengths (top 3 ≥ 60) and weaknesses (bottom 3 < 60)
    strengths = [r.class_subject.subject.name for r in subject_results if float(r.total_score) >= 60][:3]
    weaknesses = [r.class_subject.subject.name for r in reversed(subject_results) if float(r.total_score) < 60][:3]

    # Attendance
    attendance_status = 'No Data'
    try:
        att = Attendance.objects.get(student=student, term=term)
        pct = float(att.attendance_percentage)
        if pct >= 85:
            attendance_status = 'Good'
        elif pct >= 70:
            attendance_status = 'Needs Improvement'
        else:
            attendance_status = 'Critical'
    except Attendance.DoesNotExist:
        pass

    # Overall trend vs previous term
    overall_trend = 'Stable'
    percentage_change = 0.0
    try:
        curr_tr = TermResult.objects.get(student=student, term=term)
        prev_term = Term.objects.filter(
            school=student.school, end_date__lt=term.start_date
        ).order_by('-end_date').first()
        if prev_term:
            prev_tr = TermResult.objects.get(student=student, term=prev_term)
            percentage_change = float(curr_tr.average_score) - float(prev_tr.average_score)
            if percentage_change >= 3:
                overall_trend = 'Improving'
            elif percentage_change <= -3:
                overall_trend = 'Declining'
    except TermResult.DoesNotExist:
        pass

    # Average score
    avg = sum(float(r.total_score) for r in subject_results) / len(subject_results)

    # Personalised AI message
    name = student.first_name
    if overall_trend == 'Improving':
        ai_message = (
            f"{name}, you improved {abs(percentage_change):.1f}% this term! "
            f"Your hard work is paying off. "
            + (f"Keep focusing on {weaknesses[0]}." if weaknesses else "Keep it up!")
        )
    elif overall_trend == 'Declining':
        ai_message = (
            f"{name}, your average dropped {abs(percentage_change):.1f}% this term. "
            f"Don't worry — you can turn this around. "
            + (f"Start by spending more time on {weaknesses[0]}." if weaknesses else "Focus and you'll improve.")
        )
    else:
        ai_message = (
            f"{name}, you're performing consistently this term with an average of {avg:.1f}%. "
            + (f"Push harder in {weaknesses[0]} to move up." if weaknesses else "Keep up the steady work!")
        )

    # Study tips based on weaknesses
    study_tips = []
    for subj in weaknesses[:2]:
        study_tips.append(f'Practice past questions in {subj} for 30 minutes daily')
    if attendance_status in ('Needs Improvement', 'Critical'):
        study_tips.append('Improve attendance — missing class makes catching up harder')
    study_tips.append('Review your notes the same evening after class')
    if not study_tips:
        study_tips = ['Keep reviewing your notes regularly', 'Attempt past exam questions']

    # Predicted grade band
    if avg >= 80:
        predicted_grade = 'A range — Excellent performance'
    elif avg >= 70:
        predicted_grade = 'B range — Very good, keep pushing'
    elif avg >= 60:
        predicted_grade = 'C range — Good, room to improve'
    elif avg >= 50:
        predicted_grade = 'D range — Pass, but needs more effort'
    else:
        predicted_grade = 'Below pass — Urgent improvement needed'

    return Response({
        'strengths': strengths,
        'weaknesses': weaknesses,
        'attendance_status': attendance_status,
        'overall_trend': overall_trend,
        'percentage_change': round(percentage_change, 1),
        'current_average': round(avg, 1),
        'ai_message': ai_message,
        'study_tips': study_tips[:4],
        'predicted_grade': predicted_grade,
    })


# ── Feature 3: Study Timetable Generator ─────────────────────────────────────

@api_view(['POST'])
def student_study_timetable(request):
    """
    POST /api/ai/student/study-timetable/
    Body: { exam_date, subjects, weak_subjects, study_hours_per_day }
    """
    try:
        student = _get_request_student(request)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    from datetime import date
    exam_date_str = request.data.get('exam_date', '')
    subjects = request.data.get('subjects', [])
    weak_subjects = request.data.get('weak_subjects', [])
    hours = request.data.get('study_hours_per_day', 2)

    if not exam_date_str or not subjects:
        return Response({'error': 'exam_date and subjects are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        exam_date = date.fromisoformat(exam_date_str)
        days = (exam_date - date.today()).days
        if days <= 0:
            return Response({'error': 'exam_date must be in the future'}, status=status.HTTP_400_BAD_REQUEST)
    except ValueError:
        return Response({'error': 'Invalid exam_date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

    class_level = str(student.current_class) if student.current_class else 'Basic School'

    prompt = (
        f"Create a study timetable for a Ghana Basic School student in {class_level} "
        f"with {days} days until exams. "
        f"Subjects to cover: {', '.join(subjects)}. "
        f"Weak subjects needing more time: {', '.join(weak_subjects) or 'None specified'}. "
        f"Available study time: {hours} hours per day. "
        f"Return ONLY valid JSON with this structure: "
        f'{{ "days": [ {{ "day": "Day 1 - Monday", "date": "YYYY-MM-DD", '
        f'"sessions": [ {{ "subject": "Maths", "topic": "Fractions", "duration_mins": 60, "tips": "..." }} ] }} ] }}. '
        f"Allocate more sessions to weak subjects. Keep topics specific and actionable."
    )

    try:
        import json
        raw = _gemini_call(prompt)
        if raw.startswith('```'):
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]
        timetable = json.loads(raw.strip())
    except (ImportError, ValueError) as e:
        return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception:
        logger.exception('Study timetable generation failed')
        # Fallback: simple round-robin timetable
        from datetime import timedelta
        timetable = {'days': []}
        for i in range(min(days, 14)):
            day_date = date.today() + timedelta(days=i + 1)
            subj = subjects[i % len(subjects)]
            timetable['days'].append({
                'day': f'Day {i + 1}',
                'date': day_date.isoformat(),
                'sessions': [{'subject': subj, 'topic': f'Review {subj}', 'duration_mins': int(hours) * 60, 'tips': 'Use past questions'}],
            })

    return Response({'timetable': timetable, 'days_until_exam': days})


# ── Feature 4: Practice Question Generator ───────────────────────────────────

@api_view(['POST'])
def student_practice_questions(request):
    """
    POST /api/ai/student/practice-questions/
    Body: { subject, topic, difficulty, count }
    """
    try:
        student = _get_request_student(request)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    subject = (request.data.get('subject') or '').strip()
    topic = (request.data.get('topic') or '').strip()
    difficulty = request.data.get('difficulty', 'medium')
    count = min(int(request.data.get('count', 5)), 10)  # cap at 10

    if not subject or not topic:
        return Response({'error': 'subject and topic are required'}, status=status.HTTP_400_BAD_REQUEST)

    class_level = str(student.current_class) if student.current_class else 'Basic School'

    prompt = (
        f"Generate {count} {difficulty} multiple-choice practice questions for a "
        f"Ghana Basic School {class_level} student on topic: {topic} in {subject}. "
        f"Follow Ghana Education Service curriculum. "
        f"Return ONLY a valid JSON array. Each item must have: "
        f'"question" (string), "options" (object with keys A B C D), '
        f'"answer" (string, one of A B C D), "explanation" (string, 1-2 sentences). '
        f"Example: [{{\"question\": \"...\", \"options\": {{\"A\": \"...\", \"B\": \"...\", \"C\": \"...\", \"D\": \"...\"}}, \"answer\": \"A\", \"explanation\": \"...\"}}]"
    )

    try:
        import json
        raw = _gemini_call(prompt)
        if raw.startswith('```'):
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]
        questions = json.loads(raw.strip())
        if not isinstance(questions, list):
            raise ValueError('Expected a JSON array')
    except (ImportError, ValueError) as e:
        return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception:
        logger.exception('Practice questions generation failed')
        return Response({'error': 'AI service error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'questions': questions, 'subject': subject, 'topic': topic, 'difficulty': difficulty})


# ── Feature 5: Report Card Explainer ─────────────────────────────────────────

@api_view(['GET'])
def student_explain_report(request, term_id):
    """
    GET /api/ai/student/explain-report/<term_id>/
    """
    try:
        student = _get_request_student(request)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    from scores.models import TermResult, SubjectResult
    from students.models import Attendance
    from schools.models import Term

    try:
        term = Term.objects.get(id=term_id, school=student.school)
    except Term.DoesNotExist:
        return Response({'error': 'Term not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        tr = TermResult.objects.get(student=student, term=term)
    except TermResult.DoesNotExist:
        return Response({'error': 'No results found for this term'}, status=status.HTTP_404_NOT_FOUND)

    subject_results = SubjectResult.objects.filter(
        student=student, term=term
    ).select_related('class_subject__subject').order_by('-total_score')

    best = subject_results.first()
    worst = subject_results.last()
    attendance_pct = 0.0
    try:
        att = Attendance.objects.get(student=student, term=term)
        attendance_pct = float(att.attendance_percentage)
    except Attendance.DoesNotExist:
        pass

    class_level = str(student.current_class) if student.current_class else 'Basic School'

    prompt = (
        f"Explain this school report card to a {class_level} student in simple, encouraging language. "
        f"Student name: {student.first_name}. "
        f"Overall average: {tr.average_score}%. "
        f"Class position: {tr.class_position or 'N/A'} out of {tr.total_students}. "
        f"Best subject: {best.class_subject.subject.name if best else 'N/A'} ({float(best.total_score) if best else 0:.0f}%). "
        f"Weakest subject: {worst.class_subject.subject.name if worst else 'N/A'} ({float(worst.total_score) if worst else 0:.0f}%). "
        f"Attendance: {attendance_pct:.0f}%. "
        f"Teacher said: {tr.teacher_remarks or 'No remarks'}. "
        f"Write a friendly 3-4 sentence explanation directly to {student.first_name}. "
        f"Include one specific encouragement and one specific improvement tip. "
        f"Use simple English suitable for a school student in Ghana."
    )

    try:
        explanation = _gemini_call(prompt)
    except (ImportError, ValueError) as e:
        return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception:
        logger.exception('Report explainer Gemini call failed')
        return Response({'error': 'AI service error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({
        'explanation': explanation,
        'average': float(tr.average_score),
        'position': tr.class_position,
        'total_students': tr.total_students,
        'best_subject': best.class_subject.subject.name if best else None,
        'worst_subject': worst.class_subject.subject.name if worst else None,
        'attendance': round(attendance_pct, 1),
    })
