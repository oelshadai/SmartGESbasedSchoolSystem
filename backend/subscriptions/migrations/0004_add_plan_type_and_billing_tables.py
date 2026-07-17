"""
Migration 0004:
- Add plan_type field to Subscription and Payment models
- Create billing tables: BillingCycle, Invoice, PaymentFailure, DunningProcess, RefundRequest
"""
import uuid
from django.db import migrations, models
import django.db.models.deletion


PLAN_CHOICES = [
    ('FREE', 'Free Trial (30 days)'),
    ('MONTHLY', 'Monthly – GH₵ 200/month'),
    ('YEARLY', 'Yearly – GH₵ 2,200/year (2 months free)'),
]


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0003_update_plan_prices_and_trial'),
        ('schools', '0001_initial'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        # ── Add plan_type to Subscription ────────────────────────────────────
        migrations.AddField(
            model_name='subscription',
            name='plan_type',
            field=models.CharField(
                choices=PLAN_CHOICES,
                default='FREE',
                max_length=20,
            ),
        ),

        # ── Add plan_type to Payment ──────────────────────────────────────────
        migrations.AddField(
            model_name='payment',
            name='plan_type',
            field=models.CharField(
                choices=PLAN_CHOICES,
                default='MONTHLY',
                max_length=20,
            ),
        ),

        # ── BillingCycle ──────────────────────────────────────────────────────
        migrations.CreateModel(
            name='BillingCycle',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cycle_type', models.CharField(
                    choices=[('MONTHLY', 'Monthly'), ('QUARTERLY', 'Quarterly'), ('YEARLY', 'Yearly'), ('CUSTOM', 'Custom')],
                    default='MONTHLY', max_length=20,
                )),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('currency', models.CharField(default='GHS', max_length=3)),
                ('next_billing_date', models.DateField()),
                ('last_billing_date', models.DateField(blank=True, null=True)),
                ('billing_day', models.IntegerField(default=1, help_text='Day of month to bill (1-28)')),
                ('status', models.CharField(
                    choices=[('ACTIVE', 'Active'), ('PAUSED', 'Paused'), ('CANCELLED', 'Cancelled')],
                    default='ACTIVE', max_length=20,
                )),
                ('auto_renew', models.BooleanField(default=True)),
                ('grace_period_days', models.IntegerField(default=7)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('school', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='billing_cycles', to='schools.school',
                )),
                ('subscription', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='billing_cycles', to='subscriptions.subscription',
                )),
            ],
            options={'db_table': 'billing_cycles', 'ordering': ['-created_at']},
        ),

        # ── Invoice ───────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='Invoice',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('invoice_number', models.CharField(max_length=50, unique=True)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('tax_amount', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('total_amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('currency', models.CharField(default='GHS', max_length=3)),
                ('issue_date', models.DateField()),
                ('due_date', models.DateField()),
                ('paid_date', models.DateField(blank=True, null=True)),
                ('status', models.CharField(
                    choices=[('DRAFT', 'Draft'), ('SENT', 'Sent'), ('PAID', 'Paid'),
                             ('OVERDUE', 'Overdue'), ('CANCELLED', 'Cancelled'), ('REFUNDED', 'Refunded')],
                    default='DRAFT', max_length=20,
                )),
                ('description', models.TextField(blank=True)),
                ('notes', models.TextField(blank=True)),
                ('payment_method', models.CharField(blank=True, max_length=50)),
                ('transaction_reference', models.CharField(blank=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('school', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='invoices', to='schools.school',
                )),
                ('billing_cycle', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='invoices', to='subscriptions.billingcycle',
                )),
            ],
            options={'db_table': 'invoices', 'ordering': ['-created_at']},
        ),

        # ── PaymentFailure ────────────────────────────────────────────────────
        migrations.CreateModel(
            name='PaymentFailure',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('failure_reason', models.CharField(
                    choices=[('INSUFFICIENT_FUNDS', 'Insufficient Funds'), ('CARD_DECLINED', 'Card Declined'),
                             ('EXPIRED_CARD', 'Expired Card'), ('NETWORK_ERROR', 'Network Error'),
                             ('INVALID_ACCOUNT', 'Invalid Account'), ('BANK_ERROR', 'Bank Error'), ('OTHER', 'Other')],
                    max_length=50,
                )),
                ('failure_message', models.TextField()),
                ('amount_attempted', models.DecimalField(decimal_places=2, max_digits=10)),
                ('retry_count', models.IntegerField(default=0)),
                ('max_retries', models.IntegerField(default=3)),
                ('next_retry_date', models.DateTimeField(blank=True, null=True)),
                ('resolved', models.BooleanField(default=False)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('invoice', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='payment_failures', to='subscriptions.invoice',
                )),
                ('school', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='payment_failures', to='schools.school',
                )),
            ],
            options={'db_table': 'payment_failures', 'ordering': ['-created_at']},
        ),

        # ── DunningProcess ────────────────────────────────────────────────────
        migrations.CreateModel(
            name='DunningProcess',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('current_stage', models.CharField(
                    choices=[('REMINDER_1', 'First Reminder'), ('REMINDER_2', 'Second Reminder'),
                             ('FINAL_NOTICE', 'Final Notice'), ('SUSPENSION_WARNING', 'Suspension Warning'),
                             ('SUSPENDED', 'Account Suspended'), ('COLLECTION', 'Sent to Collection')],
                    default='REMINDER_1', max_length=30,
                )),
                ('days_overdue', models.IntegerField(default=0)),
                ('last_contact_date', models.DateField(blank=True, null=True)),
                ('next_action_date', models.DateField()),
                ('email_sent', models.BooleanField(default=False)),
                ('sms_sent', models.BooleanField(default=False)),
                ('phone_call_made', models.BooleanField(default=False)),
                ('notes', models.TextField(blank=True)),
                ('resolved', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('school', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='dunning_processes', to='schools.school',
                )),
                ('invoice', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='dunning_processes', to='subscriptions.invoice',
                )),
            ],
            options={'db_table': 'dunning_processes', 'ordering': ['-created_at']},
        ),

        # ── RefundRequest ─────────────────────────────────────────────────────
        migrations.CreateModel(
            name='RefundRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('refund_id', models.CharField(default=uuid.uuid4, max_length=50, unique=True)),
                ('refund_amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('reason', models.CharField(
                    choices=[('DUPLICATE_PAYMENT', 'Duplicate Payment'), ('SERVICE_NOT_DELIVERED', 'Service Not Delivered'),
                             ('BILLING_ERROR', 'Billing Error'), ('CUSTOMER_REQUEST', 'Customer Request'),
                             ('TECHNICAL_ISSUE', 'Technical Issue'), ('OTHER', 'Other')],
                    max_length=50,
                )),
                ('description', models.TextField()),
                ('status', models.CharField(
                    choices=[('PENDING', 'Pending Review'), ('APPROVED', 'Approved'), ('PROCESSING', 'Processing'),
                             ('COMPLETED', 'Completed'), ('REJECTED', 'Rejected')],
                    default='PENDING', max_length=20,
                )),
                ('processed_date', models.DateTimeField(blank=True, null=True)),
                ('refund_reference', models.CharField(blank=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('invoice', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='refund_requests', to='subscriptions.invoice',
                )),
                ('school', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='refund_requests', to='schools.school',
                )),
                ('requested_by', models.ForeignKey(
                    null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='requested_refunds', to='accounts.user',
                )),
                ('approved_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='approved_refunds', to='accounts.user',
                )),
            ],
            options={'db_table': 'refund_requests', 'ordering': ['-created_at']},
        ),
    ]
