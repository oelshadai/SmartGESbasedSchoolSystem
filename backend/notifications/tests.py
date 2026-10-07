from django.contrib.auth import get_user_model
from django.test import TestCase
from django.db.models import F
from unittest.mock import patch
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

    @patch('notifications.sms_service.SmsService.send')
    def test_direct_sms_history_records_each_recipient_and_failed_reason(self, mock_send):
        self.school.sms_enabled = True
        self.school.sms_balance = 10
        self.school.arkesel_api_key = 'test-api-key'
        self.school.save(update_fields=['sms_enabled', 'sms_balance', 'arkesel_api_key'])

        def send_and_deduct(recipients, message, school):
            accepted = recipients[0].endswith('1111')
            if accepted:
                School.objects.filter(pk=school.pk).update(sms_balance=F('sms_balance') - 1)
            return accepted

        mock_send.side_effect = send_and_deduct

        response = self.client.post(
            '/api/notifications/sms-logs/send_direct_sms/',
            {
                'recipients': [
                    {'phone': '0240001111', 'name': 'Parent One'},
                    {'phone': '0240002222', 'name': 'Parent Two'},
                ],
                'message': 'Test message',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['sent'], 1)
        self.assertEqual(response.data['failed'], 1)
        self.assertEqual(response.data['sms_balance_remaining'], 9)
        self.assertEqual(
            response.data['details'],
            [
                {'name': 'Parent One', 'phone': '0240001111', 'status': 'sent'},
                {
                    'name': 'Parent Two',
                    'phone': '0240002222',
                    'status': 'failed',
                    'reason': 'SMS provider error',
                },
            ],
        )

        log = SmsLog.objects.get(school=self.school, filters_used={'type': 'direct_sms'})
        self.assertEqual(log.status, 'partial')
        self.assertEqual(log.sent_count, 1)
        self.assertEqual(log.failed_count, 1)
        self.assertEqual(log.details, response.data['details'])
        self.school.refresh_from_db()
        self.assertEqual(self.school.sms_balance, 9)

    @patch('notifications.sms_service.SmsService.send', return_value=False)
    def test_direct_sms_history_is_saved_when_all_recipients_fail(self, _mock_send):
        self.school.sms_enabled = True
        self.school.sms_balance = 10
        self.school.arkesel_api_key = 'test-api-key'
        self.school.save(update_fields=['sms_enabled', 'sms_balance', 'arkesel_api_key'])

        response = self.client.post(
            '/api/notifications/sms-logs/send_direct_sms/',
            {
                'recipients': [{'phone': '0240002222', 'name': 'Parent Two'}],
                'message': 'Test message',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['failed'], 1)
        log = SmsLog.objects.get(school=self.school, filters_used={'type': 'direct_sms'})
        self.assertEqual(log.status, 'failed')
        self.assertEqual(log.details[0]['reason'], 'SMS provider error')

    @patch('notifications.sms_service.SmsService.send')
    def test_direct_sms_history_is_created_before_dispatch_and_keeps_partial_results(self, mock_send):
        self.school.sms_enabled = True
        self.school.sms_balance = 10
        self.school.arkesel_api_key = 'test-api-key'
        self.school.save(update_fields=['sms_enabled', 'sms_balance', 'arkesel_api_key'])

        def send_one_recipient(recipients, message, school):
            log = SmsLog.objects.get(school=school, filters_used={'type': 'direct_sms'})
            self.assertEqual(log.status, 'pending')
            if recipients[0].endswith('1111'):
                School.objects.filter(pk=school.pk).update(sms_balance=F('sms_balance') - 1)
                return True
            raise TimeoutError('Provider request timed out')

        mock_send.side_effect = send_one_recipient

        response = self.client.post(
            '/api/notifications/sms-logs/send_direct_sms/',
            {
                'recipients': [
                    {'phone': '0240001111', 'name': 'Parent One'},
                    {'phone': '0240002222', 'name': 'Parent Two'},
                ],
                'message': 'Test message',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        log = SmsLog.objects.get(school=self.school, filters_used={'type': 'direct_sms'})
        self.assertEqual(log.status, 'partial')
        self.assertEqual(log.sent_count, 1)
        self.assertEqual(log.failed_count, 1)
        self.assertEqual([detail['status'] for detail in log.details], ['sent', 'failed'])

    @patch('notifications.sms_service.SmsService.send')
    def test_direct_sms_history_tracks_all_102_recipients(self, mock_send):
        self.school.sms_enabled = True
        self.school.sms_balance = 102
        self.school.arkesel_api_key = 'test-api-key'
        self.school.save(update_fields=['sms_enabled', 'sms_balance', 'arkesel_api_key'])

        def send_and_deduct(recipients, message, school):
            School.objects.filter(pk=school.pk).update(sms_balance=F('sms_balance') - 1)
            return True

        mock_send.side_effect = send_and_deduct
        recipients = [
            {'phone': f'024000{index:04d}', 'name': f'Parent {index}'}
            for index in range(102)
        ]

        response = self.client.post(
            '/api/notifications/sms-logs/send_direct_sms/',
            {'recipients': recipients, 'message': 'Test message'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['sent'], 102)
        self.assertEqual(response.data['failed'], 0)
        self.assertEqual(len(response.data['details']), 102)
        log = SmsLog.objects.get(school=self.school, filters_used={'type': 'direct_sms'})
        self.assertEqual(log.status, 'success')
        self.assertEqual(log.sent_count, 102)
        self.assertEqual(len(log.details), 102)
        self.school.refresh_from_db()
        self.assertEqual(self.school.sms_balance, 0)

    @patch('notifications.sms_service.SmsService.send')
    def test_resend_failed_only_retries_failed_recipients_with_original_message(self, mock_send):
        self.school.sms_enabled = True
        self.school.sms_balance = 2
        self.school.arkesel_api_key = 'test-api-key'
        self.school.save(update_fields=['sms_enabled', 'sms_balance', 'arkesel_api_key'])
        original_message = 'A' * 250
        sms_log = SmsLog.objects.create(
            school=self.school,
            sent_by=self.admin,
            sms_type='general',
            status='partial',
            total_recipients=2,
            sent_count=1,
            failed_count=1,
            message_preview=original_message[:200],
            message_body=original_message,
            filters_used={'type': 'direct_sms'},
            details=[
                {'name': 'Parent One', 'phone': '0240001111', 'status': 'sent'},
                {
                    'name': 'Parent Two',
                    'phone': '0240002222',
                    'status': 'failed',
                    'reason': 'SMS provider error',
                },
            ],
        )
        history_response = self.client.get('/api/notifications/sms-logs/')
        self.assertTrue(history_response.data['results'][0]['can_resend_failed'])
        self.assertNotIn('message_body', history_response.data['results'][0])

        def send_and_deduct(recipients, message, school):
            self.assertEqual(recipients, ['0240002222'])
            self.assertEqual(message, original_message)
            School.objects.filter(pk=school.pk).update(sms_balance=F('sms_balance') - 1)
            return True

        mock_send.side_effect = send_and_deduct

        response = self.client.post(
            f'/api/notifications/sms-logs/{sms_log.id}/resend-failed/',
            {},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['sent'], 1)
        self.assertEqual(response.data['failed'], 0)
        sms_log.refresh_from_db()
        self.assertEqual(sms_log.status, 'success')
        self.assertEqual(sms_log.sent_count, 2)
        self.assertEqual(sms_log.failed_count, 0)
        self.assertEqual([detail['status'] for detail in sms_log.details], ['sent', 'sent'])
        self.school.refresh_from_db()
        self.assertEqual(self.school.sms_balance, 1)

    def test_resend_failed_rejects_logs_from_another_school(self):
        other_school = School.objects.create(
            name='Other SMS History School',
            address='Test address',
            location='Test location',
            phone_number='0200000001',
            email='other-sms-history@example.edu',
        )
        sms_log = SmsLog.objects.create(
            school=other_school,
            sms_type='general',
            status='failed',
            failed_count=1,
            message_body='Test',
            filters_used={'type': 'direct_sms'},
            details=[{'name': 'Parent', 'phone': '0240002222', 'status': 'failed'}],
        )

        response = self.client.post(
            f'/api/notifications/sms-logs/{sms_log.id}/resend-failed/',
            {},
            format='json',
        )

        self.assertEqual(response.status_code, 404)


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
