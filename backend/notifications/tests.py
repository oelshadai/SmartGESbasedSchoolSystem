from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from notifications.models import Notification, SmsLog
from schools.models import School


class SmsLogFilterTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(
            name='SMS History School',
            address='Test address',
            location='Test location',
            phone_number='0200000000',
            email='sms-history@example.edu',
        )
        self.admin = get_user_model().objects.create_user(
            email='sms-admin@example.edu',
            password='secret123',
            role='SCHOOL_ADMIN',
            school=self.school,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_sms_logs_accept_comma_separated_types(self):
        reminder = SmsLog.objects.create(
            school=self.school,
            sent_by=self.admin,
            sms_type='fee_reminder',
            status='success',
            total_recipients=1,
            sent_count=1,
        )
        general = SmsLog.objects.create(
            school=self.school,
            sent_by=self.admin,
            sms_type='general',
            status='success',
            total_recipients=1,
            sent_count=1,
        )
        SmsLog.objects.create(
            school=self.school,
            sent_by=self.admin,
            sms_type='attendance',
            status='success',
            total_recipients=1,
            sent_count=1,
        )

        response = self.client.get(
            '/api/notifications/sms-logs/',
            {'type': 'fee_reminder,general'},
        )

        self.assertEqual(response.status_code, 200)
        returned_ids = {entry['id'] for entry in response.data['results']}
        self.assertEqual(returned_ids, {reminder.id, general.id})


class NotificationRecipientScopeTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(
            name='Notification Scope School',
            address='Test address',
            location='Test location',
            phone_number='0200000000',
            email='notification-scope@example.edu',
        )
        user_model = get_user_model()
        self.admin = user_model.objects.create_user(
            email='notification-admin@example.edu',
            password='secret123',
            role='SCHOOL_ADMIN',
            school=self.school,
        )
        self.other_admin = user_model.objects.create_user(
            email='other-notification-admin@example.edu',
            password='secret123',
            role='SCHOOL_ADMIN',
            school=self.school,
        )
        self.parent = user_model.objects.create_user(
            email='notification-parent@example.edu',
            password='secret123',
            role='PARENT',
            school=self.school,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_admin_sees_and_marks_read_only_notifications_addressed_to_them(self):
        own_notification = Notification.objects.create(
            user=self.admin,
            title='Attendance Taken',
            message='Attendance was taken for Basic 1.',
            type='attendance',
        )
        other_admin_notification = Notification.objects.create(
            user=self.other_admin,
            title='Attendance Taken',
            message='Attendance was taken for Basic 1.',
            type='attendance',
        )
        parent_notification = Notification.objects.create(
            user=self.parent,
            title='New Assignment',
            message='A new assignment was posted.',
            type='assignment',
        )

        response = self.client.get('/api/notifications/notifications/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {notification['id'] for notification in response.data['results']},
            {own_notification.id},
        )

        mark_read_response = self.client.post(
            '/api/notifications/notifications/mark_all_read/'
        )

        self.assertEqual(mark_read_response.status_code, 200)
        self.assertEqual(mark_read_response.data['updated'], 1)
        own_notification.refresh_from_db()
        other_admin_notification.refresh_from_db()
        parent_notification.refresh_from_db()
        self.assertTrue(own_notification.read)
        self.assertFalse(other_admin_notification.read)
        self.assertFalse(parent_notification.read)
