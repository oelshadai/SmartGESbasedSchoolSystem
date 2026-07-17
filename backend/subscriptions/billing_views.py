"""
Automated Billing Management Views for Superadmin
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import date, timedelta
import logging

from accounts.permissions import IsSuperAdmin
from .billing_models import BillingCycle, Invoice, PaymentFailure, DunningProcess, RefundRequest
from .billing_service import BillingService, RefundService
from .models import Subscription, Payment
from schools.models import School

logger = logging.getLogger(__name__)


@api_view(['GET', 'POST'])
@permission_classes([IsSuperAdmin])
def billing_dashboard(request):
    """Billing dashboard with key metrics and controls"""
    
    if request.method == 'POST':
        action = request.data.get('action')
        
        if action == 'process_billing':
            # Manually trigger billing processing
            results = BillingService.process_due_billings()
            return Response({
                'message': 'Billing processing completed',
                'results': results
            })
        
        elif action == 'retry_failures':
            # Retry failed payments
            results = BillingService.retry_failed_payments()
            return Response({
                'message': 'Payment retries completed',
                'results': results
            })
        
        elif action == 'process_dunning':
            # Process dunning for overdue accounts
            results = BillingService.process_dunning()
            return Response({
                'message': 'Dunning processing completed',
                'results': results
            })
    
    # GET - Dashboard metrics
    today = date.today()
    this_month = today.replace(day=1)
    last_month = (this_month - timedelta(days=1)).replace(day=1)
    
    # Revenue metrics
    total_revenue = Payment.objects.filter(status='COMPLETED').aggregate(
        total=Sum('amount')
    )['total'] or 0
    
    monthly_revenue = Payment.objects.filter(
        status='COMPLETED',
        payment_date__gte=this_month
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    last_month_revenue = Payment.objects.filter(
        status='COMPLETED',
        payment_date__gte=last_month,
        payment_date__lt=this_month
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Billing metrics
    active_cycles = BillingCycle.objects.filter(status='ACTIVE').count()
    due_today = BillingCycle.objects.filter(
        next_billing_date=today,
        status='ACTIVE'
    ).count()
    
    overdue_invoices = Invoice.objects.filter(
        due_date__lt=today,
        status__in=['SENT', 'OVERDUE']
    ).count()
    
    # Payment failure metrics
    recent_failures = PaymentFailure.objects.filter(
        created_at__gte=today - timedelta(days=7),
        resolved=False
    ).count()
    
    # Dunning metrics
    suspended_schools = School.objects.filter(
        is_active=False,
        subscriptions__status='SUSPENDED'
    ).distinct().count()
    
    return Response({
        'revenue': {
            'total': float(total_revenue),
            'this_month': float(monthly_revenue),
            'last_month': float(last_month_revenue),
            'growth_rate': ((monthly_revenue - last_month_revenue) / max(last_month_revenue, 1)) * 100 if last_month_revenue else 0
        },
        'billing': {
            'active_cycles': active_cycles,
            'due_today': due_today,
            'overdue_invoices': overdue_invoices,
            'recent_failures': recent_failures,
            'suspended_schools': suspended_schools
        },
        'alerts': {
            'high_failure_rate': recent_failures > 10,
            'many_overdue': overdue_invoices > 20,
            'processing_needed': due_today > 0
        }
    })


@api_view(['GET', 'POST'])
@permission_classes([IsSuperAdmin])
def billing_cycles_management(request):
    """Manage billing cycles"""
    
    if request.method == 'POST':
        # Create new billing cycle
        school_id = request.data.get('school_id')
        subscription_id = request.data.get('subscription_id')
        cycle_type = request.data.get('cycle_type', 'MONTHLY')
        
        try:
            school = School.objects.get(id=school_id)
            subscription = Subscription.objects.get(id=subscription_id)
            
            cycle = BillingService.create_billing_cycle(school, subscription, cycle_type)
            
            return Response({
                'id': cycle.id,
                'school': school.name,
                'cycle_type': cycle.cycle_type,
                'amount': float(cycle.amount),
                'next_billing_date': cycle.next_billing_date.isoformat(),
                'status': cycle.status
            }, status=201)
            
        except Exception as e:
            return Response({'error': str(e)}, status=400)
    
    # GET - List billing cycles
    cycles = BillingCycle.objects.select_related('school', 'subscription').order_by('-created_at')
    
    # Apply filters
    status_filter = request.query_params.get('status')
    school_filter = request.query_params.get('school_id')
    
    if status_filter:
        cycles = cycles.filter(status=status_filter)
    if school_filter:
        cycles = cycles.filter(school_id=school_filter)
    
    data = [{
        'id': cycle.id,
        'school_id': cycle.school_id,
        'school_name': cycle.school.name,
        'subscription_plan': cycle.subscription.plan.name,
        'cycle_type': cycle.cycle_type,
        'amount': float(cycle.amount),
        'next_billing_date': cycle.next_billing_date.isoformat(),
        'last_billing_date': cycle.last_billing_date.isoformat() if cycle.last_billing_date else None,
        'status': cycle.status,
        'auto_renew': cycle.auto_renew,
        'created_at': cycle.created_at.isoformat()
    } for cycle in cycles[:100]]
    
    return Response({
        'billing_cycles': data,
        'total': cycles.count()
    })


@api_view(['GET', 'PATCH'])
@permission_classes([IsSuperAdmin])
def billing_cycle_detail(request, cycle_id):
    """Manage individual billing cycle"""
    
    try:
        cycle = BillingCycle.objects.get(id=cycle_id)
    except BillingCycle.DoesNotExist:
        return Response({'error': 'Billing cycle not found'}, status=404)
    
    if request.method == 'PATCH':
        # Update billing cycle
        allowed_fields = ['status', 'auto_renew', 'next_billing_date', 'amount']
        
        for field in allowed_fields:
            if field in request.data:
                setattr(cycle, field, request.data[field])
        
        cycle.save()
        
        return Response({'message': 'Billing cycle updated'})
    
    # GET - Cycle details
    return Response({
        'id': cycle.id,
        'school': {
            'id': cycle.school.id,
            'name': cycle.school.name,
            'email': cycle.school.email
        },
        'subscription': {
            'id': cycle.subscription.id,
            'plan_name': cycle.subscription.plan.name,
            'status': cycle.subscription.status
        },
        'cycle_type': cycle.cycle_type,
        'amount': float(cycle.amount),
        'next_billing_date': cycle.next_billing_date.isoformat(),
        'last_billing_date': cycle.last_billing_date.isoformat() if cycle.last_billing_date else None,
        'status': cycle.status,
        'auto_renew': cycle.auto_renew,
        'grace_period_days': cycle.grace_period_days,
        'created_at': cycle.created_at.isoformat()
    })


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def invoices_management(request):
    """Manage invoices"""
    
    invoices = Invoice.objects.select_related('school', 'billing_cycle').order_by('-created_at')
    
    # Apply filters
    status_filter = request.query_params.get('status')
    school_filter = request.query_params.get('school_id')
    overdue_only = request.query_params.get('overdue_only') == 'true'
    
    if status_filter:
        invoices = invoices.filter(status=status_filter)
    if school_filter:
        invoices = invoices.filter(school_id=school_filter)
    if overdue_only:
        invoices = invoices.filter(due_date__lt=date.today(), status__in=['SENT', 'OVERDUE'])
    
    data = [{
        'id': invoice.id,
        'invoice_number': invoice.invoice_number,
        'school_id': invoice.school_id,
        'school_name': invoice.school.name,
        'amount': float(invoice.amount),
        'tax_amount': float(invoice.tax_amount),
        'total_amount': float(invoice.total_amount),
        'issue_date': invoice.issue_date.isoformat(),
        'due_date': invoice.due_date.isoformat(),
        'paid_date': invoice.paid_date.isoformat() if invoice.paid_date else None,
        'status': invoice.status,
        'days_overdue': (date.today() - invoice.due_date).days if invoice.due_date < date.today() else 0,
        'is_overdue': invoice.is_overdue(),
        'created_at': invoice.created_at.isoformat()
    } for invoice in invoices[:100]]
    
    return Response({
        'invoices': data,
        'total': invoices.count(),
        'summary': {
            'total_outstanding': float(invoices.filter(status__in=['SENT', 'OVERDUE']).aggregate(
                total=Sum('total_amount'))['total'] or 0),
            'overdue_count': invoices.filter(due_date__lt=date.today(), status__in=['SENT', 'OVERDUE']).count(),
            'paid_this_month': invoices.filter(
                paid_date__gte=date.today().replace(day=1),
                status='PAID'
            ).count()
        }
    })


@api_view(['GET', 'PATCH'])
@permission_classes([IsSuperAdmin])
def invoice_detail(request, invoice_id):
    """Manage individual invoice"""
    
    try:
        invoice = Invoice.objects.select_related('school', 'billing_cycle').get(id=invoice_id)
    except Invoice.DoesNotExist:
        return Response({'error': 'Invoice not found'}, status=404)
    
    if request.method == 'PATCH':
        action = request.data.get('action')
        
        if action == 'mark_paid':
            invoice.mark_as_paid(
                payment_method=request.data.get('payment_method', ''),
                transaction_ref=request.data.get('transaction_ref', '')
            )
            return Response({'message': 'Invoice marked as paid'})
        
        elif action == 'cancel':
            invoice.status = 'CANCELLED'
            invoice.save()
            return Response({'message': 'Invoice cancelled'})
        
        elif action == 'resend':
            # Resend invoice notification
            BillingService.send_invoice_notification(invoice)
            return Response({'message': 'Invoice resent'})
    
    # GET - Invoice details
    return Response({
        'id': invoice.id,
        'invoice_number': invoice.invoice_number,
        'school': {
            'id': invoice.school.id,
            'name': invoice.school.name,
            'email': invoice.school.email,
            'phone': getattr(invoice.school, 'phone_number', '')
        },
        'billing_cycle': {
            'id': invoice.billing_cycle.id if invoice.billing_cycle else None,
            'cycle_type': invoice.billing_cycle.cycle_type if invoice.billing_cycle else None
        },
        'amount': float(invoice.amount),
        'tax_amount': float(invoice.tax_amount),
        'total_amount': float(invoice.total_amount),
        'currency': invoice.currency,
        'issue_date': invoice.issue_date.isoformat(),
        'due_date': invoice.due_date.isoformat(),
        'paid_date': invoice.paid_date.isoformat() if invoice.paid_date else None,
        'status': invoice.status,
        'description': invoice.description,
        'notes': invoice.notes,
        'payment_method': invoice.payment_method,
        'transaction_reference': invoice.transaction_reference,
        'is_overdue': invoice.is_overdue(),
        'days_overdue': (date.today() - invoice.due_date).days if invoice.due_date < date.today() else 0,
        'created_at': invoice.created_at.isoformat()
    })


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def payment_failures_management(request):
    """Manage payment failures"""
    
    failures = PaymentFailure.objects.select_related('invoice', 'school').order_by('-created_at')
    
    # Apply filters
    resolved_filter = request.query_params.get('resolved')
    school_filter = request.query_params.get('school_id')
    
    if resolved_filter is not None:
        failures = failures.filter(resolved=resolved_filter.lower() == 'true')
    if school_filter:
        failures = failures.filter(school_id=school_filter)
    
    data = [{
        'id': failure.id,
        'invoice_id': failure.invoice_id,
        'invoice_number': failure.invoice.invoice_number,
        'school_id': failure.school_id,
        'school_name': failure.school.name,
        'failure_reason': failure.failure_reason,
        'failure_message': failure.failure_message,
        'amount_attempted': float(failure.amount_attempted),
        'retry_count': failure.retry_count,
        'max_retries': failure.max_retries,
        'next_retry_date': failure.next_retry_date.isoformat() if failure.next_retry_date else None,
        'can_retry': failure.can_retry(),
        'resolved': failure.resolved,
        'resolved_at': failure.resolved_at.isoformat() if failure.resolved_at else None,
        'created_at': failure.created_at.isoformat()
    } for failure in failures[:100]]
    
    return Response({
        'payment_failures': data,
        'total': failures.count(),
        'summary': {
            'unresolved_count': failures.filter(resolved=False).count(),
            'retry_pending': failures.filter(
                next_retry_date__lte=timezone.now(),
                resolved=False
            ).count()
        }
    })


@api_view(['GET', 'POST'])
@permission_classes([IsSuperAdmin])
def refunds_management(request):
    """Manage refund requests"""
    
    if request.method == 'POST':
        action = request.data.get('action')
        refund_id = request.data.get('refund_id')
        
        try:
            refund = RefundRequest.objects.get(id=refund_id)
            
            if action == 'approve':
                success = RefundService.approve_refund(refund, request.user)
                if success:
                    return Response({'message': 'Refund approved and processed'})
                else:
                    return Response({'error': 'Failed to process refund'}, status=400)
            
            elif action == 'reject':
                refund.status = 'REJECTED'
                refund.save()
                return Response({'message': 'Refund request rejected'})
                
        except RefundRequest.DoesNotExist:
            return Response({'error': 'Refund request not found'}, status=404)
    
    # GET - List refund requests
    refunds = RefundRequest.objects.select_related('invoice', 'school', 'requested_by').order_by('-created_at')
    
    status_filter = request.query_params.get('status')
    if status_filter:
        refunds = refunds.filter(status=status_filter)
    
    data = [{
        'id': refund.id,
        'refund_id': refund.refund_id,
        'invoice_id': refund.invoice_id,
        'invoice_number': refund.invoice.invoice_number,
        'school_id': refund.school_id,
        'school_name': refund.school.name,
        'refund_amount': float(refund.refund_amount),
        'reason': refund.reason,
        'description': refund.description,
        'status': refund.status,
        'requested_by': refund.requested_by.get_full_name() if refund.requested_by else None,
        'approved_by': refund.approved_by.get_full_name() if refund.approved_by else None,
        'processed_date': refund.processed_date.isoformat() if refund.processed_date else None,
        'refund_reference': refund.refund_reference,
        'created_at': refund.created_at.isoformat()
    } for refund in refunds[:100]]
    
    return Response({
        'refund_requests': data,
        'total': refunds.count(),
        'summary': {
            'pending_count': refunds.filter(status='PENDING').count(),
            'total_refunded': float(refunds.filter(status='COMPLETED').aggregate(
                total=Sum('refund_amount'))['total'] or 0)
        }
    })


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def dunning_management(request):
    """Manage dunning processes"""
    
    dunning_processes = DunningProcess.objects.select_related('school', 'invoice').order_by('-created_at')
    
    # Apply filters
    stage_filter = request.query_params.get('stage')
    resolved_filter = request.query_params.get('resolved')
    
    if stage_filter:
        dunning_processes = dunning_processes.filter(current_stage=stage_filter)
    if resolved_filter is not None:
        dunning_processes = dunning_processes.filter(resolved=resolved_filter.lower() == 'true')
    
    data = [{
        'id': process.id,
        'school_id': process.school_id,
        'school_name': process.school.name,
        'invoice_id': process.invoice_id,
        'invoice_number': process.invoice.invoice_number,
        'current_stage': process.current_stage,
        'days_overdue': process.days_overdue,
        'last_contact_date': process.last_contact_date.isoformat() if process.last_contact_date else None,
        'next_action_date': process.next_action_date.isoformat(),
        'email_sent': process.email_sent,
        'sms_sent': process.sms_sent,
        'phone_call_made': process.phone_call_made,
        'resolved': process.resolved,
        'notes': process.notes,
        'created_at': process.created_at.isoformat()
    } for process in dunning_processes[:100]]
    
    return Response({
        'dunning_processes': data,
        'total': dunning_processes.count(),
        'summary': {
            'active_processes': dunning_processes.filter(resolved=False).count(),
            'suspended_accounts': dunning_processes.filter(current_stage='SUSPENDED').count(),
            'final_notices': dunning_processes.filter(current_stage='FINAL_NOTICE').count()
        }
    })