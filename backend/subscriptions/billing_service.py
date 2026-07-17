"""
Automated Billing Service
Handles billing cycles, payment processing, and dunning management
"""

from django.utils import timezone
from django.db import transaction
from datetime import date, timedelta
from decimal import Decimal
import logging
from typing import List, Dict, Optional

from .billing_models import BillingCycle, Invoice, PaymentFailure, DunningProcess, RefundRequest
from .models import Subscription, Payment
from schools.models import School
from accounts.models import User

logger = logging.getLogger(__name__)


class BillingService:
    """Core billing service for automated payment processing"""
    
    @staticmethod
    def create_billing_cycle(school: School, subscription: Subscription, cycle_type: str = 'MONTHLY') -> BillingCycle:
        """Create a new billing cycle for a school"""
        
        # Calculate amount based on subscription plan
        if cycle_type == 'MONTHLY':
            amount = subscription.plan.price
            next_billing = date.today() + timedelta(days=30)
        elif cycle_type == 'QUARTERLY':
            amount = subscription.plan.price * 3 * Decimal('0.95')  # 5% discount
            next_billing = date.today() + timedelta(days=90)
        elif cycle_type == 'YEARLY':
            amount = subscription.plan.price * 12 * Decimal('0.85')  # 15% discount
            next_billing = date.today() + timedelta(days=365)
        else:
            amount = subscription.plan.price
            next_billing = date.today() + timedelta(days=30)
        
        billing_cycle = BillingCycle.objects.create(
            school=school,
            subscription=subscription,
            cycle_type=cycle_type,
            amount=amount,
            next_billing_date=next_billing,
            billing_day=date.today().day
        )
        
        logger.info(f"Created billing cycle for {school.name}: {cycle_type} - GH₵{amount}")
        return billing_cycle
    
    @staticmethod
    def process_due_billings() -> Dict[str, int]:
        """Process all billing cycles that are due today"""
        
        today = date.today()
        due_cycles = BillingCycle.objects.filter(
            next_billing_date__lte=today,
            status='ACTIVE'
        )
        
        results = {
            'processed': 0,
            'failed': 0,
            'invoices_created': 0,
            'errors': []
        }
        
        for cycle in due_cycles:
            try:
                with transaction.atomic():
                    # Create invoice
                    invoice = BillingService.create_invoice(cycle)
                    results['invoices_created'] += 1
                    
                    # Attempt payment processing
                    payment_success = BillingService.process_payment(invoice)
                    
                    if payment_success:
                        # Update billing cycle for next period
                        cycle.last_billing_date = today
                        cycle.next_billing_date = cycle.calculate_next_billing_date()
                        cycle.save()
                        results['processed'] += 1
                        
                        logger.info(f"Successfully processed billing for {cycle.school.name}")
                    else:
                        results['failed'] += 1
                        logger.warning(f"Payment failed for {cycle.school.name}")
                        
            except Exception as e:
                results['failed'] += 1
                results['errors'].append(f"{cycle.school.name}: {str(e)}")
                logger.error(f"Billing processing error for {cycle.school.name}: {e}")
        
        return results
    
    @staticmethod
    def create_invoice(billing_cycle: BillingCycle) -> Invoice:
        """Create an invoice for a billing cycle"""
        
        # Calculate tax (15% VAT for Ghana)
        tax_rate = Decimal('0.15')
        tax_amount = billing_cycle.amount * tax_rate
        total_amount = billing_cycle.amount + tax_amount
        
        # Set due date (30 days from issue)
        due_date = date.today() + timedelta(days=30)
        
        invoice = Invoice.objects.create(
            school=billing_cycle.school,
            billing_cycle=billing_cycle,
            amount=billing_cycle.amount,
            tax_amount=tax_amount,
            total_amount=total_amount,
            due_date=due_date,
            status='SENT',
            description=f"{billing_cycle.cycle_type} subscription for {billing_cycle.subscription.plan.name}"
        )
        
        # Send invoice notification
        BillingService.send_invoice_notification(invoice)
        
        logger.info(f"Created invoice {invoice.invoice_number} for {billing_cycle.school.name}")
        return invoice
    
    @staticmethod
    def process_payment(invoice: Invoice) -> bool:
        """Process payment for an invoice"""
        
        try:
            # Simulate payment processing (integrate with actual payment gateway)
            payment_result = BillingService.simulate_payment_gateway(invoice)
            
            if payment_result['success']:
                # Mark invoice as paid
                invoice.mark_as_paid(
                    payment_method=payment_result['method'],
                    transaction_ref=payment_result['reference']
                )
                
                # Create payment record
                Payment.objects.create(
                    school=invoice.school,
                    subscription=invoice.billing_cycle.subscription,
                    amount=invoice.total_amount,
                    payment_method='MOBILE_MONEY',  # Default for Ghana
                    status='COMPLETED',
                    transaction_id=payment_result['reference'],
                    payment_date=timezone.now()
                )
                
                return True
            else:
                # Handle payment failure
                BillingService.handle_payment_failure(invoice, payment_result)
                return False
                
        except Exception as e:
            logger.error(f"Payment processing error for invoice {invoice.invoice_number}: {e}")
            BillingService.handle_payment_failure(invoice, {
                'error': str(e),
                'reason': 'NETWORK_ERROR'
            })
            return False
    
    @staticmethod
    def simulate_payment_gateway(invoice: Invoice) -> Dict:
        """Simulate payment gateway response (replace with actual integration)"""
        
        # Simulate 85% success rate
        import random
        success = random.random() < 0.85
        
        if success:
            return {
                'success': True,
                'method': 'MOBILE_MONEY',
                'reference': f"TXN_{invoice.id}_{timezone.now().strftime('%Y%m%d%H%M%S')}",
                'amount': float(invoice.total_amount)
            }
        else:
            failure_reasons = ['INSUFFICIENT_FUNDS', 'CARD_DECLINED', 'NETWORK_ERROR']
            return {
                'success': False,
                'error': 'Payment failed',
                'reason': random.choice(failure_reasons)
            }
    
    @staticmethod
    def handle_payment_failure(invoice: Invoice, failure_data: Dict):
        """Handle payment failure and create failure record"""
        
        failure = PaymentFailure.objects.create(
            invoice=invoice,
            school=invoice.school,
            failure_reason=failure_data.get('reason', 'OTHER'),
            failure_message=failure_data.get('error', 'Payment processing failed'),
            amount_attempted=invoice.total_amount
        )
        
        # Schedule retry in 24 hours
        failure.schedule_retry(hours_delay=24)
        
        # Update invoice status
        invoice.status = 'OVERDUE'
        invoice.save()
        
        logger.warning(f"Payment failure recorded for {invoice.school.name}: {failure.failure_reason}")
    
    @staticmethod
    def retry_failed_payments() -> Dict[str, int]:
        """Retry failed payments that are due for retry"""
        
        now = timezone.now()
        retry_failures = PaymentFailure.objects.filter(
            next_retry_date__lte=now,
            resolved=False
        ).filter(retry_count__lt=models.F('max_retries'))
        
        results = {'retried': 0, 'succeeded': 0, 'failed': 0}
        
        for failure in retry_failures:
            failure.retry_count += 1
            
            # Attempt payment again
            success = BillingService.process_payment(failure.invoice)
            
            if success:
                failure.resolved = True
                failure.resolved_at = now
                results['succeeded'] += 1
            else:
                # Schedule next retry if attempts remaining
                if failure.can_retry():
                    failure.schedule_retry(hours_delay=48)  # Longer delay for retries
                results['failed'] += 1
            
            failure.save()
            results['retried'] += 1
        
        return results
    
    @staticmethod
    def process_dunning() -> Dict[str, int]:
        """Process dunning for overdue invoices"""
        
        today = date.today()
        overdue_invoices = Invoice.objects.filter(
            due_date__lt=today,
            status='OVERDUE'
        )
        
        results = {'processed': 0, 'suspended': 0, 'contacted': 0}
        
        for invoice in overdue_invoices:
            days_overdue = (today - invoice.due_date).days
            
            # Get or create dunning process
            dunning, created = DunningProcess.objects.get_or_create(
                invoice=invoice,
                school=invoice.school,
                defaults={
                    'days_overdue': days_overdue,
                    'next_action_date': today
                }
            )
            
            if not created:
                dunning.days_overdue = days_overdue
            
            # Process based on days overdue
            if days_overdue >= 30 and dunning.current_stage != 'SUSPENDED':
                # Suspend account after 30 days
                BillingService.suspend_school_for_non_payment(invoice.school)
                dunning.current_stage = 'SUSPENDED'
                results['suspended'] += 1
            elif days_overdue >= 21 and dunning.current_stage not in ['SUSPENSION_WARNING', 'SUSPENDED']:
                # Final warning at 21 days
                BillingService.send_suspension_warning(invoice.school, invoice)
                dunning.current_stage = 'SUSPENSION_WARNING'
                results['contacted'] += 1
            elif days_overdue >= 14 and dunning.current_stage == 'REMINDER_1':
                # Second reminder at 14 days
                BillingService.send_payment_reminder(invoice.school, invoice, reminder_type='FINAL')
                dunning.current_stage = 'REMINDER_2'
                results['contacted'] += 1
            elif days_overdue >= 7 and dunning.current_stage not in ['REMINDER_1', 'REMINDER_2', 'FINAL_NOTICE', 'SUSPENSION_WARNING', 'SUSPENDED']:
                # First reminder at 7 days
                BillingService.send_payment_reminder(invoice.school, invoice, reminder_type='FIRST')
                dunning.current_stage = 'REMINDER_1'
                results['contacted'] += 1
            
            dunning.save()
            results['processed'] += 1
        
        return results
    
    @staticmethod
    def suspend_school_for_non_payment(school: School):
        """Suspend school access due to non-payment"""
        
        # Update subscription status
        active_subscriptions = school.subscriptions.filter(status='ACTIVE')
        active_subscriptions.update(status='SUSPENDED')
        
        # Disable school access
        school.is_active = False
        school.save()
        
        # Notify school administrators
        BillingService.send_suspension_notification(school)
        
        logger.warning(f"Suspended school {school.name} for non-payment")
    
    @staticmethod
    def send_invoice_notification(invoice: Invoice):
        """Send invoice notification to school"""
        # Implement email/SMS notification
        pass
    
    @staticmethod
    def send_payment_reminder(school: School, invoice: Invoice, reminder_type: str):
        """Send payment reminder to school"""
        # Implement reminder notification
        pass
    
    @staticmethod
    def send_suspension_warning(school: School, invoice: Invoice):
        """Send suspension warning to school"""
        # Implement suspension warning notification
        pass
    
    @staticmethod
    def send_suspension_notification(school: School):
        """Send suspension notification to school"""
        # Implement suspension notification
        pass


class RefundService:
    """Service for handling refunds"""
    
    @staticmethod
    def create_refund_request(invoice: Invoice, amount: Decimal, reason: str, description: str, requested_by: User) -> RefundRequest:
        """Create a new refund request"""
        
        refund = RefundRequest.objects.create(
            invoice=invoice,
            school=invoice.school,
            refund_amount=amount,
            reason=reason,
            description=description,
            requested_by=requested_by
        )
        
        logger.info(f"Refund request created: {refund.refund_id} for {invoice.school.name}")
        return refund
    
    @staticmethod
    def approve_refund(refund: RefundRequest, approved_by: User) -> bool:
        """Approve a refund request"""
        
        try:
            refund.status = 'APPROVED'
            refund.approved_by = approved_by
            refund.save()
            
            # Process refund (integrate with payment gateway)
            success = RefundService.process_refund(refund)
            
            if success:
                refund.status = 'COMPLETED'
                refund.processed_date = timezone.now()
                refund.save()
                
                # Update original invoice
                if refund.refund_amount >= refund.invoice.total_amount:
                    refund.invoice.status = 'REFUNDED'
                    refund.invoice.save()
            
            return success
            
        except Exception as e:
            logger.error(f"Refund approval error for {refund.refund_id}: {e}")
            return False
    
    @staticmethod
    def process_refund(refund: RefundRequest) -> bool:
        """Process the actual refund (integrate with payment gateway)"""
        
        # Simulate refund processing
        import random
        success = random.random() < 0.95  # 95% success rate for refunds
        
        if success:
            refund.refund_reference = f"REF_{refund.id}_{timezone.now().strftime('%Y%m%d%H%M%S')}"
            return True
        
        return False