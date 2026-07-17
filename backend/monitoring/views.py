"""
System Health Monitoring Views for Superadmin
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Avg, Count, Sum, Max
from datetime import datetime, timedelta
import logging
try:
    import psutil
except ImportError:
    psutil = None

from accounts.permissions import IsSuperAdmin
from .models import SystemMetric, SystemAlert, ErrorLog, SystemHealth
from accounts.models import User

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def system_health_dashboard(request):
    """System health dashboard with real-time metrics"""
    
    # Get current system metrics
    current_metrics = collect_system_metrics()
    
    # Get system health status
    health = SystemHealth.objects.first()
    if not health:
        health = SystemHealth.objects.create()
    
    # Update health metrics
    update_system_health(health)
    
    # Get recent alerts
    recent_alerts = SystemAlert.objects.filter(
        created_at__gte=timezone.now() - timedelta(hours=24)
    ).order_by('-created_at')[:10]
    
    # Get error statistics
    today = timezone.now().date()
    error_stats = ErrorLog.objects.filter(created_at__date=today).values('level').annotate(
        count=Count('id')
    )
    
    # Performance metrics (last hour)
    hour_ago = timezone.now() - timedelta(hours=1)
    recent_metrics = SystemMetric.objects.filter(
        timestamp__gte=hour_ago
    ).values('metric_type').annotate(
        avg_value=Avg('value'),
        latest_value=Max('value')
    )
    
    return Response({
        'system_health': {
            'overall_status': health.status,
            'database_status': health.database_status,
            'api_status': health.api_status,
            'storage_status': health.storage_status,
            'uptime_percentage': health.uptime_percentage,
            'avg_response_time': health.avg_response_time,
            'error_rate': health.error_rate,
            'active_users': health.active_users,
            'last_updated': health.last_updated.isoformat()
        },
        'current_metrics': current_metrics,
        'recent_alerts': [{
            'id': alert.id,
            'type': alert.alert_type,
            'severity': alert.severity,
            'title': alert.title,
            'status': alert.status,
            'created_at': alert.created_at.isoformat()
        } for alert in recent_alerts],
        'error_statistics': {item['level']: item['count'] for item in error_stats},
        'performance_trends': {item['metric_type']: {
            'average': item['avg_value'],
            'current': item['latest_value']
        } for item in recent_metrics}
    })


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def system_metrics(request):
    """Get system metrics with filtering"""
    
    # Get query parameters
    metric_type = request.query_params.get('type')
    hours = int(request.query_params.get('hours', 24))
    
    # Filter metrics
    since = timezone.now() - timedelta(hours=hours)
    metrics = SystemMetric.objects.filter(timestamp__gte=since)
    
    if metric_type:
        metrics = metrics.filter(metric_type=metric_type)
    
    # Group by metric type
    data = {}
    for metric in metrics.order_by('timestamp'):
        if metric.metric_type not in data:
            data[metric.metric_type] = []
        
        data[metric.metric_type].append({
            'timestamp': metric.timestamp.isoformat(),
            'value': metric.value,
            'unit': metric.unit,
            'status': getattr(metric, 'status', 'NORMAL')
        })
    
    return Response({
        'metrics': data,
        'timeframe_hours': hours,
        'total_points': sum(len(points) for points in data.values())
    })


@api_view(['GET', 'POST'])
@permission_classes([IsSuperAdmin])
def system_alerts(request):
    """Manage system alerts"""
    
    if request.method == 'POST':
        action = request.data.get('action')
        alert_id = request.data.get('alert_id')
        
        try:
            alert = SystemAlert.objects.get(id=alert_id)
            
            if action == 'acknowledge':
                alert.status = 'ACKNOWLEDGED'
                alert.acknowledged_by = request.user
                alert.acknowledged_at = timezone.now()
                alert.save()
                return Response({'message': 'Alert acknowledged'})
            
            elif action == 'resolve':
                alert.status = 'RESOLVED'
                alert.resolved_at = timezone.now()
                alert.resolution_notes = request.data.get('notes', '')
                alert.save()
                return Response({'message': 'Alert resolved'})
                
        except SystemAlert.DoesNotExist:
            return Response({'error': 'Alert not found'}, status=404)
    
    # GET - List alerts
    alerts = SystemAlert.objects.all().order_by('-created_at')
    
    # Apply filters
    status_filter = request.query_params.get('status')
    severity_filter = request.query_params.get('severity')
    
    if status_filter:
        alerts = alerts.filter(status=status_filter)
    if severity_filter:
        alerts = alerts.filter(severity=severity_filter)
    
    data = [{
        'id': alert.id,
        'type': alert.alert_type,
        'severity': alert.severity,
        'status': alert.status,
        'title': alert.title,
        'description': alert.description,
        'server_name': alert.server_name,
        'acknowledged_by': alert.acknowledged_by.get_full_name() if alert.acknowledged_by else None,
        'acknowledged_at': alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
        'resolved_at': alert.resolved_at.isoformat() if alert.resolved_at else None,
        'created_at': alert.created_at.isoformat()
    } for alert in alerts[:100]]
    
    return Response({
        'alerts': data,
        'total': alerts.count(),
        'summary': {
            'open': alerts.filter(status='OPEN').count(),
            'critical': alerts.filter(severity='CRITICAL', status='OPEN').count(),
            'acknowledged': alerts.filter(status='ACKNOWLEDGED').count()
        }
    })


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def error_logs(request):
    """Get system error logs"""
    
    logs = ErrorLog.objects.all().order_by('-created_at')
    
    # Apply filters
    level_filter = request.query_params.get('level')
    hours = int(request.query_params.get('hours', 24))
    
    if level_filter:
        logs = logs.filter(level=level_filter)
    
    if hours:
        since = timezone.now() - timedelta(hours=hours)
        logs = logs.filter(created_at__gte=since)
    
    data = [{
        'id': log.id,
        'level': log.level,
        'message': log.message,
        'exception_type': log.exception_type,
        'url': log.url,
        'method': log.method,
        'user_id': log.user_id,
        'ip_address': log.ip_address,
        'created_at': log.created_at.isoformat()
    } for log in logs[:200]]
    
    # Error statistics
    stats = logs.values('level').annotate(count=Count('id'))
    
    return Response({
        'error_logs': data,
        'total': logs.count(),
        'statistics': {item['level']: item['count'] for item in stats},
        'timeframe_hours': hours
    })


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def trigger_health_check(request):
    """Manually trigger system health check"""
    
    try:
        # Collect current metrics
        metrics = collect_system_metrics()
        
        # Update system health
        health = SystemHealth.objects.first()
        if not health:
            health = SystemHealth.objects.create()
        
        update_system_health(health)
        
        # Check for alerts
        check_system_alerts(metrics)
        
        return Response({
            'message': 'Health check completed',
            'status': health.status,
            'metrics': metrics,
            'timestamp': timezone.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return Response({'error': str(e)}, status=500)


def collect_system_metrics():
    """Collect current system metrics"""
    
    try:
        if psutil is None:
            cpu_percent = memory_percent = disk_percent = 0.0
        else:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
        
        # Active users (last 30 minutes)
        active_users = User.objects.filter(
            last_login__gte=timezone.now() - timedelta(minutes=30)
        ).count()
        
        metrics = {
            'cpu_usage': cpu_percent,
            'memory_usage': memory_percent,
            'disk_usage': disk_percent,
            'active_users': active_users,
            'timestamp': timezone.now().isoformat()
        }
        
        # Store metrics in database
        SystemMetric.objects.create(
            metric_type='CPU_USAGE',
            value=cpu_percent,
            unit='%',
            threshold_warning=70,
            threshold_critical=90
        )
        
        SystemMetric.objects.create(
            metric_type='MEMORY_USAGE',
            value=memory_percent,
            unit='%',
            threshold_warning=80,
            threshold_critical=95
        )
        
        SystemMetric.objects.create(
            metric_type='DISK_USAGE',
            value=disk_percent,
            unit='%',
            threshold_warning=80,
            threshold_critical=95
        )
        
        SystemMetric.objects.create(
            metric_type='ACTIVE_SESSIONS',
            value=active_users,
            unit='users'
        )
        
        return metrics
        
    except Exception as e:
        logger.error(f"Failed to collect system metrics: {e}")
        return {
            'error': str(e),
            'timestamp': timezone.now().isoformat()
        }


def update_system_health(health):
    """Update system health status"""
    
    try:
        # Get recent metrics
        hour_ago = timezone.now() - timedelta(hours=1)
        recent_metrics = SystemMetric.objects.filter(timestamp__gte=hour_ago)
        
        # Calculate averages
        cpu_avg = recent_metrics.filter(metric_type='CPU_USAGE').aggregate(
            avg=Avg('value'))['avg'] or 0
        memory_avg = recent_metrics.filter(metric_type='MEMORY_USAGE').aggregate(
            avg=Avg('value'))['avg'] or 0
        
        # Count active users
        health.active_users = User.objects.filter(
            last_login__gte=timezone.now() - timedelta(minutes=30)
        ).count()
        
        # Count today's errors
        today = timezone.now().date()
        error_count = ErrorLog.objects.filter(
            created_at__date=today,
            level__in=['ERROR', 'CRITICAL']
        ).count()
        
        total_logs = ErrorLog.objects.filter(created_at__date=today).count()
        health.error_rate = (error_count / max(total_logs, 1)) * 100
        
        # Determine overall status
        if cpu_avg > 90 or memory_avg > 95 or health.error_rate > 10:
            health.status = 'CRITICAL'
            health.api_status = 'CRITICAL'
        elif cpu_avg > 70 or memory_avg > 80 or health.error_rate > 5:
            health.status = 'WARNING'
            health.api_status = 'WARNING'
        else:
            health.status = 'HEALTHY'
            health.api_status = 'HEALTHY'
        
        # Check database health
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            health.database_status = 'HEALTHY'
        except:
            health.database_status = 'CRITICAL'
            health.status = 'CRITICAL'
        
        health.storage_status = 'HEALTHY'  # Implement storage check if needed
        health.save()
        
    except Exception as e:
        logger.error(f"Failed to update system health: {e}")


def check_system_alerts(metrics):
    """Check for system alerts based on metrics"""
    
    try:
        # Check CPU usage
        if metrics.get('cpu_usage', 0) > 90:
            SystemAlert.objects.get_or_create(
                alert_type='PERFORMANCE',
                title='High CPU Usage',
                defaults={
                    'severity': 'CRITICAL',
                    'description': f"CPU usage is at {metrics['cpu_usage']:.1f}%"
                }
            )
        
        # Check memory usage
        if metrics.get('memory_usage', 0) > 95:
            SystemAlert.objects.get_or_create(
                alert_type='PERFORMANCE',
                title='High Memory Usage',
                defaults={
                    'severity': 'CRITICAL',
                    'description': f"Memory usage is at {metrics['memory_usage']:.1f}%"
                }
            )
        
        # Check disk usage
        if metrics.get('disk_usage', 0) > 95:
            SystemAlert.objects.get_or_create(
                alert_type='CAPACITY',
                title='Low Disk Space',
                defaults={
                    'severity': 'CRITICAL',
                    'description': f"Disk usage is at {metrics['disk_usage']:.1f}%"
                }
            )
            
    except Exception as e:
        logger.error(f"Failed to check system alerts: {e}")