from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import Notification, SupportTicket, PushSubscription, SmsLog
from .serializers import NotificationSerializer, SupportTicketSerializer, SmsLogSerializer
from django.db.models import Q
from .email_service import EmailService
from django.conf import settings

User = get_user_model()

class SupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        ticket = serializer.save(user=self.request.user)
        # Send email to superadmin
        try:
            superadmins = User.objects.filter(role='SUPERADMIN')
            for superadmin in superadmins:
                EmailService.send_support_ticket_notification(superadmin, ticket)
        except Exception as e:
            pass  # Continue even if email fails
        return ticket

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'SCHOOL_ADMIN':
            return Notification.objects.filter(
                Q(user=user) | Q(user__school=user.school)
            ).distinct()
        else:
            return Notification.objects.filter(user=user)
    
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
                       class_id=None, assignment_id=None):
    return Notification.objects.create(
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
    """Save a browser push subscription for the current user."""
    endpoint = request.data.get('endpoint')
    p256dh = request.data.get('p256dh')
    auth = request.data.get('auth')
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
    """Read-only list/detail for SMS dispatch logs scoped to the user's school."""
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
            qs = qs.filter(sms_type=sms_type)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

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
        
        # Pre-flight checks
        if not dry_run:
            api_key = SmsService._get_api_key(school)
            if not api_key:
                return Response(
                    {'error': 'SMS API key not configured.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            sms_balance = getattr(school, 'sms_balance', 0)
            if sms_balance < len(recipients):
                return Response(
                    {'error': f'Insufficient SMS credits. Available: {sms_balance}, Required: {len(recipients)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Send SMS
        sent = 0
        failed = 0
        details = []
        
        for recipient in recipients:
            phone = recipient.get('phone', '').strip()
            name = recipient.get('name', 'Recipient').strip()
            
            if not phone:
                details.append({'name': name, 'phone': phone, 'status': 'failed', 'reason': 'No phone number'})
                failed += 1
                continue
            
            detail_record = {'name': name, 'phone': phone}
            
            if dry_run:
                detail_record['status'] = 'would_send'
                details.append(detail_record)
                sent += 1
            else:
                success = SmsService.send([phone], message, school)
                if success:
                    detail_record['status'] = 'sent'
                    details.append(detail_record)
                    sent += 1
                else:
                    detail_record['status'] = 'failed'
                    detail_record['reason'] = 'SMS provider error'
                    details.append(detail_record)
                    failed += 1
        
        # Log the SMS batch if not a dry run
        if not dry_run and sent > 0:
            try:
                SmsLog.objects.create(
                    school=school,
                    sent_by=user,
                    sms_type='general',
                    status='success' if failed == 0 else 'partial',
                    total_recipients=len(recipients),
                    sent_count=sent,
                    failed_count=failed,
                    no_phone_count=0,
                    message_preview=message[:200],
                    filters_used={'type': 'direct_sms'},
                    details=details,
                )
            except Exception as e:
                logger.warning(f'Failed to log SMS batch: {e}')
        
        # Update SMS balance if not dry run
        if not dry_run and sent > 0:
            try:
                school.sms_balance = max(0, getattr(school, 'sms_balance', 0) - sent)
                school.save(update_fields=['sms_balance'])
            except Exception as e:
                logger.warning(f'Failed to update SMS balance: {e}')
        
        return Response({
            'dry_run': dry_run,
            'sent': sent,
            'failed': failed,
            'total': len(recipients),
            'details': details,
            'sms_balance_remaining': getattr(school, 'sms_balance', 0) - sent if not dry_run else getattr(school, 'sms_balance', 0)
        })