from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import ParentStudent
from notifications.models import MobileDeviceToken
from schools.models import School
from students.models import Student


class MobileParentAndPushApiTests(TestCase):
    def setUp(self):
        self.User = get_user_model()
        self.school = School.objects.create(
            name='Mobile School',
            address='Test address',
            location='Test location',
            phone_number='0200000000',
            email='mobile-school@example.edu',
        )

        self.parent = self.User.objects.create_user(
            email='parent@example.edu',
            password='parent-pass',
            first_name='Parent',
            last_name='User',
            role='PARENT',
            school=self.school,
        )

        self.student_user = self.User.objects.create_user(
            email='student@example.edu',
            password='student-pass',
            first_name='Student',
            last_name='User',
            role='STUDENT',
            school=self.school,
        )

        self.student = Student.objects.create(
            school=self.school,
            user=self.student_user,
            student_id='STU-1001',
            first_name='Student',
            last_name='User',
            gender='F',
            date_of_birth='2015-01-01',
            guardian_name='Guardian User',
            guardian_phone='0200000000',
            guardian_address='Test address',
            admission_date='2024-01-01',
        )

        ParentStudent.objects.create(
            parent=self.parent,
            student=self.student,
            relationship='Mother',
            is_primary_guardian=True,
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.parent)

    def test_parent_can_access_child_profile_via_student_id(self):
        response = self.client.get('/api/students/profile/', {'student_id': self.student.student_id})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['student_id'], self.student.student_id)
        self.assertEqual(response.data['full_name'], self.student.get_full_name())

    def test_parent_can_access_child_assignments_via_student_id(self):
        response = self.client.get('/api/students/assignments/', {'student_id': self.student.student_id})

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)

    def test_mobile_push_registration_accepts_device_token(self):
        response = self.client.post(
            '/api/notifications/push/subscribe/',
            {
                'endpoint': 'https://fcm.googleapis.com/fcm/send/test-endpoint',
                'p256dh': 'test-p256dh',
                'auth': 'test-auth',
                'platform': 'android',
                'device_token': 'sample-device-token',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            MobileDeviceToken.objects.filter(
                user=self.parent,
                device_token='sample-device-token',
                platform='android',
            ).exists()
        )

    def test_deleting_student_portal_account_cascades_mobile_tokens(self):
        admin = self.User.objects.create_user(
            email='school-admin@example.edu',
            password='admin-pass',
            first_name='School',
            last_name='Admin',
            role='SCHOOL_ADMIN',
            school=self.school,
        )
        token = MobileDeviceToken.objects.create(
            user=self.student_user,
            platform='android',
            device_token='student-device-token',
        )
        admin_client = APIClient()
        admin_client.force_authenticate(user=admin)

        response = admin_client.delete(
            f'/api/students/{self.student.id}/delete-account/'
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(MobileDeviceToken.objects.filter(pk=token.pk).exists())
        self.student.refresh_from_db()
        self.assertIsNone(self.student.user_id)
