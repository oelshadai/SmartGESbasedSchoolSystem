"""
AI Service — rule-based intelligence layer for SmartGES.

All functions are pure Python; no external AI dependency required.
Gemini functions are gated behind a try/except so the server starts
even when google-generativeai is not installed yet.
"""

import logging
import os
import time
from collections import Counter
from datetime import date, timedelta

import requests
from django.conf import settings
from requests.exceptions import ConnectionError, RequestException, SSLError, Timeout

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# SECTION A — RULE-BASED FUNCTIONS (free, no API key needed)
# ─────────────────────────────────────────────────────────────────────────────

def calculate_student_risk(student, term):
    """
    Calculates a risk level for a student in a given term using:
      - Attendance.attendance_percentage  (term summary)
      - TermResult.average_score
      - StudentFee.status / balance

    Returns dict:
      risk_level        : 'HIGH' | 'MEDIUM' | 'LOW' | 'EXCELLING'
      risk_factors      : list[str]
      recommendations   : list[str]
      attendance_score  : float  (0-100)
      academic_score    : float  (0-100)
      fee_score         : float  (0 bad → 100 good)
    """
    from students.models import Attendance
    from scores.models import TermResult
    from fees.models import StudentFee

    risk_factors = []
    recommendations = []

    # ── Attendance ────────────────────────────────────────────────────────────
    attendance_score = 100.0
    try:
        att = Attendance.objects.get(student=student, term=term)
        attendance_score = float(att.attendance_percentage)
    except Attendance.DoesNotExist:
        attendance_score = 100.0  # no data → assume fine

    # ── Academic ──────────────────────────────────────────────────────────────
    academic_score = 100.0
    try:
        tr = TermResult.objects.get(student=student, term=term)
        academic_score = float(tr.average_score)
    except TermResult.DoesNotExist:
        academic_score = 100.0

    # ── Fee ───────────────────────────────────────────────────────────────────
    fee_score = 100.0
    fee_status = 'UNKNOWN'
    fee_balance = 0.0
    try:
        sf = StudentFee.objects.get(student=student, school=student.school)
        fee_status = sf.status
        fee_balance = float(sf.balance)
        fee_total = float(sf.total_amount) if sf.total_amount else 1.0
        if fee_status == 'PAID':
            fee_score = 100.0
        elif fee_status == 'DEFAULTED':
            fee_score = 0.0
        elif fee_status == 'PARTIAL':
            fee_score = max(0.0, 100.0 - (fee_balance / max(fee_total, 1)) * 100)
        else:
            fee_score = 50.0  # NOT_STARTED
    except StudentFee.DoesNotExist:
        fee_score = 100.0

    # ── Classify risk ─────────────────────────────────────────────────────────
    is_high = (
        attendance_score < 70
        or academic_score < 50
        or fee_status == 'DEFAULTED'
    )
    is_medium = (
        (70 <= attendance_score < 80)
        or (50 <= academic_score < 60)
        or (fee_status == 'PARTIAL' and fee_balance > 0
            and (fee_balance / max(float(StudentFee.objects.filter(
                student=student, school=student.school
            ).values_list('total_amount', flat=True).first() or 1), 1)) > 0.5)
    )
    is_excelling = (
        attendance_score >= 90
        and academic_score >= 75
        and fee_status == 'PAID'
    )

    if is_high:
        risk_level = 'HIGH'
    elif is_excelling:
        risk_level = 'EXCELLING'
    elif is_medium:
        risk_level = 'MEDIUM'
    else:
        risk_level = 'LOW'

    # ── Build factors & recommendations ───────────────────────────────────────
    if attendance_score < 70:
        risk_factors.append(f'Attendance critically low at {attendance_score:.1f}%')
        recommendations.append('Contact guardian immediately regarding absences')
    elif attendance_score < 80:
        risk_factors.append(f'Attendance below target at {attendance_score:.1f}%')
        recommendations.append('Send attendance reminder SMS to guardian')

    if academic_score < 50:
        risk_factors.append(f'Term average below pass mark at {academic_score:.1f}%')
        recommendations.append('Arrange extra tuition or remedial classes')
    elif academic_score < 60:
        risk_factors.append(f'Term average needs improvement at {academic_score:.1f}%')
        recommendations.append('Identify weak subjects and provide targeted support')

    if fee_status == 'DEFAULTED':
        risk_factors.append('Fee account in default')
        recommendations.append('Urgent fee discussion with guardian required')
    elif fee_status == 'PARTIAL' and fee_balance > 0:
        risk_factors.append(f'Outstanding fee balance of GH₵{fee_balance:.2f}')
        recommendations.append('Send fee reminder SMS via MoMo payment option')

    if risk_level == 'EXCELLING':
        recommendations.append('Nominate for academic excellence recognition')

    return {
        'risk_level': risk_level,
        'risk_factors': risk_factors,
        'recommendations': recommendations,
        'attendance_score': round(attendance_score, 2),
        'academic_score': round(academic_score, 2),
        'fee_score': round(fee_score, 2),
    }


def detect_attendance_patterns(student, term):
    """
    Analyses DailyAttendance records for a student within a term's date range.

    Returns dict:
      pattern_type         : 'REGULAR_ABSENCE' | 'DECLINING' | 'IMPROVING' | 'CONSISTENT'
      absent_day           : str | None  (e.g. 'Monday')
      trend                : 'IMPROVING' | 'DECLINING' | 'STABLE'
      consecutive_absences : int  (max consecutive absent streak)
      late_count           : int
      alert_needed         : bool
    """
    from students.models import DailyAttendance

    DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    records = list(
        DailyAttendance.objects.filter(
            student=student,
            date__gte=term.start_date,
            date__lte=term.end_date,
        ).order_by('date').values('date', 'status')
    )

    if not records:
        return {
            'pattern_type': 'CONSISTENT',
            'absent_day': None,
            'trend': 'STABLE',
            'consecutive_absences': 0,
            'late_count': 0,
            'alert_needed': False,
        }

    # ── Day-of-week absence frequency ─────────────────────────────────────────
    absent_days = [r['date'].weekday() for r in records if r['status'] == 'absent']
    absent_day = None
    if absent_days:
        most_common_dow, count = Counter(absent_days).most_common(1)[0]
        # Only flag if that day accounts for ≥30% of all absences
        if count / len(absent_days) >= 0.30:
            absent_day = DAYS[most_common_dow]

    # ── Late count ────────────────────────────────────────────────────────────
    late_count = sum(1 for r in records if r['status'] == 'late')

    # ── Consecutive absences ──────────────────────────────────────────────────
    max_streak = 0
    current_streak = 0
    for r in records:
        if r['status'] == 'absent':
            current_streak += 1
            max_streak = max(max_streak, current_streak)
        else:
            current_streak = 0

    # ── Trend: compare first half vs second half of term ─────────────────────
    mid = len(records) // 2
    first_half = records[:mid]
    second_half = records[mid:]

    def _present_rate(chunk):
        if not chunk:
            return 1.0
        return sum(1 for r in chunk if r['status'] == 'present') / len(chunk)

    first_rate = _present_rate(first_half)
    second_rate = _present_rate(second_half)
    diff = second_rate - first_rate

    if diff >= 0.05:
        trend = 'IMPROVING'
    elif diff <= -0.05:
        trend = 'DECLINING'
    else:
        trend = 'STABLE'

    # ── Pattern type ──────────────────────────────────────────────────────────
    if absent_day:
        pattern_type = 'REGULAR_ABSENCE'
    elif trend == 'DECLINING':
        pattern_type = 'DECLINING'
    elif trend == 'IMPROVING':
        pattern_type = 'IMPROVING'
    else:
        pattern_type = 'CONSISTENT'

    alert_needed = (
        max_streak >= 3
        or trend == 'DECLINING'
        or absent_day is not None
        or late_count >= 5
    )

    return {
        'pattern_type': pattern_type,
        'absent_day': absent_day,
        'trend': trend,
        'consecutive_absences': max_streak,
        'late_count': late_count,
        'alert_needed': alert_needed,
    }


def analyse_academic_trends(student, current_term):
    """
    Compares SubjectResult scores across the current term and the previous term.

    Returns dict:
      overall_trend      : 'IMPROVING' | 'DECLINING' | 'STABLE'
      percentage_change  : float  (positive = improved)
      best_subject       : str
      worst_subject      : str
      subjects_declined  : list[dict]  [{name, prev, current, change}]
      subjects_improved  : list[dict]
      alert_needed       : bool
      alert_reason       : str | None
    """
    from scores.models import SubjectResult, TermResult
    from schools.models import Term

    # ── Current term subject scores ───────────────────────────────────────────
    current_results = SubjectResult.objects.filter(
        student=student, term=current_term
    ).select_related('class_subject__subject')

    if not current_results.exists():
        return {
            'overall_trend': 'STABLE',
            'percentage_change': 0.0,
            'best_subject': None,
            'worst_subject': None,
            'subjects_declined': [],
            'subjects_improved': [],
            'alert_needed': False,
            'alert_reason': None,
        }

    current_map = {
        r.class_subject.subject.name: float(r.total_score)
        for r in current_results
    }

    best_subject = max(current_map, key=current_map.get)
    worst_subject = min(current_map, key=current_map.get)

    # ── Previous term ─────────────────────────────────────────────────────────
    prev_term = (
        Term.objects.filter(
            academic_year=current_term.academic_year,
            end_date__lt=current_term.start_date,
        )
        .order_by('-end_date')
        .first()
    )

    if not prev_term:
        # No previous term — return current-only data
        return {
            'overall_trend': 'STABLE',
            'percentage_change': 0.0,
            'best_subject': best_subject,
            'worst_subject': worst_subject,
            'subjects_declined': [],
            'subjects_improved': [],
            'alert_needed': False,
            'alert_reason': None,
        }

    prev_results = SubjectResult.objects.filter(
        student=student, term=prev_term
    ).select_related('class_subject__subject')

    prev_map = {
        r.class_subject.subject.name: float(r.total_score)
        for r in prev_results
    }

    # ── Compare ───────────────────────────────────────────────────────────────
    subjects_declined = []
    subjects_improved = []
    alert_needed = False
    alert_reason = None

    for subject, current_score in current_map.items():
        if subject not in prev_map:
            continue
        prev_score = prev_map[subject]
        change = current_score - prev_score
        entry = {
            'name': subject,
            'previous': round(prev_score, 1),
            'current': round(current_score, 1),
            'change': round(change, 1),
        }
        if change < -15:
            subjects_declined.append(entry)
            alert_needed = True
            alert_reason = f'{subject} dropped by {abs(change):.1f}%'
        elif change < 0:
            subjects_declined.append(entry)
        elif change > 0:
            subjects_improved.append(entry)

    # ── Overall trend via TermResult averages ─────────────────────────────────
    percentage_change = 0.0
    overall_trend = 'STABLE'
    try:
        curr_tr = TermResult.objects.get(student=student, term=current_term)
        prev_tr = TermResult.objects.get(student=student, term=prev_term)
        percentage_change = float(curr_tr.average_score) - float(prev_tr.average_score)
        if percentage_change >= 3:
            overall_trend = 'IMPROVING'
        elif percentage_change <= -3:
            overall_trend = 'DECLINING'
    except TermResult.DoesNotExist:
        pass

    return {
        'overall_trend': overall_trend,
        'percentage_change': round(percentage_change, 2),
        'best_subject': best_subject,
        'worst_subject': worst_subject,
        'subjects_declined': subjects_declined,
        'subjects_improved': subjects_improved,
        'alert_needed': alert_needed,
        'alert_reason': alert_reason,
    }


def predict_fee_default_risk(student, term):
    """
    Predicts fee default risk using FeePayment history and TermBill data.

    Returns dict:
      default_risk         : 'HIGH' | 'MEDIUM' | 'LOW'
      previous_defaults    : int
      days_until_due       : int | None
      balance_remaining    : float
      recommended_action   : str
      best_sms_day         : str  (day of week to send reminder)
    """
    from fees.models import StudentFee, TermBill, FeePayment

    today = date.today()

    # ── Current balance ───────────────────────────────────────────────────────
    balance_remaining = 0.0
    try:
        sf = StudentFee.objects.get(student=student, school=student.school)
        balance_remaining = float(sf.balance)
    except StudentFee.DoesNotExist:
        pass

    # ── Previous defaults: count terms where student had DEFAULTED status ─────
    # We approximate by counting TermBills that ended UNPAID/PARTIAL past due date
    previous_defaults = TermBill.objects.filter(
        student=student,
        due_date__lt=today,
        status__in=['UNPAID', 'PARTIAL'],
    ).exclude(term=term).count()

    # ── Days until due ────────────────────────────────────────────────────────
    days_until_due = None
    upcoming_bill = (
        TermBill.objects.filter(
            student=student,
            term=term,
            due_date__gte=today,
            status__in=['UNPAID', 'PARTIAL'],
        )
        .order_by('due_date')
        .first()
    )
    if upcoming_bill and upcoming_bill.due_date:
        days_until_due = (upcoming_bill.due_date - today).days

    # ── Payment timing history: how many days after due date did they pay? ────
    late_payments = FeePayment.objects.filter(student=student).count()
    total_payments = late_payments  # we use count as a proxy for engagement

    # ── Risk classification ───────────────────────────────────────────────────
    if previous_defaults >= 2 or (days_until_due is not None and days_until_due <= 3 and balance_remaining > 0):
        default_risk = 'HIGH'
        recommended_action = 'Call guardian immediately and arrange payment plan'
        best_sms_day = 'Monday'
    elif previous_defaults == 1 or (days_until_due is not None and days_until_due <= 7 and balance_remaining > 0):
        default_risk = 'MEDIUM'
        recommended_action = 'Send SMS reminder with MoMo payment details'
        best_sms_day = 'Wednesday'
    else:
        default_risk = 'LOW'
        recommended_action = 'Standard fee reminder at term start'
        best_sms_day = 'Friday'

    return {
        'default_risk': default_risk,
        'previous_defaults': previous_defaults,
        'days_until_due': days_until_due,
        'balance_remaining': round(balance_remaining, 2),
        'recommended_action': recommended_action,
        'best_sms_day': best_sms_day,
    }


def generate_smart_sms(student, alert_type, data):
    """
    Generates a personalised SMS under 160 characters.

    alert_type options:
      ATTENDANCE_LOW    data: {'attendance': float, 'school_phone': str}
      EXAM_POOR         data: {'average': float, 'worst_subject': str}
      FEE_REMINDER      data: {'balance': float, 'due_date': str, 'momo_number': str}
      RISK_ALERT        data: {'risk_level': str, 'main_factor': str}
      POSITIVE_FEEDBACK data: {'average': float, 'best_subject': str}

    Returns str (max 160 chars).
    """
    guardian = student.guardian_name.split()[0] if student.guardian_name else 'Guardian'
    first_name = student.first_name
    school = student.school.name if student.school else 'School'

    templates = {
        'ATTENDANCE_LOW': (
            f"Hi {guardian}, {first_name}'s attendance is "
            f"{data.get('attendance', 0):.0f}% this term. "
            f"Please contact {school}. "
            f"Call: {data.get('school_phone', '')}"
        ),
        'EXAM_POOR': (
            f"Hi {guardian}, {first_name} scored {data.get('average', 0):.0f}% avg "
            f"this term. Needs support in {data.get('worst_subject', 'some subjects')}. "
            f"Contact {school}."
        ),
        'FEE_REMINDER': (
            f"Hi {guardian}, {first_name}'s fee balance is "
            f"GHS {data.get('balance', 0):.0f}. "
            f"Due: {data.get('due_date', 'soon')}. "
            f"Pay via MoMo: {data.get('momo_number', '')} - {school}"
        ),
        'RISK_ALERT': (
            f"Hi {guardian}, {first_name} needs attention at {school}. "
            f"{data.get('main_factor', 'Please contact the school')}. "
            f"Call us today."
        ),
        'POSITIVE_FEEDBACK': (
            f"Hi {guardian}, great news! {first_name} scored "
            f"{data.get('average', 0):.0f}% avg this term. "
            f"Best in {data.get('best_subject', 'class')}. "
            f"Well done! - {school}"
        ),
    }

    message = templates.get(alert_type, f"Hi {guardian}, please contact {school} regarding {first_name}.")
    # Hard-truncate to 160 chars (single SMS segment)
    return message[:160]


# ─────────────────────────────────────────────────────────────────────────────
# SECTION B — AI PROVIDER FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def _get_ai_provider():
    """Return the preferred AI provider: ollama, groq, gemini, or auto."""
    provider = (
        getattr(settings, 'AI_PROVIDER', '')
        or os.getenv('AI_PROVIDER', '')
        or 'auto'
    ).strip().lower()
    if provider in {'ollama', 'groq', 'gemini', 'auto'}:
        return provider
    return 'auto'


def _get_ollama_base_url():
    """Return the Ollama base URL from settings or environment."""
    base_url = (
        getattr(settings, 'OLLAMA_HOST', '')
        or getattr(settings, 'OLLAMA_BASE_URL', '')
        or os.getenv('OLLAMA_HOST', '')
        or os.getenv('OLLAMA_BASE_URL', '')
        or 'http://127.0.0.1:11434'
    ).strip().strip('"').strip("'")
    return base_url.rstrip('/')


def _get_ollama_model():
    """Return the requested Ollama model name."""
    model = (
        getattr(settings, 'OLLAMA_MODEL', '')
        or os.getenv('OLLAMA_MODEL', '')
        or 'llama3.2'
    ).strip().strip('"').strip("'")
    return model or 'llama3.2'


def _ollama_generate_text(prompt, model=None):
    """Call a local Ollama server when available."""
    base_url = _get_ollama_base_url()
    model_name = model or _get_ollama_model()
    url = f'{base_url}/api/generate'
    payload = {
        'model': model_name,
        'prompt': prompt,
        'stream': False,
        'options': {'num_predict': 300},
    }

    try:
        response = requests.post(url, json=payload, timeout=60)
    except (SSLError, ConnectionError, Timeout, RequestException) as exc:
        raise ValueError(f'Ollama is unavailable: {exc}') from exc

    if response.status_code != 200:
        raise ValueError(f'Ollama request failed with status {response.status_code}: {response.text[:200]}')

    result = response.json()
    text = (result.get('response') or '').strip()
    if not text:
        raise ValueError('Ollama returned no response')
    return text


def _get_groq_api_key():
    """Return the configured Groq API key from Django settings or environment."""
    api_key = (
        getattr(settings, 'GROQ_API_KEY', '')
        or os.getenv('GROQ_API_KEY', '')
    )
    api_key = str(api_key or '').strip().strip('"').strip("'")
    if not api_key:
        raise ValueError('GROQ_API_KEY not set in settings')
    return api_key


def _get_groq_model():
    """Return the configured Groq model name."""
    model = (
        getattr(settings, 'GROQ_MODEL', '')
        or os.getenv('GROQ_MODEL', '')
        or 'openai/gpt-oss-20b'
    ).strip().strip('"').strip("'")
    return model or 'openai/gpt-oss-20b'


def _get_gemini_model():
    """Return the configured Gemini model name."""
    model = (
        getattr(settings, 'GEMINI_MODEL', '')
        or os.getenv('GEMINI_MODEL', '')
        or 'gemini-1.5-flash'
    ).strip().strip('"').strip("'")
    return model or 'gemini-1.5-flash'


def _get_gemini_fallback_models():
    """Return a safe list of Gemini models to try if the configured one is unavailable."""
    configured = _get_gemini_model()
    fallback_order = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro',
        'gemini-2.0-flash',
    ]
    deduped = []
    for model in [configured, *fallback_order]:
        if model and model not in deduped:
            deduped.append(model)
    return deduped


def _get_groq_fallback_models():
    """Return a safe list of Groq models to try if the configured one is unavailable."""
    configured = _get_groq_model()
    fallback_order = [
        'openai/gpt-oss-20b',
        'openai/gpt-oss-120b',
        'llama-3.1-8b-instant',
        'meta-llama/llama-4-scout-17b-16e-instruct',
    ]
    deduped = []
    for model in [configured, *fallback_order]:
        if model and model not in deduped:
            deduped.append(model)
    return deduped


def _get_gemini_api_key():
    """Return the configured Gemini API key from Django settings or environment."""
    api_key = (
        getattr(settings, 'GEMINI_API_KEY', '')
        or getattr(settings, 'GOOGLE_API_KEY', '')
        or os.getenv('GEMINI_API_KEY', '')
        or os.getenv('GOOGLE_API_KEY', '')
    )
    api_key = str(api_key or '').strip().strip('"').strip("'")
    if not api_key:
        raise ValueError('GEMINI_API_KEY or GOOGLE_API_KEY not set in settings')
    return api_key


def _groq_generate_text(prompt, model=None):
    """Call the Groq API using an OpenAI-compatible endpoint."""
    api_key = _get_groq_api_key()
    url = 'https://api.groq.com/openai/v1/chat/completions'
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
    }

    model_candidates = [model] if model else []
    if not model_candidates:
        model_candidates = _get_groq_fallback_models()

    last_error = None

    for model_name in model_candidates:
        data = {
            'model': model_name,
            'messages': [
                {
                    'role': 'system',
                    'content': 'You are a friendly school tutor for Ghanaian students. Keep answers clear, simple, and under 200 words.'
                },
                {'role': 'user', 'content': prompt},
            ],
            'temperature': 0.7,
        }

        try:
            response = requests.post(url, headers=headers, json=data, timeout=60)
        except (SSLError, ConnectionError, Timeout, RequestException) as exc:
            last_error = exc
            continue

        if response.status_code == 200:
            result = response.json()
            choices = result.get('choices', [])
            if not choices:
                raise ValueError('Groq returned no choices')
            return (choices[0].get('message', {}) or {}).get('content', '').strip()

        last_error = ValueError(
            f'Groq API request failed with status {response.status_code}: {response.text[:200]}'
        )
        if response.status_code not in (400, 404):
            raise last_error

    if last_error is not None:
        raise last_error
    raise ValueError('Groq API request failed without a usable response')


def _gemini_generate_text_impl(prompt, model=None):
    """Call the Gemini REST API using the official Google endpoint and auth header."""
    api_key = _get_gemini_api_key()
    model_candidates = [model] if model else _get_gemini_fallback_models()
    last_error = None

    for model_name in model_candidates:
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent'
        headers = {
            'x-goog-api-key': api_key,
            'Content-Type': 'application/json',
        }
        data = {
            'contents': [
                {
                    'parts': [
                        {'text': prompt}
                    ]
                }
            ]
        }

        try:
            response = requests.post(url, headers=headers, json=data, timeout=30)
        except (SSLError, ConnectionError, Timeout, RequestException) as exc:
            last_error = exc
            logger.warning('Gemini request failed for model %s: %s', model_name, exc)
            continue

        if response.status_code == 200:
            result = response.json()
            if not result.get('candidates'):
                raise ValueError('Gemini returned no candidates')
            parts = result['candidates'][0].get('content', {}).get('parts', [])
            if not parts:
                raise ValueError('Gemini returned no content parts')
            return parts[0].get('text', '').strip()

        last_error = ValueError(f'Gemini API request failed with status {response.status_code}')
        if response.status_code in (401, 400, 404):
            logger.warning('Gemini model %s unavailable or rejected; trying next candidate.', model_name)
            continue
        if response.status_code == 429:
            raise ValueError('Gemini API rate limit exceeded')
        raise last_error

    if last_error is not None:
        raise last_error
    raise ValueError('Gemini AI service is unavailable')


def _gemini_generate_text(prompt, model=None):
    """Prefer the configured provider, but always fall back to Gemini if Groq fails."""
    provider = _get_ai_provider()

    if provider == 'ollama':
        return _ollama_generate_text(prompt, model=model or _get_ollama_model())

    if provider == 'groq':
        try:
            return _groq_generate_text(prompt, model=model or _get_groq_model())
        except Exception as exc:
            logger.warning('Groq failed, falling back to Gemini: %s', exc)
            return _gemini_generate_text_impl(prompt, model=model or _get_gemini_model())

    if provider == 'gemini':
        return _gemini_generate_text_impl(prompt, model=model or _get_gemini_model())

    # Auto mode: try Ollama first, then Groq, then Gemini.
    try:
        return _ollama_generate_text(prompt, model=model)
    except Exception as exc:
        logger.info('Ollama unavailable, trying Groq: %s', exc)

    try:
        return _groq_generate_text(prompt, model=model)
    except Exception as exc:
        logger.info('Groq unavailable, falling back to Gemini: %s', exc)

    return _gemini_generate_text_impl(prompt, model=model or _get_gemini_model())


def generate_ai_student_report(student, term):
    """
    Uses Gemini to generate a friendly end-of-term report paragraph for parents.

    Returns str (100-150 words) or raises on failure.
    """
    from scores.models import TermResult, SubjectResult
    from students.models import Attendance, Behaviour

    # ── Gather data ───────────────────────────────────────────────────────────
    attendance_pct = 0.0
    try:
        att = Attendance.objects.get(student=student, term=term)
        attendance_pct = float(att.attendance_percentage)
    except Attendance.DoesNotExist:
        pass

    average = 0.0
    try:
        tr = TermResult.objects.get(student=student, term=term)
        average = float(tr.average_score)
    except TermResult.DoesNotExist:
        pass

    subject_results = SubjectResult.objects.filter(
        student=student, term=term
    ).select_related('class_subject__subject').order_by('-total_score')

    best_subject = worst_subject = best_score = worst_score = None
    if subject_results.exists():
        best = subject_results.first()
        worst = subject_results.last()
        best_subject = best.class_subject.subject.name
        best_score = float(best.total_score)
        worst_subject = worst.class_subject.subject.name
        worst_score = float(worst.total_score)

    conduct = attitude = punctuality = 'Good'
    try:
        beh = Behaviour.objects.get(student=student, term=term)
        conduct = beh.get_conduct_display()
        attitude = beh.get_attitude_display()
        punctuality = beh.get_punctuality_display()
    except Behaviour.DoesNotExist:
        pass

    class_name = str(student.current_class) if student.current_class else 'Unknown Class'

    prompt = (
        f"Write a friendly end-of-term school report for parents in Ghana. "
        f"Student: {student.first_name} {student.last_name}, Class: {class_name}. "
        f"Attendance: {attendance_pct:.0f}%. Average score: {average:.1f}%. "
        f"Best subject: {best_subject} ({best_score:.0f}%). "
        f"Needs improvement in: {worst_subject} ({worst_score:.0f}%). "
        f"Behaviour: {conduct} conduct, {attitude} attitude, {punctuality} punctuality. "
        f"Write 2-3 encouraging sentences. Be honest but positive. "
        f"Use simple English. Ghana school context. Maximum 150 words."
    )

    client = _get_gemini_client()
    response = client.models.generate_content(model='gemini-2.0-flash', contents=prompt)
    return response.text.strip()


def generate_lesson_plan(subject, topic, class_level, duration_minutes):
    """
    Uses Gemini to generate a lesson plan following Ghana Education Service format.

    Returns dict with keys: objectives, introduction, main_activities,
                            assessment, homework, resources_needed
    """
    import json

    prompt = (
        f"Create a lesson plan for a Ghana Basic School teacher. "
        f"Subject: {subject}. Topic: {topic}. Class: {class_level}. "
        f"Duration: {duration_minutes} minutes. "
        f"Follow Ghana Education Service format. "
        f"Return ONLY valid JSON with these keys: "
        f"objectives (list of 3), introduction (string, 2 sentences), "
        f"main_activities (list of 4 steps), assessment (string), "
        f"homework (string), resources_needed (list)."
    )

    text = _gemini_generate_text(prompt)

    # Strip markdown code fences if present
    if text.startswith('```'):
        text = text.split('```')[1]
        if text.startswith('json'):
            text = text[4:]

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Return structured fallback if Gemini returns non-JSON
        return {
            'objectives': [f'Understand {topic}', f'Apply {topic} concepts', f'Evaluate {topic}'],
            'introduction': f'Begin with a review of prior knowledge related to {topic}.',
            'main_activities': [
                'Teacher introduces the topic with examples.',
                'Students work in groups on guided practice.',
                'Class discussion and Q&A.',
                'Individual practice exercise.',
            ],
            'assessment': 'Short quiz or oral questions at end of lesson.',
            'homework': f'Complete exercises on {topic} from textbook.',
            'resources_needed': ['Textbook', 'Chalkboard', 'Exercise books'],
            '_note': 'Fallback plan — Gemini response was not valid JSON.',
        }

def generate_ges_academic_calendar(academic_year):
    """Suggest a GES-style academic calendar for admin review before saving."""
    import json

    prompt = (
        f"Prepare a proposed Ghana Education Service (GES) basic-school academic calendar for {academic_year}. "
        "Use the three-term Ghana school structure and typical GES term sequencing, reopening, vacation, "
        "and school-day patterns. Do not claim these are official dates unless certain; mark the result as a "
        "proposal requiring confirmation against the latest GES circular. Return ONLY valid JSON with keys: "
        "academic_year (string), start_date (YYYY-MM-DD), end_date (YYYY-MM-DD), "
        "terms (list of exactly 3 objects with name FIRST/SECOND/THIRD, start_date, end_date, total_days integer), "
        "source_note (string)."
    )
    text = _gemini_generate_text(prompt)
    if text.startswith('```'):
        text = text.split('```')[1]
        if text.startswith('json'):
            text = text[4:]
    try:
        result = json.loads(text.strip())
    except json.JSONDecodeError as exc:
        raise ValueError('AI returned an invalid academic calendar. Please try again.') from exc

    terms = result.get('terms')
    if not isinstance(terms, list) or len(terms) != 3:
        raise ValueError('AI returned an incomplete academic calendar. Please try again.')
    required_names = {'FIRST', 'SECOND', 'THIRD'}
    if {term.get('name') for term in terms} != required_names:
        raise ValueError('AI returned invalid term names. Please try again.')
    return result


def generate_assignment(subject, topic, assignment_type, class_level, num_questions, duration_minutes=None,
                        has_mcq_questions=False, has_short_answer_questions=False):
    """
    Uses AI to generate a complete assignment with questions.

    Returns dict with keys: title, description, instructions, questions
    Each question has: question_text, question_type, points, options (for mcq)
    """
    import json

    is_quiz = assignment_type in ('QUIZ', 'EXAM')
    q_count = max(1, min(int(num_questions), 20))
    mcq_enabled = bool(has_mcq_questions)
    short_enabled = bool(has_short_answer_questions)

    if is_quiz:
        time_note = f"Time limit: {duration_minutes} minutes. " if duration_minutes else ""

        if mcq_enabled and short_enabled and q_count >= 2:
            mcq_count = max(1, q_count // 2)
            short_count = q_count - mcq_count
            question_mix_note = (
                f"Generate exactly {mcq_count} multiple-choice questions and exactly {short_count} short-answer questions. "
                "Mix them in the final list so the quiz is hybrid. "
            )
            question_structure = (
                f'{{ "title": "string", "description": "string (1 sentence)", '
                f'"instructions": "string (2-3 sentences for students)", '
                f'"questions": [ {{ "question_text": "string", "question_type": "mcq", "points": 1, '
                f'"options": [ {{ "option_text": "string", "is_correct": false }} ] }}, '
                f'{{ "question_text": "string", "question_type": "short_answer", "points": 2 }} ] }}. '
            )
        elif mcq_enabled:
            question_mix_note = f"Generate exactly {q_count} multiple-choice questions. "
            question_structure = (
                f'{{ "title": "string", "description": "string (1 sentence)", '
                f'"instructions": "string (2-3 sentences for students)", '
                f'"questions": [ {{ "question_text": "string", "question_type": "mcq", "points": 1, '
                f'"options": [ {{ "option_text": "string", "is_correct": false }} ] }} ] }}. '
            )
        else:
            question_mix_note = f"Generate exactly {q_count} short-answer questions. "
            question_structure = (
                f'{{ "title": "string", "description": "string (1 sentence)", '
                f'"instructions": "string (2-3 sentences for students)", '
                f'"questions": [ {{ "question_text": "string", "question_type": "short_answer", "points": 2 }} ] }}. '
            )

        prompt = (
            f"Create a {assignment_type.lower()} for a Ghana Basic School {class_level} class. "
            f"Subject: {subject}. Topic: {topic}. {time_note}"
            f"{question_mix_note}"
            f"Return ONLY valid JSON with this exact structure: {question_structure} "
            f"Follow Ghana Education Service curriculum. Make questions appropriate for {class_level} level. "
            f"Use Ghana curriculum context. For MCQ, each question must have exactly 4 options with exactly one is_correct=true. "
        )
    else:
        prompt = (
            f"Create a {assignment_type.lower()} assignment for a Ghana Basic School {class_level} class. "
            f"Subject: {subject}. Topic: {topic}. "
            f"Return ONLY valid JSON with this exact structure: "
            f'{{ "title": "string", "description": "string (1-2 sentences)", '
            f'"instructions": "string (3-4 clear sentences telling students exactly what to do)" }}. '
            f"Make it appropriate for {class_level} level. Use Ghana curriculum context."
        )

    text = _gemini_generate_text(prompt)

    if text.startswith('```'):
        text = text.split('```')[1]
        if text.startswith('json'):
            text = text[4:]

    try:
        result = json.loads(text.strip())
    except json.JSONDecodeError:
        result = {
            'title': f'{subject} - {topic} ({assignment_type.title()})',
            'description': f'{assignment_type.title()} on {topic} for {class_level}.',
            'instructions': f'Complete this {assignment_type.lower()} on {topic}. Follow all instructions carefully.',
            'questions': [],
            '_fallback': True,
        }

    if is_quiz and isinstance(result.get('questions'), list):
        result['questions'] = [
            {
                'question_text': question.get('question_text', ''),
                'question_type': question.get('question_type', 'mcq'),
                'points': question.get('points', 1),
                'options': question.get('options', []),
            }
            for question in result['questions']
        ]

    return result


def generate_questions(subject, topic, class_level, num_questions, question_type='mcq'):
    """
    Uses AI to generate questions only (for adding to an existing assignment).

    Returns list of question dicts.
    """
    import json

    q_count = max(1, min(int(num_questions), 20))

    if question_type == 'mcq':
        prompt = (
            f"Generate exactly {q_count} multiple-choice questions for a Ghana Basic School {class_level} class. "
            f"Subject: {subject}. Topic: {topic}. "
            f"Return ONLY a valid JSON array: "
            f'[ {{ "question_text": "string", "question_type": "mcq", "points": 1, '
            f'"options": [ {{ "option_text": "string", "is_correct": false }} ] }} ]. '
            f"Each question must have exactly 4 options with exactly one is_correct=true. "
            f"Follow Ghana Education Service curriculum."
        )
    else:
        prompt = (
            f"Generate exactly {q_count} short-answer questions for a Ghana Basic School {class_level} class. "
            f"Subject: {subject}. Topic: {topic}. "
            f"Return ONLY a valid JSON array: "
            f'[ {{ "question_text": "string", "question_type": "short_answer", "points": 2 }} ]. '
            f"Follow Ghana Education Service curriculum."
        )

    text = _gemini_generate_text(prompt)

    if text.startswith('```'):
        text = text.split('```')[1]
        if text.startswith('json'):
            text = text[4:]

    try:
        result = json.loads(text.strip())
        if not isinstance(result, list):
            raise ValueError('Expected array')
        return result
    except (json.JSONDecodeError, ValueError):
        return []


def generate_class_insights(class_obj, term):
    """
    Uses Gemini to analyse class performance and give teaching recommendations.

    Returns str with teaching strategy recommendations.
    """
    from scores.models import SubjectResult, TermResult
    from students.models import Attendance
    from django.db.models import Avg

    # ── Aggregate class data ──────────────────────────────────────────────────
    students = class_obj.students.filter(is_active=True)
    total = students.count()
    if total == 0:
        return 'No active students in this class.'

    avg_score = TermResult.objects.filter(
        term=term, class_instance=class_obj
    ).aggregate(avg=Avg('average_score'))['avg'] or 0

    avg_attendance = 0.0
    att_records = Attendance.objects.filter(
        student__in=students, term=term
    )
    if att_records.exists():
        total_pct = sum(float(a.attendance_percentage) for a in att_records)
        avg_attendance = total_pct / att_records.count()

    # Subjects with lowest average scores
    subject_avgs = (
        SubjectResult.objects.filter(
            student__in=students, term=term
        )
        .values('class_subject__subject__name')
        .annotate(avg=Avg('total_score'))
        .order_by('avg')[:3]
    )
    weak_subjects = [f"{s['class_subject__subject__name']} ({s['avg']:.1f}%)" for s in subject_avgs]

    from scores.models import StudentRiskProfile  # noqa — may not exist yet
    at_risk_count = 0
    try:
        from core.models import StudentRiskProfile as SRP
        at_risk_count = SRP.objects.filter(
            student__in=students, term=term, risk_level__in=['HIGH', 'MEDIUM']
        ).count()
    except Exception:
        pass

    prompt = (
        f"You are an educational advisor for a Ghana Basic School. "
        f"Class: {class_obj}. Term: {term}. Total students: {total}. "
        f"Class average score: {avg_score:.1f}%. "
        f"Average attendance: {avg_attendance:.1f}%. "
        f"Subjects needing most attention: {', '.join(weak_subjects) or 'None identified'}. "
        f"Students at risk: {at_risk_count}. "
        f"Give 3-4 specific, practical teaching recommendations for this class. "
        f"Keep it concise and actionable. Ghana school context."
    )

    client = _get_gemini_client()
    response = client.models.generate_content(model='gemini-2.0-flash', contents=prompt)
    return response.text.strip()
