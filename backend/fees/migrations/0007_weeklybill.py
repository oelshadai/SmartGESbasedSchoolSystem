from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('fees', '0006_feepayment_paystack_fields'),
        ('students', '0010_enhanced_promotion_system'),
        ('schools', '0017_school_student_can_pay_online'),
    ]

    operations = [
        migrations.CreateModel(
            name='WeeklyBill',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('week_start', models.DateField(help_text='Start date (Monday) of the billing week')),
                ('week_end', models.DateField(help_text='End date (Friday) of the billing week')),
                ('amount_billed', models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(0)])),
                ('amount_paid', models.DecimalField(decimal_places=2, default=0, max_digits=10, validators=[django.core.validators.MinValueValidator(0)])),
                ('balance', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('status', models.CharField(choices=[('UNPAID', 'Not Paid'), ('PARTIAL', 'Partially Paid'), ('PAID', 'Fully Paid'), ('WAIVED', 'Waived')], default='UNPAID', max_length=20)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('fee_type', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='weekly_bills', to='fees.feetype')),
                ('school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='weekly_bills', to='schools.school')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='weekly_bills', to='students.student')),
            ],
            options={
                'ordering': ['-week_start', 'fee_type', 'student'],
                'unique_together': {('student', 'fee_type', 'week_start')},
            },
        ),
    ]