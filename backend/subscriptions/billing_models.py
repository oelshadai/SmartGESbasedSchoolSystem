from django.db import models
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
import uuid


class BillingCycle(models.Model):
    """Automated billing cycle management"""
    
    CYCLE_TYPES = [
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('YEARLY', 'Yearly'),
        ('CUSTOM', 'Custom'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('PAUSED', 'Paused'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='billing_cycles')
    subscription = models.ForeignKey('subscriptions.Subscription', on_delete=models.CASCADE, related_name='billing_cycles')
    cycle_type = models.CharField(max_length=20, choices=CYCLE_TYPES, default='MONTHLY')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='GHS')
    
    next_billing_date = models.DateField()
    last_billing_date = models.DateField(null=True, blank=True)
    billing_day = models.IntegerField(default=1, help_text="Day of month to bill (1-28)")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    auto_renew = models.BooleanField(default=True)
    grace_period_days = models.IntegerField(default=7)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'billing_cycles'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.school.name} - {self.cycle_type} - GH₵{self.amount}"
    
    def calculate_next_billing_date(self):
        """Calculate next billing date based on cycle type"""
        if self.cycle_type == 'MONTHLY':
            return self.next_billing_date + timedelta(days=30)
        elif self.cycle_type == 'QUARTERLY':
            return self.next_billing_date + timedelta(days=90)
        elif self.cycle_type == 'YEARLY':
            return self.next_billing_date + timedelta(days=365)
        return self.next_billing_date + timedelta(days=30)


class Invoice(models.Model):
    """Invoice generation and management"""
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SENT', 'Sent'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
        ('CANCELLED', 'Cancelled'),
        ('REFUNDED', 'Refunded'),
    ]
    
    invoice_number = models.CharField(max_length=50, unique=True)
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='invoices')
    billing_cycle = models.ForeignKey(BillingCycle, on_delete=models.CASCADE, related_name='invoices', null=True, blank=True)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='GHS')
    
    issue_date = models.DateField(default=date.today)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # Payment tracking
    payment_method = models.CharField(max_length=50, blank=True)
    transaction_reference = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'invoices'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.school.name} - GH₵{self.total_amount}"
    
    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()
        if not self.total_amount:
            self.total_amount = self.amount + self.tax_amount
        super().save(*args, **kwargs)
    
    def generate_invoice_number(self):
        """Generate unique invoice number"""
        today = date.today()
        prefix = f"INV-{today.year}{today.month:02d}"
        last_invoice = Invoice.objects.filter(
            invoice_number__startswith=prefix
        ).order_by('-invoice_number').first()
        
        if last_invoice:
            last_num = int(last_invoice.invoice_number.split('-')[-1])
            new_num = last_num + 1
        else:
            new_num = 1
        
        return f"{prefix}-{new_num:04d}"
    
    def mark_as_paid(self, payment_method='', transaction_ref=''):
        """Mark invoice as paid"""
        self.status = 'PAID'
        self.paid_date = date.today()
        self.payment_method = payment_method
        self.transaction_reference = transaction_ref
        self.save()
    
    def is_overdue(self):
        """Check if invoice is overdue"""
        return self.due_date < date.today() and self.status not in ['PAID', 'CANCELLED', 'REFUNDED']


class PaymentFailure(models.Model):
    """Track payment failures and retry attempts"""
    
    FAILURE_REASONS = [
        ('INSUFFICIENT_FUNDS', 'Insufficient Funds'),
        ('CARD_DECLINED', 'Card Declined'),
        ('EXPIRED_CARD', 'Expired Card'),
        ('NETWORK_ERROR', 'Network Error'),
        ('INVALID_ACCOUNT', 'Invalid Account'),
        ('BANK_ERROR', 'Bank Error'),
        ('OTHER', 'Other'),
    ]
    
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payment_failures')
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='payment_failures')
    
    failure_reason = models.CharField(max_length=50, choices=FAILURE_REASONS)
    failure_message = models.TextField()
    amount_attempted = models.DecimalField(max_digits=10, decimal_places=2)
    
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    next_retry_date = models.DateTimeField(null=True, blank=True)
    
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_failures'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment Failure - {self.school.name} - {self.failure_reason}"
    
    def can_retry(self):
        """Check if payment can be retried"""
        return self.retry_count < self.max_retries and not self.resolved
    
    def schedule_retry(self, hours_delay=24):
        """Schedule next retry attempt"""
        if self.can_retry():
            self.next_retry_date = timezone.now() + timedelta(hours=hours_delay)
            self.save()


class DunningProcess(models.Model):
    """Dunning management for overdue payments"""
    
    DUNNING_STAGES = [
        ('REMINDER_1', 'First Reminder'),
        ('REMINDER_2', 'Second Reminder'),
        ('FINAL_NOTICE', 'Final Notice'),
        ('SUSPENSION_WARNING', 'Suspension Warning'),
        ('SUSPENDED', 'Account Suspended'),
        ('COLLECTION', 'Sent to Collection'),
    ]
    
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='dunning_processes')
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='dunning_processes')
    
    current_stage = models.CharField(max_length=30, choices=DUNNING_STAGES, default='REMINDER_1')
    days_overdue = models.IntegerField(default=0)
    
    last_contact_date = models.DateField(null=True, blank=True)
    next_action_date = models.DateField()
    
    email_sent = models.BooleanField(default=False)
    sms_sent = models.BooleanField(default=False)
    phone_call_made = models.BooleanField(default=False)
    
    notes = models.TextField(blank=True)
    resolved = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'dunning_processes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Dunning - {self.school.name} - {self.current_stage}"
    
    def advance_stage(self):
        """Advance to next dunning stage"""
        stages = [choice[0] for choice in self.DUNNING_STAGES]
        current_index = stages.index(self.current_stage)
        
        if current_index < len(stages) - 1:
            self.current_stage = stages[current_index + 1]
            self.next_action_date = date.today() + timedelta(days=7)
            self.save()
            return True
        return False


class RefundRequest(models.Model):
    """Refund management system"""
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('REJECTED', 'Rejected'),
    ]
    
    REFUND_REASONS = [
        ('DUPLICATE_PAYMENT', 'Duplicate Payment'),
        ('SERVICE_NOT_DELIVERED', 'Service Not Delivered'),
        ('BILLING_ERROR', 'Billing Error'),
        ('CUSTOMER_REQUEST', 'Customer Request'),
        ('TECHNICAL_ISSUE', 'Technical Issue'),
        ('OTHER', 'Other'),
    ]
    
    refund_id = models.CharField(max_length=50, unique=True, default=uuid.uuid4)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='refund_requests')
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='refund_requests')
    
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=50, choices=REFUND_REASONS)
    description = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    requested_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='requested_refunds')
    approved_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_refunds')
    
    processed_date = models.DateTimeField(null=True, blank=True)
    refund_reference = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'refund_requests'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Refund {self.refund_id} - {self.school.name} - GH₵{self.refund_amount}"