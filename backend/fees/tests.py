from decimal import Decimal
from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from fees.models import FeeStructure, FeeType, StudentFeeSubType
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

    def test_daily_payment_uses_main_structure_when_assigned_subtype_has_none(self):
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

        serializer = FeePaymentCreateSerializer(
            data={
                'student': student.id,
                'fee_type': main_fee_type.id,
                'amount_paid': '5.00',
                'payment_method': 'CASH',
            },
            context={'request': SimpleNamespace(user=self.admin)},
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

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
                'fee_type': sub_fee_type.id,
                'amount_paid': '4.00',
                'payment_method': 'CASH',
            },
            context={'request': SimpleNamespace(user=self.admin)},
        )

        self.assertTrue(tiered_serializer.is_valid(), tiered_serializer.errors)
