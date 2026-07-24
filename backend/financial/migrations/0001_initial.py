from django.db import migrations


class Migration(migrations.Migration):
    """
    No-op migration. All financial tables are defined in schools/models.py
    and already exist in the database (created by schools migrations).
    This migration exists only so Django's migration framework records
    financial.0001_initial as applied without trying to CREATE any tables.
    """

    initial = True

    dependencies = [
        ('schools', '0014_alter_school_sms_sender_name'),
    ]

    operations = []
