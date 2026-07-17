from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('schools', '0016_alter_budget_table_alter_budgetitem_table_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='school',
            name='student_can_pay_online',
            field=models.BooleanField(default=False, help_text='Allow students to initiate online fee payments via Paystack from their dashboard'),
        ),
    ]