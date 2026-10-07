from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import Notification, SupportTicket, PushSubscription, SmsLog
from .serializers import NotificationSerializer, SupportTicketSerializer, SmsLogSerializer
from .email_service import EmailService
from django.conf import settings
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class SupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', '') == 'SUPERADMIN':
            qs = SupportTicket.objects.all().select_related('user', 'replied_by')
            status_filter = self.request.query_params.get('status')
            priority_filter = self.request.query_params.get('priority')
            search = self.request.query_params.get('search')
            if status_filter:
                qs = qs.filter(status=status_filter)
            if priority_filter:
                qs = qs.filter(priority=priority_filter)
            if search:
                qs = qs.filter(
                    Q(subject__icontains=search) |
                    Q(message__icontains=search) |
                    Q(school_name__icontains=search) |
                    Q(user__email__icontains=search)
                )
            return qs
        return SupportTicket.objects.filter(user=user)

    def perform_create(self, serializer):
        user = self.request.user
        school_name = ''
        if hasattr(user, 'school') and user.school:
            school_name = user.school.name
        ticket = serializer.save(user=user, school_name=school_name)
        try:
            superadmins = User.objects.filter(role='SUPERADMIN')
            for superadmin in superadmins:
                EmailService.send_support_ticket_notification(superadmin, ticket)
        except Exception:
            pass
        return ticket

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        if getattr(request.user, 'role', '') != 'SUPERADMIN':
            return Response({'error': 'Only superadmin can reply'}, status=status.HTTP_403_FORBIDDEN)
        ticket = self.get_object()
        reply_text = request.data.get('reply', '').strip()
        new_status = request.data.get('status', ticket.status)
        if not reply_text:
            return Response({'error': 'Reply text is required'}, status=status.HTTP_400_BAD_REQUEST)
        from django.utils import timezone
        ticket.admin_reply = reply_text
        ticket.replied_at = timezone.now()
        ticket.replied_by = request.user
        ticket.status = new_status
        ticket.save()
        try:
            EmailService.send_support_reply_notification(ticket)
        except Exception:
            pass
        return Response(SupportTicketSerializer(ticket).data)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        if getattr(request.user, 'role', '') != 'SUPERADMIN':
            return Response({'error': 'Only superadmin can update status'}, status=status.HTTP_403_FORBIDDEN)
        ticket = self.get_object()
        new_status = request.data.get('status')
        new_priority = request.data.get('priority')
        valid_statuses = [s[0] for s in SupportTicket.STATUS_CHOICES]
        valid_priorities = [p[0] for p in SupportTicket.PRIORITY_CHOICES]
        if new_status and new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        if new_priority and new_priority not in valid_priorities:
            return Response({'error': 'Invalid priority'}, status=status.HTTP_400_BAD_REQUEST)
        if new_status:
            ticket.status = new_status
        if new_priority:
            ticket.priority = new_priority
        ticket.save()
        return Response(SupportTicketSerializer(ticket).data)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(read=False).count()
        return Response({'count': count})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        updated = self.get_queryset().filter(read=False).update(read=True)
        return Response({'updated': updated})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.read = True
        notification.save()
        return Response({'status': 'marked as read'})


def create_notification(user, title, message, notification_type='general',
                       activity_type='', class_name='', teacher_name='',
                       class_id=None, assignment_id=None, url='/'):
    notif = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        type=notification_type,
        activity_type=activity_type,
        class_name=class_name,
        teacher_name=teacher_name,
        class_id=class_id,
        assignment_id=assignment_id
    )
    # Fire web push (best-effort — never crash the caller)
    try:
        from .push_service import send_push_to_user
        send_push_to_user(user, title, message, url=url)
    except Exception:
        pass
    return notif


def notify_admins_attendance_taken(school, teacher, class_obj, date):
    admins = User.objects.filter(school=school, role='SCHOOL_ADMIN')
    for admin in admins:
        create_notification(
            user=admin,
            title=f"Attendance Taken - {class_obj.name}",
            message=f"{teacher.get_full_name()} took attendance for {class_obj.name} on {date.strftime('%B %d, %Y')}",
            notification_type='attendance',
            activity_type='attendance_taken',
            class_name=class_obj.name,
            teacher_name=teacher.get_full_name(),
            class_id=class_obj.id
        )


def notify_admins_assignment_created(school, teacher, assignment, class_obj):
    admins = User.objects.filter(school=school, role='SCHOOL_ADMIN')
    for admin in admins:
        create_notification(
            user=admin,
            title=f"New Assignment - {assignment.title}",
            message=f"{teacher.get_full_name()} created '{assignment.title}' for {class_obj.name}",
            notification_type='assignment',
            activity_type='assignment_created',
            class_name=class_obj.name,
            teacher_name=teacher.get_full_name(),
            class_id=class_obj.id,
            assignment_id=assignment.id
        )


def notify_admins_fee_set(school, admin_user, fee_type, amount, class_obj=None):
    admins = User.objects.filter(school=school, role='SCHOOL_ADMIN').exclude(id=admin_user.id)
    class_info = f" for {class_obj.name}" if class_obj else ""
    for admin in admins:
        create_notification(
            user=admin,
            title=f"Fee Set - {fee_type}",
            message=f"{admin_user.get_full_name()} set {fee_type} fee to ${amount}{class_info}",
            notification_type='fee',
            activity_type='fee_set',
            class_name=class_obj.name if class_obj else '',
            teacher_name=admin_user.get_full_name(),
            class_id=class_obj.id if class_obj else None
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def announcements_list(request):
    """Get announcements for students"""
    try:
        notifications = Notification.objects.filter(
            user=request.user,
            type__in=['announcement', 'info', 'warning']
        ).order_by('-created_at')[:10]
        
        announcements = [{
            'id': notif.id,
            'title': notif.title,
            'content': notif.message,
            'created_at': notif.created_at.isoformat(),
            'priority': 'high' if notif.type == 'error' else 'medium',
            'read': notif.read
        } for notif in notifications]
        
        return Response(announcements)
    except Exception as e:
        return Response([], status=200)  # Return empty list instead of error


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def push_subscribe(request):
    """Save a browser or mobile push registration for the current user."""
    endpoint = request.data.get('endpoint')
    p256dh = request.data.get('p256dh')
    auth = request.data.get('auth')
    device_token = request.data.get('device_token')
    platform = request.data.get('platform', 'android')

    if device_token:
        from .models import MobileDeviceToken
        if not platform:
            return Response({'error': 'platform is required for mobile push registration'}, status=status.HTTP_400_BAD_REQUEST)

        obj, created = MobileDeviceToken.objects.update_or_create(
            user=request.user,
            platform=platform,
            device_token=device_token,
            defaults={
                'endpoint': endpoint or '',
                'p256dh': p256dh or '',
                'auth': auth or '',
            },
        )
        return Response({
            'status': 'subscribed',
            'platform': obj.platform,
            'device_token': obj.device_token,
            'created': created,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    if not endpoint or not p256dh or not auth:
        return Response({'error': 'endpoint, p256dh and auth are required'}, status=status.HTTP_400_BAD_REQUEST)

    PushSubscription.objects.update_or_create(
        endpoint=endpoint,
        defaults={'user': request.user, 'p256dh': p256dh, 'auth': auth},
    )
    return Response({'status': 'subscribed'}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def push_unsubscribe(request):
    """Remove a push subscription for the current user."""
    endpoint = request.data.get('endpoint')
    if not endpoint:
        return Response({'error': 'endpoint is required'}, status=status.HTTP_400_BAD_REQUEST)
    deleted, _ = PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
    return Response({'status': 'unsubscribed', 'deleted': deleted})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vapid_public_key(request):
    """Return the VAPID public key so the frontend can subscribe."""
    key = getattr(settings, 'VAPID_PUBLIC_KEY', '')
    return Response({'vapidPublicKey': key})


class SmsLogViewSet(viewsets.ReadOnlyModelViewSet):
    """SMS dispatch history and retry actions scoped to the user's school."""
    serializer_class = SmsLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'role', '')
        if role not in ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'):
            return SmsLog.objects.none()
        if not getattr(user, 'school', None):
            return SmsLog.objects.none()
        qs = SmsLog.objects.filter(school=user.school)
        sms_type = self.request.query_params.get('type')
        if sms_type:
            sms_types = [value.strip() for value in sms_type.split(',') if value.strip()]
            qs = qs.filter(sms_type__in=sms_types)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    @action(detail=True, methods=['post'], url_path='resend-failed')
    def resend_failed(self, request, pk=None):
        from django.db import transaction
        from notifications.sms_service import SmsService

        if getattr(request.user, 'role', '') not in ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'):
            return Response(
                {'error': 'Only school admins can resend SMS.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        with transaction.atomic():
            sms_log = self.get_queryset().select_for_update().filter(pk=pk).first()
            if not sms_log:
                return Response({'error': 'SMS history record not found.'}, status=status.HTTP_404_NOT_FOUND)
            if sms_log.sms_type != 'general' or sms_log.filters_used.get('type') != 'direct_sms':
                return Response(
                    {'error': 'Only direct SMS messages can be resent from history.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            resend_message = sms_log.message_body
            if not resend_message and 0 < len(sms_log.message_preview) < 200:
                resend_message = sms_log.message_preview
            if not resend_message:
                return Response(
                    {'error': 'The original message text is unavailable for this older SMS record.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            details = list(sms_log.details or [])
            failed_indices = [
                index for index, detail in enumerate(details)
                if isinstance(detail, dict) and detail.get('status') == 'failed'
            ]
            if not failed_indices:
                return Response(
                    {'error': 'There are no failed recipients to resend.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            school = request.user.school
            if not getattr(school, 'sms_enabled', False):
                return Response(
                    {'error': 'SMS is not enabled for this school.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not SmsService._get_api_key(school):
                return Response(
                    {'error': 'SMS API key not configured.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            retry_recipients = [
                details[index] for index in failed_indices
                if str(details[index].get('phone') or details[index].get('guardian_phone') or '').strip()
            ]
            if not retry_recipients:
                return Response(
                    {'error': 'The failed records do not contain recipient phone numbers.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if getattr(school, 'sms_balance', 0) < len(retry_recipients):
                return Response(
                    {
                        'error': (
                            f'Insufficient SMS credits. Available: {school.sms_balance}, '
                            f'Required: {len(retry_recipients)}.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            for index in failed_indices:
                details[index] = {**details[index], 'status': 'pending', 'reason': 'Retry in progress'}
            sms_log.details = details
            sms_log.status = 'pending'
            sms_log.save(update_fields=['details', 'status'])

        sent = 0
        failed = 0
        for index in failed_indices:
            detail = details[index]
            phone = str(detail.get('phone') or detail.get('guardian_phone') or '').strip()
            if not phone:
                detail.update(status='failed', reason='No phone number')
                failed += 1
            else:
                try:
                    accepted = SmsService.send([phone], resend_message, request.user.school)
                except Exception:
                    logger.exception(
                        'Unexpected error resending direct SMS log %s to recipient index %s.',
                        sms_log.pk,
                        index,
                    )
                    accepted = False

                if accepted:
                    detail.update(status='sent')
                    detail.pop('reason', None)
                    sent += 1
                else:
                    detail.update(status='failed', reason='SMS provider error')
                    failed += 1

            sms_log.details = details
            sms_log.sent_count = sum(
                1 for item in details
                if isinstance(item, dict) and item.get('status') == 'sent'
            )
            sms_log.failed_count = sum(
                1 for item in details
                if isinstance(item, dict) and item.get('status') == 'failed'
            )
            sms_log.save(update_fields=['details', 'sent_count', 'failed_count'])

        sms_log.status = (
            'failed' if sms_log.sent_count == 0
            else 'partial' if sms_log.failed_count > 0
            else 'success'
        )
        sms_log.save(update_fields=['status'])
        request.user.school.refresh_from_db(fields=['sms_balance'])

        return Response({
            'sent': sent,
            'failed': failed,
            'total': len(failed_indices),
            'sms_balance_remaining': request.user.school.sms_balance,
            'log': SmsLogSerializer(sms_log).data,
        })

    @action(detail=False, methods=['post'])
    def send_direct_sms(self, request):
        """
        Send SMS directly to specified phone numbers.
        
        Body:
          {
            "recipients": [
              {"phone": "0551234567", "name": "John Doe"},
              ...
            ],
            "message": "SMS message text",
            "dry_run": false
          }
        
        Returns: { sent: N, failed: N, details: [...] }
        """
        from notifications.sms_service import SmsService
        import logging
        
        logger = logging.getLogger(__name__)
        
        user = request.user
        role = getattr(user, 'role', '')
        if role not in ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'):
            return Response(
                {'error': 'Only admins can send SMS.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        school = getattr(user, 'school', None)
        if not school:
            return Response(
                {'error': 'User must be affiliated with a school.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not getattr(school, 'sms_enabled', False):
            return Response(
                {'error': 'SMS is not enabled for this school.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        recipients = request.data.get('recipients', [])
        message = request.data.get('message', '').strip()
        dry_run = request.data.get('dry_run', False)
        
        if not recipients or not isinstance(recipients, list):
            return Response(
                {'error': 'recipients must be a non-empty array'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not message or len(message) == 0:
            return Response(
                {'error': 'message is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        phone_recipients = [
            recipient for recipient in recipients
            if isinstance(recipient, dict) and str(recipient.get('phone', '')).strip()
        ]

        # Pre-flight checks
        if not dry_run:
            api_key = SmsService._get_api_key(school)
            if not api_key:
                return Response(
                    {'error': 'SMS API key not configured.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            sms_balance = getattr(school, 'sms_balance', 0)
            if sms_balance < len(phone_recipients):
                return Response(
                    {'error': f'Insufficient SMS credits. Available: {sms_balance}, Required: {len(phone_recipients)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        details = []
        for recipient in recipients:
            if not isinstance(recipient, dict):
                details.append({
                    'name': 'Recipient',
                    'phone': '',
                    'status': 'failed',
                    'reason': 'Invalid recipient data',
                })
                continue
            phone = str(recipient.get('phone') or '').strip()
            name = str(recipient.get('name') or 'Recipient').strip()
            if not phone:
                details.append({'name': name, 'phone': phone, 'status': 'failed', 'reason': 'No phone number'})
            else:
                details.append({'name': name, 'phone': phone, 'status': 'pending'})

        no_phone = sum(
            1 for detail in details if detail.get('reason') == 'No phone number'
        )
        failed = no_phone + sum(
            1 for detail in details if detail.get('reason') == 'Invalid recipient data'
        )
        sent = 0
        sms_log = None

        if not dry_run:
            try:
                sms_log = SmsLog.objects.create(
                    school=school,
                    sent_by=user,
                    sms_type='general',
                    status='pending',
                    total_recipients=len(recipients),
                    sent_count=0,
                    failed_count=failed,
                    no_phone_count=no_phone,
                    message_preview=message[:200],
                    message_body=message,
                    filters_used={'type': 'direct_sms'},
                    details=details,
                )
            except Exception as e:
                logger.exception('Failed to create SMS history record before dispatch.')
                return Response(
                    {'error': 'Could not record the SMS send in history, so no messages were sent.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        for index, detail_record in enumerate(details):
            if detail_record['status'] != 'pending':
                continue

            if dry_run:
                detail_record['status'] = 'would_send'
                sent += 1
            else:
                try:
                    success = SmsService.send([detail_record['phone']], message, school)
                except Exception:
                    logger.exception(
                        'Unexpected error sending direct SMS to recipient %s in log %s.',
                        index,
                        sms_log.pk,
                    )
                    success = False

                if success:
                    detail_record['status'] = 'sent'
                    sent += 1
                else:
                    detail_record['status'] = 'failed'
                    detail_record['reason'] = 'SMS provider error'
                    failed += 1

            if sms_log:
                sms_log.sent_count = sent
                sms_log.failed_count = failed
                sms_log.details = details
                sms_log.save(update_fields=['sent_count', 'failed_count', 'details'])

        if sms_log:
            sms_log.status = 'failed' if sent == 0 else 'success' if failed == 0 else 'partial'
            sms_log.save(update_fields=['status'])

        # SmsService.send deducts credits for each accepted recipient; refresh only.
        if not dry_run:
            try:
                school.refresh_from_db(fields=['sms_balance'])
            except Exception as e:
                logger.warning(f'Failed to refresh SMS balance after direct send: {e}')
        
        return Response({
            'dry_run': dry_run,
            'sent': sent,
            'failed': failed,
            'total': len(recipients),
            'details': details,
            'sms_balance_remaining': getattr(school, 'sms_balance', 0)
        })