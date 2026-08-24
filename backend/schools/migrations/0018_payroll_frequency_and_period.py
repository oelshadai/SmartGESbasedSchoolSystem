from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('schools', '0017_school_student_can_pay_online')]

    operations = [
        migrations.AddField(
            model_name='school',
            name='payroll_frequency',
            field=models.CharField(choices=[('MONTHLY', 'Monthly'), ('WEEKLY', 'Weekly')], default='MONTHLY', max_length=10),
        ),
        migrations.AddField(
            model_name='payrollrecord',
            name='period_start',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='payrollrecord',
            name='period_end',
            field=models.DateField(blank=True, null=True),
        ),
    ]