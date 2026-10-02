from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('schools', '0022_add_early_years_class_levels'),
    ]

    operations = [
        migrations.AddField(
            model_name='school',
            name='daily_fee_closed_dates',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text='School-closed dates excluded from daily fee expected income',
            ),
        ),
    ]