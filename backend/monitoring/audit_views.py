"""
Audit Logging and Security Views for Superadmin
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Q
from datetime import datetime, timedelta
import logging

from accounts.permissions import IsSuperAdmin
from .audit_models import AuditLog, SecurityEvent, DataExport, ComplianceReport, LoginAttempt

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def audit_dashboard(request):
    """Audit and security dashboard"""
    
    # Time ranges
    today = timezone.now().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    # Audit statistics
    total_logs = AuditLog.objects.count()
    logs_today = AuditLog.objects.filter(created_at__date=today).count()
    logs_this_week = AuditLog.objects.filter(created_at__date__gte=week_ago).count()
    
    # Security events
    security_events = SecurityEvent.objects.filter(created_at__date__gte=week_ago)
    open_security_events = security_events.filter(status='OPEN').count()
    critical_events = security_events.filter(severity='CRITICAL').count()
    
    # Login attempts
    login_attempts = LoginAttempt.objects.filter(created_at__date__gte=week_ago)
    failed_logins = login_attempts.filter(success=False).count()
    blocked_attempts = login_attempts.filter(blocked=True).count()
    
    # High-risk activities
    high_risk_activities = AuditLog.objects.filter(
        created_at__date__gte=week_ago,
        risk_level__in=['HIGH', 'CRITICAL']
    ).count()
    
    # Recent critical events
    recent_critical = list(SecurityEvent.objects.filter(
        severity__in=['HIGH', 'CRITICAL'],
        created_at__gte=timezone.now() - timedelta(hours=24)
    ).values(
        'id', 'event_type', 'severity', 'title', 'created_at', 'status'
    )[:10])
    
    # Activity by action type
    action_stats = AuditLog.objects.filter(
        created_at__date__gte=week_ago
    ).values('action_type').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Top users by activity
    user_stats = AuditLog.objects.filter(
        created_at__date__gte=week_ago,
        user__isnull=False
    ).values('user__email', 'user__role').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    return Response({
        'overview': {
            'total_audit_logs': total_logs,
            'logs_today': logs_today,
            'logs_this_week': logs_this_week,
            'open_security_events': open_security_events,
            'critical_security_events': critical_events,
            'failed_logins_week': failed_logins,
            'blocked_attempts_week': blocked_attempts,
            'high_risk_activities': high_risk_activities
        },
        'recent_critical_events': recent_critical,
        'activity_by_type': list(action_stats),
        'top_active_users': list(user_stats),
        'alerts': {
            'high_failed_logins': failed_logins > 50,
            'critical_events_open': critical_events > 0,
            'high_risk_activity': high_risk_activities > 20
        }
    })


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def audit_logs(request):
    """Get audit logs with filtering"""
    
    logs = AuditLog.objects.select_related('user', 'school').order_by('-created_at')
    
    # Apply filters
    user_id = request.query_params.get('user_id')
    action_type = request.query_params.get('action_type')
    risk_level = request.query_params.get('risk_level')
    school_id = request.query_params.get('school_id')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    search = request.query_params.get('search', '').strip()
    
    if user_id:
        logs = logs.filter(user_id=user_id)
    if action_type:
        logs = logs.filter(action_type=action_type)
    if risk_level:
        logs = logs.filter(risk_level=risk_level)
    if school_id:
        logs = logs.filter(school_id=school_id)
    if date_from:
        logs = logs.filter(created_at__date__gte=date_from)
    if date_to:
        logs = logs.filter(created_at__date__lte=date_to)
    if search:
        logs = logs.filter(
            Q(action_description__icontains=search) |
            Q(user_email__icontains=search) |
            Q(object_repr__icontains=search)
        )
    
    # Pagination
    page_size = min(int(request.query_params.get('page_size', 50)), 200)
    offset = int(request.query_params.get('offset', 0))
    
    total_count = logs.count()
    logs_page = logs[offset:offset + page_size]
    
    data = [{
        'id': log.id,
        'user_email': log.user_email,
        'user_role': log.user_role,
        'action_type': log.action_type,
        'action_description': log.action_description,
        'risk_level': log.risk_level,
        'object_repr': log.object_repr,
        'ip_address': log.ip_address,
        'request_method': log.request_method,
        'request_path': log.request_path,
        'school_name': log.school.name if log.school else None,
        'success': log.success,
        'error_message': log.error_message,
        'created_at': log.created_at.isoformat(),
        'has_changes': bool(log.old_values or log.new_values)
    } for log in logs_page]
    
    return Response({
        'audit_logs': data,
        'total': total_count,
        'offset': offset,
        'page_size': page_size,
        'has_more': offset + page_size < total_count
    })


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def audit_log_detail(request, log_id):
    """Get detailed audit log information"""
    
    try:
        log = AuditLog.objects.select_related('user', 'school').get(id=log_id)
    except AuditLog.DoesNotExist:
        return Response({'error': 'Audit log not found'}, status=404)
    
    return Response({
        'id': log.id,
        'user': {
            'id': log.user.id if log.user else None,
            'email': log.user_email,
            'role': log.user_role,
            'full_name': log.user.get_full_name() if log.user else ''
        },
        'action': {
            'type': log.action_type,
            'description': log.action_description,
            'risk_level': log.risk_level,
            'success': log.success,
            'error_message': log.error_message
        },
        'target_object': {
            'type': log.content_type.model if log.content_type else None,
            'id': log.object_id,
            'representation': log.object_repr
        },
        'request_details': {
            'ip_address': log.ip_address,
            'user_agent': log.user_agent,
            'method': log.request_method,
            'path': log.request_path,
            'session_key': log.session_key
        },
        'data_changes': {
            'old_values': log.old_values,
            'new_values': log.new_values
        },
        'context': {
            'school': {
                'id': log.school.id if log.school else None,
                'name': log.school.name if log.school else None
            },
            'additional_data': log.additional_data
        },
        'timestamp': log.created_at.isoformat()
    })


@api_view(['GET', 'POST'])
@permission_classes([IsSuperAdmin])
def security_events(request):
    """Manage security events"""
    
    if request.method == 'POST':
        action = request.data.get('action')
        event_id = request.data.get('event_id')
        
        try:
            event = SecurityEvent.objects.get(id=event_id)
            
            if action == 'investigate':
                event.status = 'INVESTIGATING'
                event.investigated_by = request.user
                event.save()
                return Response({'message': 'Security event marked as under investigation'})
            
            elif action == 'resolve':
                event.status = 'RESOLVED'
                event.resolved_at = timezone.now()
                event.investigation_notes = request.data.get('notes', '')
                event.save()
                return Response({'message': 'Security event resolved'})
            
            elif action == 'false_positive':
                event.status = 'FALSE_POSITIVE'
                event.investigation_notes = request.data.get('notes', '')
                event.save()
                return Response({'message': 'Security event marked as false positive'})
                
        except SecurityEvent.DoesNotExist:
            return Response({'error': 'Security event not found'}, status=404)
    
    # GET - List security events
    events = SecurityEvent.objects.all().order_by('-created_at')
    
    # Apply filters
    event_type = request.query_params.get('event_type')
    severity = request.query_params.get('severity')
    status = request.query_params.get('status')
    
    if event_type:
        events = events.filter(event_type=event_type)
    if severity:
        events = events.filter(severity=severity)
    if status:
        events = events.filter(status=status)
    
    data = [{
        'id': event.id,
        'event_type': event.event_type,
        'severity': event.severity,
        'status': event.status,
        'title': event.title,
        'description': event.description,
        'source_ip': event.source_ip,
        'user_email': event.user.email if event.user else None,
        'attack_vector': event.attack_vector,
        'blocked': event.blocked,
        'user_suspended': event.user_suspended,
        'ip_banned': event.ip_banned,
        'investigated_by': event.investigated_by.email if event.investigated_by else None,
        'created_at': event.created_at.isoformat(),
        'resolved_at': event.resolved_at.isoformat() if event.resolved_at else None
    } for event in events[:100]]
    
    return Response({
        'security_events': data,
        'total': events.count(),
        'summary': {
            'open': events.filter(status='OPEN').count(),
            'critical': events.filter(severity='CRITICAL', status='OPEN').count(),
            'investigating': events.filter(status='INVESTIGATING').count(),
            'resolved_today': events.filter(
                status='RESOLVED',
                resolved_at__date=timezone.now().date()
            ).count()
        }
    })


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def login_attempts(request):
    """Get login attempt statistics and details"""
    
    attempts = LoginAttempt.objects.all().order_by('-created_at')
    
    # Apply filters
    success_filter = request.query_params.get('success')
    blocked_filter = request.query_params.get('blocked')
    email_filter = request.query_params.get('email')
    ip_filter = request.query_params.get('ip')
    hours = int(request.query_params.get('hours', 24))
    
    if success_filter is not None:
        attempts = attempts.filter(success=success_filter.lower() == 'true')
    if blocked_filter is not None:
        attempts = attempts.filter(blocked=blocked_filter.lower() == 'true')
    if email_filter:
        attempts = attempts.filter(email__icontains=email_filter)
    if ip_filter:
        attempts = attempts.filter(ip_address=ip_filter)
    if hours:
        since = timezone.now() - timedelta(hours=hours)
        attempts = attempts.filter(created_at__gte=since)
    
    # Statistics
    total_attempts = attempts.count()
    failed_attempts = attempts.filter(success=False).count()
    blocked_attempts = attempts.filter(blocked=True).count()
    unique_ips = attempts.values('ip_address').distinct().count()
    
    # Top failed IPs
    failed_by_ip = attempts.filter(success=False).values('ip_address').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Recent attempts
    recent_attempts = [{
        'id': attempt.id,
        'email': attempt.email,
        'ip_address': attempt.ip_address,
        'success': attempt.success,
        'failure_reason': attempt.failure_reason,
        'country': attempt.country,
        'city': attempt.city,
        'risk_score': attempt.risk_score,
        'blocked': attempt.blocked,
        'created_at': attempt.created_at.isoformat()
    } for attempt in attempts[:50]]
    
    return Response({
        'login_attempts': recent_attempts,
        'statistics': {
            'total_attempts': total_attempts,
            'failed_attempts': failed_attempts,
            'blocked_attempts': blocked_attempts,
            'success_rate': ((total_attempts - failed_attempts) / max(total_attempts, 1)) * 100,
            'unique_ips': unique_ips
        },
        'top_failed_ips': list(failed_by_ip),
        'timeframe_hours': hours
    })


@api_view(['GET', 'POST'])
@permission_classes([IsSuperAdmin])
def data_exports(request):
    """Manage data export requests"""
    
    if request.method == 'POST':
        # Create new export request
        export_type = request.data.get('export_type')
        reason = request.data.get('reason', '')
        date_start = request.data.get('date_start')
        date_end = request.data.get('date_end')
        
        export_request = DataExport.objects.create(
            export_type=export_type,
            requested_by=request.user,
            request_reason=reason,
            date_range_start=date_start,
            date_range_end=date_end,
            expires_at=timezone.now() + timedelta(days=7)  # Expire in 7 days
        )
        
        return Response({
            'id': export_request.id,
            'message': 'Export request created',
            'status': export_request.status
        }, status=201)
    
    # GET - List export requests
    exports = DataExport.objects.select_related('requested_by', 'approved_by').order_by('-created_at')
    
    status_filter = request.query_params.get('status')
    if status_filter:
        exports = exports.filter(status=status_filter)
    
    data = [{
        'id': export.id,
        'export_type': export.export_type,
        'status': export.status,
        'requested_by': export.requested_by.email,
        'request_reason': export.request_reason,
        'date_range_start': export.date_range_start.isoformat() if export.date_range_start else None,
        'date_range_end': export.date_range_end.isoformat() if export.date_range_end else None,
        'file_name': export.file_name,
        'file_size': export.file_size,
        'download_count': export.download_count,
        'approved_by': export.approved_by.email if export.approved_by else None,
        'approved_at': export.approved_at.isoformat() if export.approved_at else None,
        'expires_at': export.expires_at.isoformat() if export.expires_at else None,
        'created_at': export.created_at.isoformat(),
        'completed_at': export.completed_at.isoformat() if export.completed_at else None
    } for export in exports[:100]]
    
    return Response({
        'data_exports': data,
        'total': exports.count(),
        'summary': {
            'pending': exports.filter(status='PENDING').count(),
            'processing': exports.filter(status='PROCESSING').count(),
            'completed': exports.filter(status='COMPLETED').count(),
            'failed': exports.filter(status='FAILED').count()
        }
    })


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def compliance_reports(request):
    """Get compliance reports"""
    
    reports = ComplianceReport.objects.select_related('generated_by').order_by('-generated_at')
    
    report_type = request.query_params.get('report_type')
    if report_type:
        reports = reports.filter(report_type=report_type)
    
    data = [{
        'id': report.id,
        'report_type': report.report_type,
        'title': report.title,
        'period_start': report.period_start.isoformat(),
        'period_end': report.period_end.isoformat(),
        'summary': report.summary,
        'compliance_score': report.compliance_score,
        'risk_level': report.risk_level,
        'findings_count': len(report.findings),
        'recommendations_count': len(report.recommendations),
        'generated_by': report.generated_by.email,
        'generated_at': report.generated_at.isoformat(),
        'has_file': bool(report.report_file)
    } for report in reports[:50]]
    
    return Response({
        'compliance_reports': data,
        'total': reports.count()
    })