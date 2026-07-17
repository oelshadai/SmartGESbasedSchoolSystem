# Generated migration for subscription model updates

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0001_initial'),
    ]

    operations = [
        # Add SUSPENDED status choice
        migrations.AlterField(
            model_name='subscription',
            name='status',
            field=models.CharField(choices=[('ACTIVE', 'Active'), ('EXPIRED', 'Expired'), ('CANCELLED', 'Cancelled'), ('SUSPENDED', 'Suspended'), ('LOCKED', 'Locked (trial ended)')], default='ACTIVE', max_length=20),
        ),
        
        # Create default subscription plans
        migrations.RunPython(
            code=lambda apps, schema_editor: create_default_plans(apps, schema_editor),
            reverse_code=migrations.RunPython.noop,
        ),
    ]


def create_default_plans(apps, schema_editor):
    """Create default subscription plans"""
    SubscriptionPlan = apps.get_model('subscriptions', 'SubscriptionPlan')
    
    # Create default plans if they don't exist
    plans = [
        {
            'name': 'Free Trial',
            'plan_type': 'FREE',
            'price': 0.00,
            'duration_days': 30,
            'max_students': None,
            'max_teachers': None,
            'bulk_upload': True,
            'pdf_generation': True,
            'custom_branding': True,
            'analytics': True,
            'support_level': 'Standard',
        },
        {
            'name': 'Monthly',
            'plan_type': 'MONTHLY',
            'price': 200.00,
            'duration_days': 30,
            'max_students': None,
            'max_teachers': None,
            'bulk_upload': True,
            'pdf_generation': True,
            'custom_branding': True,
            'analytics': True,
            'support_level': 'Standard',
        },
        {
            'name': 'Yearly',
            'plan_type': 'YEARLY',
            'price': 2200.00,
            'duration_days': 366,
            'max_students': None,
            'max_teachers': None,
            'bulk_upload': True,
            'pdf_generation': True,
            'custom_branding': True,
            'analytics': True,
            'support_level': 'Premium',
        },
    ]
    
    for plan_data in plans:
        SubscriptionPlan.objects.get_or_create(
            name=plan_data['name'],
            defaults=plan_data
        )
    
    # Update existing subscriptions to use the Free Trial plan
    Subscription = apps.get_model('subscriptions', 'Subscription')
    free_plan = SubscriptionPlan.objects.filter(plan_type='FREE').first()
    
    if free_plan:
        # Update subscriptions that don't have a plan assigned
        Subscription.objects.filter(plan__isnull=True).update(plan=free_plan)