from datetime import date

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from schools.calendar import count_school_days, public_holidays_between
from schools.models import Class, School
from students.promotion_views import _get_next_class


class SmsSettingsPersistenceTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(
            name='SMS Settings School',
            address='Test address',
            location='Test location',
            phone_number='0200000000',
            email='sms-settings@example.edu',
        )
        user_model = get_user_model()
        self.admin = user_model.objects.create_user(
            email='sms-admin@example.edu',
            password='test-password',
            role='SCHOOL_ADMIN',
            school=self.school,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_enabling_sms_persists_and_is_returned_by_settings_endpoint(self):
        response = self.client.patch(
            '/api/schools/sms-settings/',
            {'sms_enabled': True},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['data']['sms_enabled'])

        self.school.refresh_from_db()
        self.assertTrue(self.school.sms_enabled)

        settings_response = self.client.get('/api/schools/sms-settings/')
        self.assertEqual(settings_response.status_code, 200)
        self.assertTrue(settings_response.data['sms_enabled'])


class MyStaffPermissionsTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(
            name='Staff Permissions School',
            address='Test address',
            location='Test location',
            phone_number='0200000000',
            email='staff-permissions@example.edu',
        )
        user_model = get_user_model()
        self.teacher = user_model.objects.create_user(
            email='teacher@example.edu',
            password='test-password',
            role='TEACHER',
            school=self.school,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.teacher)

    def test_missing_permission_returns_null_without_not_found_status(self):
        response = self.client.get('/api/schools/staff-permissions/my-permissions/')

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data)


class SchoolCalendarTests(SimpleTestCase):
    def test_counts_weekdays_and_excludes_confirmed_school_closures(self):
        self.assertEqual(
            count_school_days(
                date(2026, 10, 5),
                date(2026, 10, 11),
                ['2026-10-07'],
            ),
            4,
        )

    def test_returns_ghana_public_holidays_inside_period(self):
        holidays = public_holidays_between(date(2026, 1, 1), date(2026, 1, 7))

        self.assertEqual(
            holidays,
            [
                {'date': '2026-01-01', 'name': "New Year's Day"},
                {'date': '2026-01-07', 'name': 'Constitution Day'},
            ],
        )


class NurseryClassProgressionTests(TestCase):
    def test_nursery_progresses_through_nursery_2_before_kg1(self):
        school = School.objects.create(
            name='Nursery Progression School',
            address='Test address',
            location='Test location',
            phone_number='0200000000',
            email='nursery-progression@example.edu',
        )
        nursery = Class.objects.create(school=school, level='NURSERY', section='A')
        nursery_2 = Class.objects.create(school=school, level='NURSERY_2', section='A')
        kg1 = Class.objects.create(school=school, level='KG1', section='A')

        self.assertEqual(_get_next_class(nursery, school), nursery_2)
        self.assertEqual(_get_next_class(nursery_2, school), kg1)