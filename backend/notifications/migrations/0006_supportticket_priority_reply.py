from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('notifications', '0005_supportticket'),
    ]

    operations = [
        migrations.AddField(
            model_name='supportticket',
            name='priority',
            field=models.CharField(
                choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')],
                default='medium',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='supportticket',
            name='school_name',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='supportticket',
            name='admin_reply',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='supportticket',
            name='replied_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='supportticket',
            name='replied_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='support_replies',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
