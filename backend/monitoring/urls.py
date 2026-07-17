from django.urls import path
from .views import (
    system_health_dashboard,
    system_metrics,
    system_alerts,
    error_logs,
    trigger_health_check,
)
from .audit_views import (
    audit_dashboard,
    audit_logs,
    audit_log_detail,
    security_events,
    login_attempts,
)

urlpatterns = [
    # System health
    path('health/', system_health_dashboard, name='system_health'),
    path('metrics/', system_metrics, name='system_metrics'),
    path('alerts/', system_alerts, name='system_alerts'),
    path('errors/', error_logs, name='error_logs'),
    path('health-check/', trigger_health_check, name='trigger_health_check'),

    # Audit & security
    path('audit-dashboard/', audit_dashboard, name='audit_dashboard'),
    path('audit-logs/', audit_logs, name='audit_logs'),
    path('audit-logs/<int:log_id>/', audit_log_detail, name='audit_log_detail'),
    path('security-events/', security_events, name='security_events'),
    path('login-attempts/', login_attempts, name='login_attempts'),
]
