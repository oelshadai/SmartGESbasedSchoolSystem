from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0006_add_last_seen_to_user'),
    ]

    operations = [
        migrations.CreateModel(
            name='PendingSchoolRegistration',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('school_name', models.CharField(max_length=255)),
                ('admin_email', models.EmailField(max_length=254)),
                ('first_name', models.CharField(default='Admin', max_length=100)),
                ('last_name', models.CharField(default='User', max_length=100)),
                ('address', models.CharField(blank=True, default='', max_length=255)),
                ('location', models.CharField(blank=True, default='', max_length=255)),
                ('phone_number', models.CharField(blank=True, default='', max_length=50)),
                ('levels', models.JSONField(blank=True, default=list)),
                ('plan', models.CharField(max_length=20)),
                ('password_hash', models.CharField(max_length=255)),
                ('paystack_reference', models.CharField(max_length=255, unique=True)),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('COMPLETED', 'Completed'), ('FAILED', 'Failed')], default='PENDING', max_length=20)),
                ('expires_at', models.DateTimeField()),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['-created_at']},
        ),
    ]