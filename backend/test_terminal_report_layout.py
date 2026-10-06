import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')

import django

django.setup()

from django.template.loader import render_to_string


def build_context():
    class DummySchool:
        name = 'Test School'
        motto = 'Knowledge Through Excellence'
        address = 'Accra'
        phone_number = '0200000000'
        email = 'info@example.com'
        logo = None
        show_position_in_class = False
        show_attendance = True
        show_behavior_comments = True
        show_promotion_on_terminal = True
        show_headteacher_signature = True
        class_teacher_signature_required = True
        principal_signature = None
        term_closing_date = '2026-09-30'
        term_reopening_date = '2026-10-10'

    class DummyTerm:
        name = 'Third Term'
        academic_year = type('Year', (), {'name': '2025/2026'})()

        def get_name_display(self):
            return 'THIRD TERM'

    class DummyResult:
        class_position = 2
        total_students = 35
        average_score = 78.5
        promoted = True

    class DummySubjectResult:
        def __init__(self, name, ca, exam):
            self.class_subject = type('CS', (), {'subject': type('S', (), {'name': name})()})()
            self.ca_score = ca
            self.exam_score = exam
            self.total_score = ca + exam
            self.grade = 'A'
            self.position = 2

    context = {
        'school': DummySchool(),
        'student': type('Student', (), {'get_full_name': lambda self: 'Jane Doe', 'current_class': 'Basic 7A', 'school': DummySchool()})(),
        'term': DummyTerm(),
        'term_result': DummyResult(),
        'subject_results': [DummySubjectResult(f'Subject {i}', 40 + i, 38 + i) for i in range(1, 8)],
        'attendance': type('Attendance', (), {'days_present': 18, 'total_days': 20})(),
        'behaviour': type(
            'Behaviour',
            (),
            {
                'conduct': 'Very Good',
                'attitude': 'Good',
                'punctuality': 'Excellent',
                'class_teacher_remarks': 'Steady effort throughout the term.',
                'headmaster_remarks': 'Very encouraging performance.'
            }
        )(),
        'class_teacher_name': 'Mr. Mensah',
        'fee_arrears': [],
        'fee_arrears_total': 0,
        'total_marks_ca': 0,
        'total_marks_exam': 0,
        'total_marks_overall': 0,
        'media_url_base': '',
        'score_row_count': 8,
    }
    return context


def test_terminal_report_fills_page_height():
    html = render_to_string('reports/terminal_report.html', build_context())
    assert 'var(--score-row-count)' in html
    assert 'height: 112mm' not in html
    assert 'for i in empty_rows' not in html


if __name__ == '__main__':
    test_terminal_report_fills_page_height()
    print('layout regression check passed')
