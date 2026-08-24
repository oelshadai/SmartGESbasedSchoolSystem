from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('schools', '0018_payroll_frequency_and_period')]

    operations = [
        migrations.AddField(
            model_name='staffsalary',
            name='weekly_allowance',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
    ]