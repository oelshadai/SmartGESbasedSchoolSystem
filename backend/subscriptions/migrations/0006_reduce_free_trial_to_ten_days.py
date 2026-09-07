from datetime import timedelta

from django.db import migrations


def reduce_free_trials(apps, schema_editor):
    SubscriptionPlan = apps.get_model('subscriptions', 'SubscriptionPlan')
    Subscription = apps.get_model('subscriptions', 'Subscription')
    School = apps.get_model('schools', 'School')

    SubscriptionPlan.objects.filter(plan_type='FREE').update(duration_days=10)

    for subscription in Subscription.objects.filter(plan_type='FREE', status='ACTIVE'):
        new_end_date = subscription.start_date + timedelta(days=10)
        if subscription.end_date > new_end_date:
            subscription.end_date = new_end_date
            subscription.save(update_fields=['end_date'])

    for school in School.objects.filter(subscription_plan='FREE'):
        if school.subscription_expires and school.subscription_expires > school.created_at.date() + timedelta(days=10):
            school.subscription_expires = school.created_at.date() + timedelta(days=10)
            school.save(update_fields=['subscription_expires'])


class Migration(migrations.Migration):
    dependencies = [
        ('subscriptions', '0005_alter_invoice_issue_date_and_more'),
    ]

    operations = [
        migrations.RunPython(reduce_free_trials, migrations.RunPython.noop),
    ]