from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0009_mobiledevicetoken'),
    ]

    operations = [
        migrations.AddField(
            model_name='smslog',
            name='message_body',
            field=models.TextField(blank=True),
        ),
    ]
