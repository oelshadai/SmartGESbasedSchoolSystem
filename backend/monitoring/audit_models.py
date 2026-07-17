from django.db import models
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
import json


class AuditLog(models.Model):
    """Comprehensive audit logging for all user actions"""
    
    ACTION_TYPES = [
        ('CREATE', 'Create'),
        ('READ', 'Read'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('EXPORT', 'Export'),
        ('IMPORT', 'Import'),
        ('APPROVE', 'Approve'),
        ('REJECT', 'Reject'),
        ('SUSPEND', 'Suspend'),
        ('ACTIVATE', 'Activate'),
        ('PAYMENT', 'Payment'),
        ('REFUND', 'Refund'),
    ]
    
    RISK_LEVELS = [
        ('LOW', 'Low Risk'),
        ('MEDIUM', 'Medium Risk'),
        ('HIGH', 'High Risk'),
        ('CRITICAL', 'Critical Risk'),
    ]
    
    # User and session info
    user = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    user_email = models.EmailField(blank=True)  # Store email in case user is deleted
    user_role = models.CharField(max_length=20, blank=True)
    session_key = models.CharField(max_length=40, blank=True)
    
    # Action details
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    action_description = models.TextField()
    risk_level = models.CharField(max_length=10, choices=RISK_LEVELS, default='LOW')
    
    # Target object (what was acted upon)
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    object_repr = models.CharField(max_length=255, blank=True)  # String representation
    
    # Request details
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    request_method = models.CharField(max_length=10, blank=True)
    request_path = models.CharField(max_length=500, blank=True)
    
    # Data changes
    old_values = models.JSONField(default=dict, blank=True)
    new_values = models.JSONField(default=dict, blank=True)
    
    # Additional context
    school = models.ForeignKey('schools.School', on_delete=models.SET_NULL, null=True, blank=True)
    additional_data = models.JSONField(default=dict, blank=True)
    
    # Metadata
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['action_type', 'created_at']),
            models.Index(fields=['risk_level', 'created_at']),
            models.Index(fields=['school', 'created_at']),
            models.Index(fields=['ip_address', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user_email} - {self.action_type} - {self.action_description}"
    
    @classmethod
    def log_action(cls, user, action_type, description, request=None, target_object=None, 
                   old_values=None, new_values=None, risk_level='LOW', additional_data=None):
        """Create an audit log entry"""
        
        # Extract request details
        ip_address = '127.0.0.1'
        user_agent = ''
        method = ''
        path = ''
        
        if request:
            ip_address = cls.get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
            method = request.method
            path = request.path
        
        # Get content type and object details
        content_type = None
        object_id = None
        object_repr = ''
        
        if target_object:
            content_type = ContentType.objects.get_for_model(target_object)
            object_id = target_object.pk
            object_repr = str(target_object)[:255]
        
        # Create audit log
        audit_log = cls.objects.create(
            user=user,
            user_email=user.email if user else '',
            user_role=user.role if user else '',
            session_key=request.session.session_key if request and hasattr(request, 'session') else '',
            action_type=action_type,
            action_description=description,
            risk_level=risk_level,
            content_type=content_type,
            object_id=object_id,
            object_repr=object_repr,
            ip_address=ip_address,
            user_agent=user_agent,
            request_method=method,
            request_path=path,
            old_values=old_values or {},
            new_values=new_values or {},
            school=getattr(user, 'school', None) if user else None,
            additional_data=additional_data or {}
        )
        
        return audit_log
    
    @staticmethod
    def get_client_ip(request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip or '127.0.0.1'


class SecurityEvent(models.Model):
    """Security-related events and incidents"""
    
    EVENT_TYPES = [
        ('FAILED_LOGIN', 'Failed Login Attempt'),
        ('SUSPICIOUS_ACTIVITY', 'Suspicious Activity'),
        ('UNAUTHORIZED_ACCESS', 'Unauthorized Access Attempt'),
        ('DATA_BREACH', 'Potential Data Breach'),
        ('PRIVILEGE_ESCALATION', 'Privilege Escalation Attempt'),
        ('BRUTE_FORCE', 'Brute Force Attack'),
        ('SQL_INJECTION', 'SQL Injection Attempt'),
        ('XSS_ATTEMPT', 'Cross-Site Scripting Attempt'),
        ('CSRF_ATTEMPT', 'CSRF Attack Attempt'),
        ('MALWARE_DETECTED', 'Malware Detected'),
    ]
    
    SEVERITY_LEVELS = [
        ('INFO', 'Informational'),
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('INVESTIGATING', 'Under Investigation'),
        ('RESOLVED', 'Resolved'),
        ('FALSE_POSITIVE', 'False Positive'),
        ('CLOSED', 'Closed'),
    ]
    
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)
    severity = models.CharField(max_length=10, choices=SEVERITY_LEVELS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    # Source information
    source_ip = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    user = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Attack details
    attack_vector = models.CharField(max_length=100, blank=True)
    payload = models.TextField(blank=True)
    
    # Response actions
    blocked = models.BooleanField(default=False)
    user_suspended = models.BooleanField(default=False)
    ip_banned = models.BooleanField(default=False)
    
    # Investigation
    investigated_by = models.ForeignKey(
        'accounts.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='investigated_security_events'
    )
    investigation_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'security_events'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event_type', 'created_at']),
            models.Index(fields=['severity', 'status']),
            models.Index(fields=['source_ip', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.severity} {self.event_type}: {self.title}"


class DataExport(models.Model):
    """Track data exports for compliance"""
    
    EXPORT_TYPES = [
        ('STUDENT_DATA', 'Student Data'),
        ('FINANCIAL_DATA', 'Financial Data'),
        ('USER_DATA', 'User Data'),
        ('AUDIT_LOGS', 'Audit Logs'),
        ('SYSTEM_BACKUP', 'System Backup'),
        ('COMPLIANCE_REPORT', 'Compliance Report'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('EXPIRED', 'Expired'),
    ]
    
    export_type = models.CharField(max_length=30, choices=EXPORT_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Request details
    requested_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    request_reason = models.TextField()
    
    # Export parameters
    date_range_start = models.DateTimeField(null=True, blank=True)
    date_range_end = models.DateTimeField(null=True, blank=True)
    filters = models.JSONField(default=dict, blank=True)
    
    # File details
    file_name = models.CharField(max_length=255, blank=True)
    file_size = models.BigIntegerField(null=True, blank=True)  # Size in bytes
    file_path = models.CharField(max_length=500, blank=True)
    download_count = models.IntegerField(default=0)
    
    # Security
    encryption_key = models.CharField(max_length=255, blank=True)
    access_token = models.CharField(max_length=100, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Approval workflow
    approved_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_exports'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'data_exports'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.export_type} export by {self.requested_by.email}"


class ComplianceReport(models.Model):
    """GDPR and compliance reporting"""
    
    REPORT_TYPES = [
        ('GDPR_AUDIT', 'GDPR Compliance Audit'),
        ('DATA_PROCESSING', 'Data Processing Activities'),
        ('USER_CONSENT', 'User Consent Records'),
        ('DATA_RETENTION', 'Data Retention Report'),
        ('SECURITY_ASSESSMENT', 'Security Assessment'),
        ('BREACH_REPORT', 'Data Breach Report'),
    ]
    
    report_type = models.CharField(max_length=30, choices=REPORT_TYPES)
    title = models.CharField(max_length=255)
    
    # Report period
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    
    # Report content
    summary = models.TextField()
    findings = models.JSONField(default=list)
    recommendations = models.JSONField(default=list)
    
    # Compliance scores
    compliance_score = models.FloatField(null=True, blank=True)  # 0-100
    risk_level = models.CharField(max_length=10, choices=[
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ], default='LOW')
    
    # File attachment
    report_file = models.FileField(upload_to='compliance_reports/', null=True, blank=True)
    
    generated_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    generated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'compliance_reports'
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"{self.report_type}: {self.title}"


class LoginAttempt(models.Model):
    """Track login attempts for security monitoring"""
    
    email = models.EmailField()
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    
    success = models.BooleanField()
    failure_reason = models.CharField(max_length=100, blank=True)
    
    # Geolocation (if available)
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    
    # Risk assessment
    risk_score = models.IntegerField(default=0)  # 0-100
    blocked = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'login_attempts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', 'created_at']),
            models.Index(fields=['ip_address', 'created_at']),
            models.Index(fields=['success', 'created_at']),
        ]
    
    def __str__(self):
        status = "SUCCESS" if self.success else "FAILED"
        return f"{status} login: {self.email} from {self.ip_address}"