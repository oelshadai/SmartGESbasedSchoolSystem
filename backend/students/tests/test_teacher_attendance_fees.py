from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from fees.models import FeePayment, FeeStructure, FeeType, StudentFeeSubType, StudentFee
from schools.models import Class, School
from students.models import Student


class TeacherAttendanceDailyFeeTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.school = School.objects.create(
            name='Attendance Fee School',
            address='Test address',
            location='Test location',
            phone_number='0200000000',
            email='attendance-fee@example.edu',
        )
        self.teacher = User.objects.create_user(
            email='attendance-teacher@example.edu',
            password='secret123',
            first_name='Class',
            last_name='Teacher',
            role='TEACHER',
            school=self.school,
        )
        self.admin = User.objects.create_user(
            email='attendance-admin@example.edu',
            password='secret123',
            first_name='School',
            last_name='Admin',
            role='SCHOOL_ADMIN',
            school=self.school,
        )
        self.class_room = Class.objects.create(
            school=self.school,
            level='BASIC_1',
            section='A',
            class_teacher=self.teacher,
        )
        self.student = Student(
            school=self.school,
            student_id='STD-ATT-FEE-001',
            first_name='Ama',
            last_name='Mensah',
            gender='F',
            date_of_birth=date(2015, 1, 1),
            current_class=self.class_room,
            guardian_name='Guardian',
            guardian_phone='0201111111',
            guardian_address='Test address',
            admission_date=date(2024, 1, 1),
            user=None,
        )
        self.student._skip_account_creation = True
        self.student.save()
        self.daily_fee = FeeType.objects.create(
            school=self.school,
            name='Daily Meals',
            collection_frequency='DAILY',
            allow_class_teacher_collection=True,
        )
        FeeStructure.objects.create(
            school=self.school,
            fee_type=self.daily_fee,
            level=self.class_room.level,
            amount=Decimal('12.50'),
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.teacher)

    def save_attendance(self, status, collect_daily_fee=False):
        return self.client.post(
            '/api/students/teacher-attendance/save-attendance/',
            {
                'class_id': self.class_room.id,
                'date': date.today().isoformat(),
                'attendance': [{
                    'student_id': self.student.id,
                    'status': status,
                    'collect_daily_fee': collect_daily_fee,
                }],
            },
            format='json',
        )

    def test_present_attendance_without_confirmation_does_not_record_daily_fee(self):
        response = self.client.post(
            '/api/students/teacher-attendance/save-attendance/',
            {
                'class_id': self.class_room.id,
                'date': date.today().isoformat(),
                'attendance': [{'student_id': self.student.id, 'status': 'present'}],
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['daily_fee_count'], 0)
        self.assertFalse(FeePayment.objects.filter(student=self.student, fee_type=self.daily_fee).exists())

    def test_teacher_confirmed_daily_fee_is_recorded_once(self):
        response = self.save_attendance('present', collect_daily_fee=True)

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['daily_fee_count'], 1)
        self.assertEqual(response.data['daily_fee_total'], 12.5)
        payment = FeePayment.objects.get(student=self.student, fee_type=self.daily_fee)
        self.assertEqual(payment.amount_paid, Decimal('12.50'))
        self.assertEqual(payment.attendance_date, date.today())
        self.assertTrue(payment.is_verified)
        self.assertEqual(StudentFee.objects.get(student=self.student).amount_paid, Decimal('12.50'))

        response = self.save_attendance('late', collect_daily_fee=True)

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['daily_fee_count'], 0)
        self.assertEqual(FeePayment.objects.filter(student=self.student, fee_type=self.daily_fee).count(), 1)

    def test_disabled_class_teacher_collection_does_not_auto_record_fee(self):
        self.daily_fee.allow_class_teacher_collection = False
        self.daily_fee.save(update_fields=['allow_class_teacher_collection'])

        response = self.save_attendance('present', collect_daily_fee=True)

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['daily_fee_count'], 0)
        self.assertFalse(FeePayment.objects.filter(student=self.student, fee_type=self.daily_fee).exists())

    def test_assigned_sub_fee_structure_sets_automatic_payment_amount(self):
        sub_fee = FeeType.objects.create(
            school=self.school,
            name='Reduced Daily Meals',
            collection_frequency='DAILY',
            parent_fee_type=self.daily_fee,
        )
        StudentFeeSubType.objects.create(
            student=self.student,
            school=self.school,
            main_fee_type=self.daily_fee,
            sub_fee_type=sub_fee,
        )
        FeeStructure.objects.create(
            school=self.school,
            fee_type=sub_fee,
            level=self.class_room.level,
            amount=Decimal('7.50'),
        )

        response = self.save_attendance('late', collect_daily_fee=True)

        self.assertEqual(response.status_code, 200, response.data)
        payment = FeePayment.objects.get(student=self.student, fee_type=self.daily_fee)
        self.assertEqual(payment.amount_paid, Decimal('7.50'))

    def test_absent_attendance_does_not_record_daily_fee(self):
        response = self.save_attendance('absent', collect_daily_fee=True)

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['daily_fee_count'], 0)
        self.assertFalse(FeePayment.objects.filter(student=self.student, fee_type=self.daily_fee).exists())

    def test_teacher_daily_attendance_is_visible_to_school_admin(self):
        save_response = self.save_attendance('present')
        self.assertEqual(save_response.status_code, 200, save_response.data)

        self.client.force_authenticate(user=self.admin)
        date_query = {'date': date.today().isoformat()}
        daily_response = self.client.get(
            '/api/students/attendance/admin/daily/',
            {**date_query, 'class': 'all'},
        )
        summary_response = self.client.get(
            '/api/students/attendance/admin/class-summary/',
            date_query,
        )
        stats_response = self.client.get(
            '/api/students/attendance/admin/daily-stats/',
            date_query,
        )

        self.assertEqual(daily_response.status_code, 200, daily_response.data)
        self.assertEqual(len(daily_response.data['records']), 1)
        self.assertEqual(daily_response.data['records'][0]['student_id'], self.student.student_id)
        self.assertEqual(daily_response.data['records'][0]['status'], 'present')
        self.assertEqual(summary_response.status_code, 200, summary_response.data)
        self.assertEqual(summary_response.data['summaries'][0]['present'], 1)
        self.assertEqual(stats_response.status_code, 200, stats_response.data)
        self.assertEqual(stats_response.data['stats']['present'], 1)
