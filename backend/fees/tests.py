from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from fees.serializers import GenerateWeeklyBillsSerializer
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
