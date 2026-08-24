from django.db import migrations


def classify_weekly_records(apps, schema_editor):
    PayrollRecord = apps.get_model('schools', 'PayrollRecord')
    PayrollRecord.objects.filter(
        period_start__isnull=False,
        period_end__isnull=False,
    ).update(payroll_frequency='WEEKLY')


class Migration(migrations.Migration):
    dependencies = [('schools', '0020_payroll_record_frequency_constraints')]

    operations = [migrations.RunPython(classify_weekly_records, migrations.RunPython.noop)]