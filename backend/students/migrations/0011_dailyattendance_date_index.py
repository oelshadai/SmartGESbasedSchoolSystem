from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0010_enhanced_promotion_system'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='dailyattendance',
            index=models.Index(fields=['date'], name='daily_att_date_idx'),
        ),
    ]
