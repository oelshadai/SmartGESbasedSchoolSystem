from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('schools', '0021_classify_existing_weekly_payroll'),
    ]

    operations = [
        migrations.AlterField(
            model_name='class',
            name='level',
            field=models.CharField(
                choices=[
                    ('NURSERY', 'Nursery'),
                    ('KG1', 'KG 1'),
                    ('KG2', 'KG 2'),
                    ('BASIC_1', 'Basic 1'),
                    ('BASIC_2', 'Basic 2'),
                    ('BASIC_3', 'Basic 3'),
                    ('BASIC_4', 'Basic 4'),
                    ('BASIC_5', 'Basic 5'),
                    ('BASIC_6', 'Basic 6'),
                    ('BASIC_7', 'Basic 7 (JHS 1)'),
                    ('BASIC_8', 'Basic 8 (JHS 2)'),
                    ('BASIC_9', 'Basic 9 (JHS 3)'),
                ],
                max_length=20,
            ),
        ),
    ]
