from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('monitoring', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SystemSettings',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('platform_name', models.CharField(default='SmartGES', max_length=100)),
                ('support_email', models.EmailField(default='support@smartges.com')),
                ('max_schools', models.PositiveIntegerField(default=500)),
                ('registration_open', models.BooleanField(default=True)),
                ('maintenance_mode', models.BooleanField(default=False)),
                ('email_notifications', models.BooleanField(default=True)),
                ('sms_alerts', models.BooleanField(default=False)),
                ('two_factor_required', models.BooleanField(default=False)),
                ('allow_password_reset', models.BooleanField(default=True)),
                ('password_min_length', models.PositiveSmallIntegerField(default=8)),
                ('session_timeout_minutes', models.PositiveIntegerField(default=60)),
                ('audit_logging', models.BooleanField(default=True)),
                ('api_rate_limit', models.PositiveIntegerField(default=1000)),
                ('db_backup_enabled', models.BooleanField(default=True)),
                ('db_backup_interval_hours', models.PositiveIntegerField(default=24)),
                ('max_file_upload_mb', models.PositiveIntegerField(default=10)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'db_table': 'system_settings'},
        ),
    ]
