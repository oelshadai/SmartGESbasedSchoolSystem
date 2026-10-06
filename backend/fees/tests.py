from datetime import date
from decimal import Decimal
from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from fees.models import FeePayment, FeeStructure, FeeType, StudentFee, StudentFeeSubType
from fees.serializers import FeePaymentCreateSerializer, GenerateWeeklyBillsSerializer
from schools.models import School, Class
from students.models import Student


class GenerateWeeklyBillsSerializerTests(TestCase):
    def test_rejects_end_date_before_start_date(self):
        serializer = GenerateWeeklyBillsSerializer(
            data={
                'start_date': '2026-07-10',
                'end_date': '2026-07-05',
                'overwrite': False,
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)


class FeeSearchApiTests(TestCase):
    def setUp(self):
        self.User = get_user_model()
        self.school = School.objects.create(
            name='Fee Search School',
            address='Test address',
            location='Test location',
            phone_number='0200000000',
            email='fee-search@example.edu',
        )
        self.admin = self.User.objects.create_user(
            email='admin@example.edu',
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
        )

    def test_search_class_returns_students_even_when_user_account_is_missing(self):
        student = Student(
            school=self.school,
            student_id='STD-001',
            first_name='Ada',
            last_name='Lovelace',
            gender='F',
            date_of_birth='2012-01-01',
            current_class=self.class_room,
            guardian_name='Guardian',
            guardian_phone='0201111111',
            guardian_address='Test address',
            admission_date='2024-01-01',
            user=None,
        )
        student._skip_account_creation = True
        student.save()

        client = APIClient()
        client.force_authenticate(user=self.admin)
        response = client.get('/api/fees/search/search/', {'class_id': self.class_room.id})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['student_id'], 'STD-001')
        self.assertEqual(response.data[0]['first_name'], 'Ada')
        self.assertEqual(response.data[0]['last_name'], 'Lovelace')

    def test_fee_lists_serialize_students_without_portal_accounts(self):
        student = Student(
            school=self.school,
            student_id='STD-NO-PORTAL-001',
            first_name='Ada',
            last_name='Lovelace',
            gender='F',
            date_of_birth='2012-01-01',
            current_class=self.class_room,
            guardian_name='Guardian',
            guardian_phone='0201111111',
            guardian_address='Test address',
            admission_date='2024-01-01',
            user=None,
        )
        student._skip_account_creation = True
        student.save()
        fee_type = FeeType.objects.create(
            school=self.school,
            name='Tuition',
            collection_frequency='TERM',
        )
        StudentFee.objects.create(
            student=student,
            school=self.school,
            total_amount=Decimal('100.00'),
        )
        FeePayment.objects.create(
            student=student,
            school=self.school,
            fee_type=fee_type,
            amount_paid=Decimal('25.00'),
            collected_by=self.admin,
        )

        client = APIClient()
        client.force_authenticate(user=self.admin)
        student_fees_response = client.get('/api/fees/student-fees/')
        payments_response = client.get('/api/fees/payments/')

        self.assertEqual(student_fees_response.status_code, 200)
        self.assertEqual(payments_response.status_code, 200)
        self.assertEqual(student_fees_response.data['results'][0]['student_name'], 'Ada Lovelace')
        self.assertEqual(payments_response.data['results'][0]['student_name'], 'Ada Lovelace')

    def test_daily_payment_requires_assigned_subtype_structure_instead_of_main_fee_fallback(self):
        student = Student(
            school=self.school,
            student_id='STD-DAILY-001',
            first_name='Grace',
            last_name='Hopper',
            gender='F',
            date_of_birth='2012-01-01',
            current_class=self.class_room,
            guardian_name='Guardian',
            guardian_phone='0201111111',
            guardian_address='Test address',
            admission_date='2024-01-01',
            user=None,
        )
        student._skip_account_creation = True
        student.save()

        main_fee_type = FeeType.objects.create(
            school=self.school,
            name='Daily Meals',
            collection_frequency='DAILY',
        )
        sub_fee_type = FeeType.objects.create(
            school=self.school,
            name='Standard Meal',
            collection_frequency='DAILY',
            parent_fee_type=main_fee_type,
        )
        StudentFeeSubType.objects.create(
            student=student,
            school=self.school,
            main_fee_type=main_fee_type,
            sub_fee_type=sub_fee_type,
        )
        FeeStructure.objects.create(
            school=self.school,
            fee_type=main_fee_type,
            level=self.class_room.level,
            amount=Decimal('5.00'),
            collection_period='MONTH',
        )

        unconfigured_sub_fee_serializer = FeePaymentCreateSerializer(
            data={
                'student': student.id,
                'fee_type': main_fee_type.id,
                'amount_paid': '5.00',
                'payment_method': 'CASH',
            },
            context={'request': SimpleNamespace(user=self.admin)},
        )

        self.assertFalse(unconfigured_sub_fee_serializer.is_valid())
        self.assertIn('amount_paid', unconfigured_sub_fee_serializer.errors)

        FeeStructure.objects.create(
            school=self.school,
            fee_type=sub_fee_type,
            level=self.class_room.level,
            tier_label='Bus',
            amount=Decimal('4.00'),
            collection_period='MONTH',
        )
        tiered_serializer = FeePaymentCreateSerializer(
            data={
                'student': student.id,
                'fee_type': main_fee_type.id,
                'amount_paid': '4.00',
                'payment_method': 'CASH',
            },
            context={'request': SimpleNamespace(user=self.admin)},
        )

        self.assertTrue(tiered_serializer.is_valid(), tiered_serializer.errors)

    def test_daily_expected_income_uses_weekdays_minus_confirmed_closures(self):
        student = Student(
            school=self.school,
            student_id='STD-EXPECTED-001',
            first_name='Katherine',
            last_name='Johnson',
            gender='F',
            date_of_birth='2012-01-01',
            current_class=self.class_room,
            guardian_name='Guardian',
            guardian_phone='0201111111',
            guardian_address='Test address',
            admission_date='2024-01-01',
            user=None,
        )
        student._skip_account_creation = True
        student.save()
        fee_type = FeeType.objects.create(
            school=self.school,
            name='Daily Lunch',
            collection_frequency='DAILY',
        )
        FeeStructure.objects.create(
            school=self.school,
            fee_type=fee_type,
            level=self.class_room.level,
            amount=Decimal('10.00'),
        )
        self.school.term_reopening_date = date(2026, 10, 5)
        self.school.term_closing_date = date(2026, 10, 9)
        self.school.daily_fee_closed_dates = ['2026-10-07']
        self.school.save(update_fields=[
            'term_reopening_date',
            'term_closing_date',
            'daily_fee_closed_dates',
        ])

        client = APIClient()
        client.force_authenticate(user=self.admin)
        response = client.get('/api/fees/reports/collection_summary/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['daily_school_days'], 4)
        self.assertEqual(response.data['daily_expected'], 40.0)

    def test_daily_expected_income_uses_main_fee_for_unassigned_students(self):
        parent_fee = FeeType.objects.create(
            school=self.school,
            name='Daily Transport',
            collection_frequency='DAILY',
        )
        bus_fee = FeeType.objects.create(
            school=self.school,
            name='Bus Users',
            collection_frequency='DAILY',
            parent_fee_type=parent_fee,
        )
        walking_fee = FeeType.objects.create(
            school=self.school,
            name='Walkers',
            collection_frequency='DAILY',
            parent_fee_type=parent_fee,
        )
        FeeStructure.objects.create(
            school=self.school,
            fee_type=parent_fee,
            level=self.class_room.level,
            amount=Decimal('100.00'),
        )
        FeeStructure.objects.create(
            school=self.school,
            fee_type=bus_fee,
            level=self.class_room.level,
            amount=Decimal('10.00'),
        )
        FeeStructure.objects.create(
            school=self.school,
            fee_type=walking_fee,
            level=self.class_room.level,
            amount=Decimal('5.00'),
        )

        students = []
        for student_id in (
            'STD-BUS-001',
            'STD-WALK-001',
            'STD-UNASSIGNED-001',
            'STD-MAIN-ASSIGNED-001',
        ):
            student = Student(
                school=self.school,
                student_id=student_id,
                first_name='Daily',
                last_name='Fee Student',
                gender='F',
                date_of_birth='2012-01-01',
                current_class=self.class_room,
                guardian_name='Guardian',
                guardian_phone='0201111111',
                guardian_address='Test address',
                admission_date='2024-01-01',
                user=None,
            )
            student._skip_account_creation = True
            student.save()
            students.append(student)

        StudentFeeSubType.objects.create(
            student=students[0],
            school=self.school,
            main_fee_type=parent_fee,
            sub_fee_type=bus_fee,
        )
        StudentFeeSubType.objects.create(
            student=students[1],
            school=self.school,
            main_fee_type=parent_fee,
            sub_fee_type=walking_fee,
        )
        StudentFeeSubType.objects.create(
            student=students[3],
            school=self.school,
            main_fee_type=parent_fee,
            sub_fee_type=None,
        )

        self.school.term_reopening_date = date(2026, 10, 5)
        self.school.term_closing_date = date(2026, 10, 9)
        self.school.daily_fee_closed_dates = ['2026-10-07']
        self.school.save(update_fields=[
            'term_reopening_date',
            'term_closing_date',
            'daily_fee_closed_dates',
        ])

        client = APIClient()
        client.force_authenticate(user=self.admin)
        response = client.get('/api/fees/reports/collection_summary/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['daily_school_days'], 4)
        self.assertEqual(response.data['daily_expected'], 860.0)

    def test_parent_fee_structure_applies_when_student_has_no_subtype_assignment(self):
        student = Student(
            school=self.school,
            student_id='STD-MAIN-FEE-001',
            first_name='Dorothy',
            last_name='Vaughan',
            gender='F',
            date_of_birth='2012-01-01',
            current_class=self.class_room,
            guardian_name='Guardian',
            guardian_phone='0201111111',
            guardian_address='Test address',
            admission_date='2024-01-01',
            user=None,
        )
        student._skip_account_creation = True
        student.save()

        main_fee_type = FeeType.objects.create(
            school=self.school,
            name='Daily Transport',
            collection_frequency='DAILY',
        )
        FeeType.objects.create(
            school=self.school,
            name='Bus Tier',
            collection_frequency='DAILY',
            parent_fee_type=main_fee_type,
        )
        FeeStructure.objects.create(
            school=self.school,
            fee_type=main_fee_type,
            level=self.class_room.level,
            amount=Decimal('8.00'),
        )

        serializer = FeePaymentCreateSerializer(
            data={
                'student': student.id,
                'fee_type': main_fee_type.id,
                'amount_paid': '8.00',
                'payment_method': 'CASH',
            },
            context={'request': SimpleNamespace(user=self.admin)},
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_duplicate_fee_structure_returns_validation_error(self):
        fee_type = FeeType.objects.create(school=self.school, name='Existing Fee')
        FeeStructure.objects.create(
            school=self.school,
            fee_type=fee_type,
            level=self.class_room.level,
            amount=Decimal('100.00'),
        )

        client = APIClient()
        client.force_authenticate(user=self.admin)
        response = client.post(
            '/api/fees/structures/',
            {
                'fee_type': fee_type.id,
                'level': self.class_room.level,
                'tier_label': '',
                'amount': '125.00',
                'collection_period': 'TERM',
                'due_date': None,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('tier_label', response.data)

    def test_daily_collection_report_returns_only_daily_payments_for_selected_date(self):
        student = Student(
            school=self.school,
            student_id='STD-DAILY-REPORT-001',
            first_name='Mary',
            last_name='Jackson',
            gender='F',
            date_of_birth='2012-01-01',
            current_class=self.class_room,
            guardian_name='Guardian',
            guardian_phone='0201111111',
            guardian_address='Test address',
            admission_date='2024-01-01',
            user=None,
        )
        student._skip_account_creation = True
        student.save()
        daily_fee = FeeType.objects.create(
            school=self.school,
            name='Daily Meals',
            collection_frequency='DAILY',
        )
        term_fee = FeeType.objects.create(
            school=self.school,
            name='Tuition',
            collection_frequency='TERM',
        )
        FeePayment.objects.create(
            student=student,
            school=self.school,
            fee_type=daily_fee,
            amount_paid=Decimal('12.50'),
            collected_by=self.admin,
        )
        FeePayment.objects.create(
            student=student,
            school=self.school,
            fee_type=term_fee,
            amount_paid=Decimal('100.00'),
            collected_by=self.admin,
        )

        client = APIClient()
        client.force_authenticate(user=self.admin)
        response = client.get('/api/fees/reports/daily_collection/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_collected'], 12.5)
        self.assertEqual(response.data['transaction_count'], 1)
        self.assertEqual(response.data['student_count'], 1)
        self.assertEqual(response.data['payments'][0]['student_id'], 'STD-DAILY-REPORT-001')
