from rest_framework import serializers
from .models import StudentPromotion, Student
from schools.models import Class, AcademicYear


class BulkClassPromotionSerializer(serializers.Serializer):
    """Serializer for bulk class promotion"""
    from_class_id = serializers.IntegerField()
    to_class_id = serializers.IntegerField(required=False, allow_null=True)
    academic_year_id = serializers.IntegerField()
    force_promotion = serializers.BooleanField(default=False)
    
    def validate_from_class_id(self, value):
        try:
            Class.objects.get(id=value)
            return value
        except Class.DoesNotExist:
            raise serializers.ValidationError("Invalid from_class_id")
    
    def validate_to_class_id(self, value):
        if value is not None:
            try:
                Class.objects.get(id=value)
                return value
            except Class.DoesNotExist:
                raise serializers.ValidationError("Invalid to_class_id")
        return value
    
    def validate_academic_year_id(self, value):
        try:
            AcademicYear.objects.get(id=value)
            return value
        except AcademicYear.DoesNotExist:
            raise serializers.ValidationError("Invalid academic_year_id")


class SelectivePromotionSerializer(serializers.Serializer):
    """Serializer for selective student promotion"""
    student_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        error_messages={'min_length': 'At least one student must be selected'}
    )
    to_class_id = serializers.IntegerField()
    academic_year_id = serializers.IntegerField()
    remarks = serializers.CharField(max_length=500, required=False, allow_blank=True)
    force_promotion = serializers.BooleanField(default=False)
    
    def validate_student_ids(self, value):
        # Check if all student IDs exist
        existing_ids = Student.objects.filter(id__in=value).values_list('id', flat=True)
        missing_ids = set(value) - set(existing_ids)
        if missing_ids:
            raise serializers.ValidationError(f"Invalid student IDs: {list(missing_ids)}")
        return value
    
    def validate_to_class_id(self, value):
        try:
            Class.objects.get(id=value)
            return value
        except Class.DoesNotExist:
            raise serializers.ValidationError("Invalid to_class_id")
    
    def validate_academic_year_id(self, value):
        try:
            AcademicYear.objects.get(id=value)
            return value
        except AcademicYear.DoesNotExist:
            raise serializers.ValidationError("Invalid academic_year_id")


class PromotionPreviewSerializer(serializers.Serializer):
    """Serializer for promotion preview request"""
    class_id = serializers.IntegerField()
    academic_year_id = serializers.IntegerField()
    
    def validate_class_id(self, value):
        try:
            Class.objects.get(id=value)
            return value
        except Class.DoesNotExist:
            raise serializers.ValidationError("Invalid class_id")
    
    def validate_academic_year_id(self, value):
        try:
            AcademicYear.objects.get(id=value)
            return value
        except AcademicYear.DoesNotExist:
            raise serializers.ValidationError("Invalid academic_year_id")


class StudentPromotionDetailSerializer(serializers.ModelSerializer):
    """Enhanced serializer for StudentPromotion with additional details"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    from_class_name = serializers.CharField(source='from_class.full_name', read_only=True)
    to_class_name = serializers.CharField(source='to_class.full_name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    
    class Meta:
        model = StudentPromotion
        fields = [
            'id', 'student_name', 'student_id', 'from_class_name', 'to_class_name',
            'academic_year_name', 'is_graduated', 'promoted_date', 'remarks'
        ]
        read_only_fields = ['id', 'promoted_date']


class PromotionSummarySerializer(serializers.Serializer):
    """Serializer for promotion operation summary"""
    message = serializers.CharField()
    promoted_students = serializers.ListField(child=serializers.DictField())
    failed_students = serializers.ListField(child=serializers.DictField())
    summary = serializers.DictField()