from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('schools', '0019_staffsalary_weekly_allowance')]

    operations = [
        migrations.AddField(
            model_name='payrollrecord',
            name='payroll_frequency',
            field=models.CharField(choices=[('MONTHLY', 'Monthly'), ('WEEKLY', 'Weekly')], default='MONTHLY', max_length=10),
        ),
        migrations.AlterUniqueTogether(
            name='payrollrecord',
            unique_together=set(),
        ),
        migrations.AddConstraint(
            model_name='payrollrecord',
            constraint=models.UniqueConstraint(condition=models.Q(('payroll_frequency', 'MONTHLY')), fields=('school', 'staff', 'month', 'year'), name='unique_monthly_payroll_record'),
        ),
        migrations.AddConstraint(
            model_name='payrollrecord',
            constraint=models.UniqueConstraint(condition=models.Q(('payroll_frequency', 'WEEKLY')), fields=('school', 'staff', 'period_start', 'period_end'), name='unique_weekly_payroll_record'),
        ),
    ]