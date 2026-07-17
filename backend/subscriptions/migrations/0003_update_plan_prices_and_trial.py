"""Update existing SubscriptionPlan rows to GH₵ pricing and 30-day trial."""
from django.db import migrations


def update_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model('subscriptions', 'SubscriptionPlan')

    updates = {
        'FREE':    {'name': 'Free Trial',  'price': 0.00,    'duration_days': 30},
        'MONTHLY': {'name': 'Monthly',     'price': 200.00,  'duration_days': 30},
        'YEARLY':  {'name': 'Yearly',      'price': 2200.00, 'duration_days': 366},
    }

    for plan_type, data in updates.items():
        SubscriptionPlan.objects.filter(plan_type=plan_type).update(
            name=data['name'],
            price=data['price'],
            duration_days=data['duration_days'],
            max_students=None,
            max_teachers=None,
            bulk_upload=True,
            pdf_generation=True,
            custom_branding=True,
            analytics=True,
            is_active=True,
        )

    # Remove stale Enterprise row (duplicate YEARLY)
    SubscriptionPlan.objects.filter(name='Enterprise').delete()
    SubscriptionPlan.objects.filter(name='Basic Monthly').delete()
    SubscriptionPlan.objects.filter(name='Premium Yearly').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0002_add_plan_field_and_default_plans'),
    ]

    operations = [
        migrations.RunPython(update_plans, reverse_code=migrations.RunPython.noop),
    ]
