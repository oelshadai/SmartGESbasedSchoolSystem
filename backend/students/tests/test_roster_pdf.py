from types import SimpleNamespace

from django.test import SimpleTestCase

from students.roster_pdf import build_student_roster_pdf


class StudentRosterPdfTests(SimpleTestCase):
    def setUp(self):
        self.school = SimpleNamespace(
            name='Sample School',
            address='1 School Road',
            location='Accra',
            phone_number='0200000000',
            email='school@example.com',
            motto='Learn well',
            logo=None,
        )
        self.student = SimpleNamespace(
            student_id='STU-001',
            get_full_name=lambda: 'Ama Mensah',
            current_class=SimpleNamespace(full_name='Basic 7 A'),
            get_gender_display=lambda: 'Female',
            user_id=None,
            is_active=True,
        )

    def test_builds_valid_pdf_for_student_roster(self):
        pdf = build_student_roster_pdf(self.school, [self.student], 'Basic 7 A', 'all')

        self.assertTrue(pdf.startswith(b'%PDF-'))
        self.assertTrue(pdf.rstrip().endswith(b'%%EOF'))

    def test_builds_valid_pdf_for_empty_filter(self):
        pdf = build_student_roster_pdf(self.school, [], 'Basic 7 A', 'without-account')

        self.assertTrue(pdf.startswith(b'%PDF-'))
        self.assertTrue(pdf.rstrip().endswith(b'%%EOF'))
