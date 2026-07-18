from django.db import models
from django.utils import timezone
from datetime import timedelta


class SystemMetric(models.Model):
    """System performance metrics tracking"""
    
    METRIC_TYPES = [
        ('CPU_USAGE', 'CPU Usage'),
        ('MEMORY_USAGE', 'Memory Usage'),
        ('DISK_USAGE', 'Disk Usage'),
        ('DATABASE_CONNECTIONS', 'Database Connections'),
        ('ACTIVE_SESSIONS', 'Active User Sessions'),
        ('API_RESPONSE_TIME', 'API Response Time'),
        ('ERROR_RATE', 'Error Rate'),
        ('UPTIME', 'System Uptime'),
    ]
    
    metric_type = models.CharField(max_length=30, choices=METRIC_TYPES)
    value = models.FloatField()
    unit = models.CharField(max_length=20, default='%')
    threshold_warning = models.FloatField(null=True, blank=True)
    threshold_critical = models.FloatField(null=True, blank=True)
    
    server_name = models.CharField(max_length=100, default='main')
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'system_metrics'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.metric_type}: {self.value}{self.unit}"


class SystemAlert(models.Model):
    """System alerts and notifications"""
    
    ALERT_TYPES = [
        ('PERFORMANCE', 'Performance Issue'),
        ('ERROR', 'System Error'),
        ('SECURITY', 'Security Alert'),
        ('CAPACITY', 'Capacity Warning'),
        ('DOWNTIME', 'System Downtime'),
        ('DATABASE', 'Database Issue'),
    ]
    
    SEVERITY_LEVELS = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('ACKNOWLEDGED', 'Acknowledged'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]
    
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    severity = models.CharField(max_length=10, choices=SEVERITY_LEVELS)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='OPEN')
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    server_name = models.CharField(max_length=100, default='main')
    
    acknowledged_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_alerts'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.severity} {self.alert_type}: {self.title}"


class ErrorLog(models.Model):
    """System error logging"""
    
    ERROR_LEVELS = [
        ('DEBUG', 'Debug'),
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
    ]
    
    level = models.CharField(max_length=10, choices=ERROR_LEVELS)
    message = models.TextField()
    exception_type = models.CharField(max_length=255, blank=True)
    stack_trace = models.TextField(blank=True)
    
    url = models.URLField(blank=True)
    method = models.CharField(max_length=10, blank=True)
    user_id = models.IntegerField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'error_logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.level}: {self.message[:100]}"


class SystemSettings(models.Model):
    """Singleton platform-wide operational settings (non-secret)."""

    # General
    platform_name = models.CharField(max_length=100, default='SmartGES')
    support_email = models.EmailField(default='support@smartges.com')
    max_schools = models.PositiveIntegerField(default=500)
    registration_open = models.BooleanField(default=True)
    maintenance_mode = models.BooleanField(default=False)

    # Notifications
    email_notifications = models.BooleanField(default=True)
    sms_alerts = models.BooleanField(default=False)

    # Security
    two_factor_required = models.BooleanField(default=False)
    allow_password_reset = models.BooleanField(default=True)
    password_min_length = models.PositiveSmallIntegerField(default=8)
    session_timeout_minutes = models.PositiveIntegerField(default=60)
    audit_logging = models.BooleanField(default=True)
    api_rate_limit = models.PositiveIntegerField(default=1000)

    # System
    db_backup_enabled = models.BooleanField(default=True)
    db_backup_interval_hours = models.PositiveIntegerField(default=24)
    max_file_upload_mb = models.PositiveIntegerField(default=10)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'system_settings'

    def __str__(self):
        return 'System Settings'

    @classmethod
    def get(cls):
        """Always returns the single settings row, creating it if needed."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class SystemHealth(models.Model):
    """Overall system health status"""
    
    HEALTH_STATUS = [
        ('HEALTHY', 'Healthy'),
        ('WARNING', 'Warning'),
        ('CRITICAL', 'Critical'),
        ('DOWN', 'Down'),
    ]
    
    status = models.CharField(max_length=10, choices=HEALTH_STATUS, default='HEALTHY')
    database_status = models.CharField(max_length=10, choices=HEALTH_STATUS, default='HEALTHY')
    api_status = models.CharField(max_length=10, choices=HEALTH_STATUS, default='HEALTHY')
    storage_status = models.CharField(max_length=10, choices=HEALTH_STATUS, default='HEALTHY')
    
    uptime_percentage = models.FloatField(default=100.0)
    avg_response_time = models.FloatField(default=0)
    error_rate = models.FloatField(default=0)
    
    active_users = models.IntegerField(default=0)
    total_requests_today = models.IntegerField(default=0)
    failed_requests_today = models.IntegerField(default=0)
    
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_health'
    
    def __str__(self):
        return f"System Health: {self.status}"