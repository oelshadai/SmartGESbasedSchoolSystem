from rest_framework import serializers
from .models import FeeType, FeeStructure, StudentFee, FeePayment, FeeCollection, TermBill, StudentFeeSubType, WeeklyBill
from students.models import Student
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

User = get_user_model()


class SubFeeTypeSerializer(serializers.ModelSerializer):
    """Lightweight serializer for sub-fee types (nested inside FeeTypeSerializer)."""
    class Meta:
        model = FeeType
        fields = ['id', 'name', 'description', 'is_active', 'collection_frequency']


class FeeTypeSerializer(serializers.ModelSerializer):
    sub_types = SubFeeTypeSerializer(many=True, read_only=True)
    has_sub_types = serializers.SerializerMethodField()

    class Meta:
        model = FeeType
        fields = [
            'id', 'name', 'description', 'is_active',
            'collection_frequency', 'collection_day',
            'allow_class_teacher_collection', 'allow_any_teacher_collection',
            'require_payment_approval',
            'parent_fee_type',
            'sub_types',
            'has_sub_types',
        ]

    def get_has_sub_types(self, obj):
        return obj.sub_types.exists()


class StudentFeeSubTypeSerializer(serializers.ModelSerializer):
    main_fee_type_name = serializers.CharField(source='main_fee_type.name', read_only=True)
    sub_fee_type_name = serializers.CharField(source='sub_fee_type.name', read_only=True, allow_null=True)
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentFeeSubType
        fields = [
            'id', 'student', 'student_name',
            'main_fee_type', 'main_fee_type_name',
            'sub_fee_type', 'sub_fee_type_name',
        ]

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

    def create(self, validated_data):
        validated_data['school'] = self.context['request'].user.school
        # upsert: update if already exists
        obj, _ = StudentFeeSubType.objects.update_or_create(
            student=validated_data['student'],
            main_fee_type=validated_data['main_fee_type'],
            defaults={
                'sub_fee_type': validated_data.get('sub_fee_type'),
                'school': validated_data['school'],
            },
        )
        return obj


class FeeStructureSerializer(serializers.ModelSerializer):
    fee_type_name = serializers.CharField(source='fee_type.name', read_only=True)
    
    class Meta:
        model = FeeStructure
        fields = ['id', 'fee_type', 'fee_type_name', 'level', 'tier_label', 'amount', 'collection_period', 'due_date']


class StudentFeeSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    class_level = serializers.CharField(source='student.current_class.level', read_only=True)
    
    class Meta:
        model = StudentFee
        fields = [
            'id', 'student_id', 'student_name', 'class_level',
            'total_amount', 'amount_paid', 'balance', 'status',
            'last_payment_date', 'created_at', 'updated_at'
        ]
    
    def get_student_name(self, obj):
        return f"{obj.student.user.first_name} {obj.student.user.last_name}"


class FeePaymentSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_name = serializers.SerializerMethodField(read_only=True)
    fee_type_name = serializers.CharField(source='fee_type.name', read_only=True)
    collected_by_name = serializers.CharField(source='collected_by.get_full_name', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    school_address = serializers.CharField(source='school.address', read_only=True)
    school_phone = serializers.CharField(source='school.phone_number', read_only=True)
    school_email = serializers.CharField(source='school.email', read_only=True)
    school_motto = serializers.CharField(source='school.motto', read_only=True)
    school_logo = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = FeePayment
        fields = [
            'id', 'student_id', 'student_name', 'fee_type', 'fee_type_name',
            'amount_paid', 'payment_method', 'reference_number', 'notes',
            'payment_date', 'collected_by_name', 'school_name', 'school_address',
            'school_phone', 'school_email', 'school_motto', 'school_logo',
            'is_verified', 'created_at'
        ]
        read_only_fields = ['payment_date', 'created_at', 'updated_at']
    
    def get_student_name(self, obj):
        return f"{obj.student.user.first_name} {obj.student.user.last_name}"

    def get_school_logo(self, obj):
        if not obj.school.logo:
            return None
        try:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.school.logo.url) if request else obj.school.logo.url
        except (ValueError, AttributeError):
            return None


class FeePaymentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating fee payments"""

    class Meta:
        model = FeePayment
        fields = ['student', 'fee_type', 'amount_paid', 'payment_method', 'reference_number', 'notes']

    def _outstanding_balance(self, student, fee_type, lock=False):
        """Resolve the outstanding amount for this student and fee frequency."""
        frequency = fee_type.collection_frequency
        bill_queryset = TermBill.objects
        if lock:
            bill_queryset = bill_queryset.select_for_update()

        if frequency in ('TERM', 'YEAR'):
            current_term = TermBill._meta.get_field('term').related_model.objects.filter(
                academic_year__school=student.school,
                is_current=True,
            ).first()
            if not current_term:
                raise DjangoValidationError('No current academic term is configured for this fee.')
            try:
                bill = bill_queryset.get(
                    student=student,
                    school=student.school,
                    term=current_term,
                    fee_type=fee_type,
                )
            except TermBill.DoesNotExist:
                raise DjangoValidationError('No bill exists for this student and fee type.')
            if bill.status == 'WAIVED':
                raise DjangoValidationError('This fee has been waived and cannot receive a payment.')
            return max(Decimal('0'), bill.amount_billed - bill.amount_paid)

        today = timezone.localdate()
        if frequency == 'WEEKLY':
            week_start = today - timedelta(days=today.weekday())
            try:
                from .models import WeeklyBill
                weekly_queryset = WeeklyBill.objects.select_for_update() if lock else WeeklyBill.objects
                bill = weekly_queryset.get(
                    student=student,
                    school=student.school,
                    fee_type=fee_type,
                    week_start=week_start,
                )
            except WeeklyBill.DoesNotExist:
                raise DjangoValidationError('No weekly bill exists for this student and fee type.')
            if bill.status == 'WAIVED':
                raise DjangoValidationError('This fee has been waived and cannot receive a payment.')
            return max(Decimal('0'), bill.amount_billed - bill.amount_paid)

        structure = FeeStructure.objects.filter(
            school=student.school,
            fee_type=fee_type,
            level=student.current_class.level if student.current_class else '',
            tier_label=''
        ).first()
        if fee_type.sub_types.exists():
            assignment = StudentFeeSubType.objects.filter(
                student=student,
                school=student.school,
                main_fee_type=fee_type,
            ).first()
            if not assignment or not assignment.sub_fee_type_id:
                raise DjangoValidationError('This student is not assigned to an applicable fee option.')
            structure = FeeStructure.objects.filter(
                school=student.school,
                fee_type_id=assignment.sub_fee_type_id,
                level=student.current_class.level if student.current_class else '',
            ).first()
        if not structure:
            raise DjangoValidationError('No fee structure exists for this student and fee type.')

        period_filter = {'payment_date__date': today} if frequency == 'DAILY' else {
            'payment_date__year': today.year,
            'payment_date__month': today.month,
        }
        already_paid = FeePayment.objects.filter(
            student=student,
            school=student.school,
            fee_type=fee_type,
            **period_filter,
        ).aggregate(total=Sum('amount_paid'))['total'] or Decimal('0')
        return max(Decimal('0'), structure.amount - already_paid)

    def validate(self, attrs):
        student = attrs['student']
        fee_type = attrs['fee_type']
        if student.school_id != self.context['request'].user.school_id or fee_type.school_id != student.school_id:
            raise serializers.ValidationError('Student and fee type must belong to your school.')
        if fee_type.sub_types.exists():
            assignment = StudentFeeSubType.objects.filter(
                student=student,
                school=student.school,
                main_fee_type=fee_type,
            ).first()
            if not assignment or not assignment.sub_fee_type_id:
                raise serializers.ValidationError({
                    'fee_type': 'This student is not assigned to an applicable fee option.'
                })
        try:
            outstanding = self._outstanding_balance(student, fee_type)
        except DjangoValidationError as error:
            raise serializers.ValidationError({'amount_paid': error.messages})
        if attrs['amount_paid'] > outstanding:
            raise serializers.ValidationError({
                'amount_paid': f'Payment cannot exceed the outstanding balance of GH₵{outstanding:.2f}.'
            })
        return attrs

    def create(self, validated_data):
        from django.utils import timezone
        from decimal import Decimal
        import uuid

        request = self.context.get('request')
        validated_data['school'] = request.user.school
        validated_data['collected_by'] = request.user
        if not validated_data.get('reference_number'):
            validated_data['reference_number'] = f'RCP-{timezone.now():%Y%m%d}-{uuid.uuid4().hex[:8].upper()}'

        with transaction.atomic():
            outstanding = self._outstanding_balance(
                validated_data['student'], validated_data['fee_type'], lock=True
            )
            if validated_data['amount_paid'] > outstanding:
                raise serializers.ValidationError({
                    'amount_paid': f'Payment cannot exceed the outstanding balance of GH₵{outstanding:.2f}.'
                })
            payment = FeePayment.objects.create(**validated_data)

        # ------------------------------------------------------------------
        # Update the running StudentFee balance
        # ------------------------------------------------------------------
        student_fee, _ = StudentFee.objects.get_or_create(
            student=validated_data['student'],
            school=validated_data['school'],
            defaults={'total_amount': 0, 'amount_paid': 0, 'balance': 0}
        )
        student_fee.amount_paid += validated_data['amount_paid']
        _balance = student_fee.total_amount - student_fee.amount_paid
        # Clamp to 0 — overpayments are recorded in TermBill, not as a negative debt here
        student_fee.balance = _balance if _balance > Decimal('0') else Decimal('0')
        student_fee.last_payment_date = timezone.now()
        if student_fee.total_amount > 0 and student_fee.balance <= Decimal('0'):
            student_fee.status = 'PAID'
        elif student_fee.amount_paid > Decimal('0'):
            student_fee.status = 'PARTIAL'
        student_fee.save()

        # ------------------------------------------------------------------
        # Keep the frequency-specific bill in sync with the payment.
        # ------------------------------------------------------------------
        try:
            from schools.models import Term
            fee_type = validated_data['fee_type']
            if fee_type.collection_frequency in ('TERM', 'YEAR'):
                current_term = Term.objects.filter(
                    academic_year__school=validated_data['school'],
                    is_current=True
                ).first()
                if current_term:
                    term_bill = TermBill.objects.filter(
                        student=validated_data['student'],
                        term=current_term,
                        fee_type=fee_type
                    ).first()
                    if term_bill:
                        term_bill.amount_paid += validated_data['amount_paid']
                        term_bill.save()
            elif fee_type.collection_frequency == 'WEEKLY':
                today = timezone.localdate()
                week_start = today - timedelta(days=today.weekday())
                weekly_bill = WeeklyBill.objects.filter(
                    student=validated_data['student'],
                    school=validated_data['school'],
                    fee_type=fee_type,
                    week_start=week_start,
                ).first()
                if weekly_bill:
                    weekly_bill.amount_paid += validated_data['amount_paid']
                    weekly_bill.save()
        except Exception:
            pass

        return payment


class FeeCollectionSerializer(serializers.ModelSerializer):
    collected_by_name = serializers.CharField(source='collected_by.get_full_name', read_only=True)
    fee_type_name = serializers.CharField(source='fee_type.name', read_only=True)
    class_name = serializers.CharField(source='class_assigned', read_only=True)
    
    class Meta:
        model = FeeCollection
        fields = [
            'id', 'collected_by_name', 'class_name', 'fee_type', 'fee_type_name',
            'total_amount_collected', 'total_students_paid', 'collection_date',
            'notes', 'is_submitted', 'submitted_date'
        ]
        read_only_fields = ['collection_date', 'submitted_date']


class StudentSearchSerializer(serializers.Serializer):
    """Serializer for student search results"""
    id = serializers.IntegerField()
    student_id = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    class_level = serializers.CharField()
    section = serializers.CharField()
    email = serializers.EmailField()
    phone_number = serializers.CharField()
    current_balance = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_status = serializers.CharField()


class FeeCollectionReportSerializer(serializers.Serializer):
    """Serializer for fee collection reports"""
    fee_type = serializers.CharField()
    total_students = serializers.IntegerField()
    students_paid = serializers.IntegerField()
    total_amount_due = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_amount_collected = serializers.DecimalField(max_digits=12, decimal_places=2)
    outstanding_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    payment_percentage = serializers.FloatField()


class TermBillSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    class_level = serializers.CharField(source='student.current_class.level', read_only=True)
    class_section = serializers.CharField(source='student.current_class.section', read_only=True)
    fee_type_name = serializers.CharField(source='fee_type.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    academic_year_name = serializers.CharField(source='term.academic_year.name', read_only=True)

    class Meta:
        model = TermBill
        fields = [
            'id', 'student_id', 'student_name', 'class_level', 'class_section',
            'fee_type', 'fee_type_name', 'term', 'term_name', 'academic_year_name',
            'amount_billed', 'amount_paid', 'balance', 'status',
            'due_date', 'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['amount_paid', 'balance', 'status', 'created_at', 'updated_at']

    def get_student_name(self, obj):
        return f"{obj.student.user.first_name} {obj.student.user.last_name}"


class GenerateBillsSerializer(serializers.Serializer):
    """Input for bulk bill generation"""
    term = serializers.IntegerField(help_text='Term ID to generate bills for')
    fee_type = serializers.IntegerField(required=False, allow_null=True,
                                        help_text='Specific fee type; omit to generate for all TERM/YEAR fee types')
    overwrite = serializers.BooleanField(
        default=False,
        help_text='If True, update existing bills with new amounts; otherwise skip students already billed'
    )


class GenerateWeeklyBillsSerializer(serializers.Serializer):
    """Input for bulk weekly bill generation."""
    start_date = serializers.DateField(help_text='Start date (Monday) for the weekly billing period')
    end_date = serializers.DateField(help_text='End date (Friday) for the weekly billing period')
    fee_type = serializers.IntegerField(required=False, allow_null=True,
                                        help_text='Specific fee type; omit to generate for all WEEKLY fee types')
    overwrite = serializers.BooleanField(default=False)

    def validate(self, attrs):
        if attrs['end_date'] < attrs['start_date']:
            raise serializers.ValidationError('end_date must be on or after start_date')
        return attrs


class WeeklyBillSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    fee_type_name = serializers.CharField(source='fee_type.name', read_only=True)
    class_level = serializers.CharField(source='student.current_class.level', read_only=True)

    class Meta:
        model = WeeklyBill
        fields = [
            'id', 'student_id', 'student_name', 'class_level',
            'fee_type', 'fee_type_name',
            'week_start', 'week_end', 'amount_billed', 'amount_paid',
            'balance', 'status', 'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['amount_paid', 'balance', 'status', 'created_at', 'updated_at']

    def get_student_name(self, obj):
        return f"{obj.student.user.first_name} {obj.student.user.last_name}"


class StudentInitiatePaymentSerializer(serializers.Serializer):
    """Input for student-initiated Paystack payment"""
    bill_id = serializers.IntegerField(help_text='TermBill or WeeklyBill ID to pay')
    bill_type = serializers.ChoiceField(
        choices=['term', 'weekly'],
        default='term',
        help_text="Type of bill: 'term' for TermBill, 'weekly' for WeeklyBill"
    )
    amount = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False,
        help_text='Optional: partial amount to pay. Defaults to full balance.'
    )
