from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.db.models import Q, Sum
from django.utils.dateparse import parse_date
from datetime import date
from students.models import DailyAttendance, Student
from schools.models import Class


def _auto_record_daily_fee(student, attendance_date, marked_by):
    from decimal import Decimal

    from django.utils import timezone
    from fees.models import FeePayment, FeeStructure, FeeType, StudentFee

    class_instance = student.current_class
    if class_instance is None:
        return Decimal('0')

    fee_type = FeeType.objects.filter(
        school=student.school,
        collection_frequency='DAILY',
        is_active=True,
        allow_class_teacher_collection=True,
        parent_fee_type__isnull=True,
    ).order_by('name').first()
    if fee_type is None:
        return Decimal('0')

    assignment = None
    if fee_type.sub_types.exists():
        from fees.models import StudentFeeSubType

        assignment = StudentFeeSubType.objects.filter(
            student=student,
            school=student.school,
            main_fee_type=fee_type,
        ).first()

    structure_fee_type_id = (
        assignment.sub_fee_type_id
        if assignment and assignment.sub_fee_type_id
        else fee_type.id
    )
    structure = FeeStructure.objects.filter(
        school=student.school,
        fee_type_id=structure_fee_type_id,
        level=class_instance.level,
        tier_label='',
    ).first()
    if structure is None or structure.amount <= 0:
        return Decimal('0')

    with transaction.atomic():
        already_paid = FeePayment.objects.filter(
            student=student,
            school=student.school,
            fee_type=fee_type,
        ).filter(
            Q(attendance_date=attendance_date)
            | Q(payment_date__date=attendance_date)
        ).aggregate(total=Sum('amount_paid'))['total'] or Decimal('0')
        amount_to_record = max(Decimal('0'), structure.amount - already_paid)
        if amount_to_record <= 0:
            return Decimal('0')

        payment, created = FeePayment.objects.get_or_create(
            student=student,
            fee_type=fee_type,
            attendance_date=attendance_date,
            defaults={
                'school': student.school,
                'amount_paid': amount_to_record,
                'payment_method': 'CASH',
                'collected_by': marked_by,
                'notes': f'Auto-recorded from attendance on {attendance_date}',
                'is_verified': True,
            },
        )
        if not created:
            return Decimal('0')

        student_fee, _ = StudentFee.objects.get_or_create(
            student=student,
            school=student.school,
            defaults={'total_amount': Decimal('0'), 'amount_paid': Decimal('0'), 'balance': Decimal('0')},
        )
        student_fee = StudentFee.objects.select_for_update().get(pk=student_fee.pk)
        student_fee.amount_paid += payment.amount_paid
        balance = student_fee.total_amount - student_fee.amount_paid
        student_fee.balance = balance if balance > Decimal('0') else Decimal('0')
        student_fee.last_payment_date = timezone.now()
        if student_fee.total_amount > 0 and student_fee.balance <= 0:
            student_fee.status = 'PAID'
        elif student_fee.amount_paid > 0:
            student_fee.status = 'PARTIAL'
        student_fee.save()
        return payment.amount_paid


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_attendance_my_classes(request):
    """Get classes assigned to current teacher"""
    try:
        classes = Class.objects.filter(
            class_teacher=request.user,
            school=request.user.school
        )
        
        classes_data = []
        for cls in classes:
            student_count = Student.objects.filter(
                current_class=cls,
                is_active=True
            ).count()
            
            # Check if attendance taken today
            today = date.today()
            attendance_taken_today = DailyAttendance.objects.filter(
                class_instance=cls,
                date=today,
                marked_by=request.user
            ).exists()
            
            classes_data.append({
                'id': cls.id,
                'name': str(cls),
                'level': cls.get_level_display(),
                'student_count': student_count,
                'attendance_taken_today': attendance_taken_today
            })
        
        return Response({'classes': classes_data})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_attendance_class_students(request):
    """Get students in a class for attendance taking"""
    class_id = request.query_params.get('class_id')
    date_str = request.query_params.get('date', str(date.today()))
    selected_date = parse_date(date_str) or date.today()
    
    if not class_id:
        return Response({'error': 'class_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        cls = Class.objects.get(
            id=class_id,
            class_teacher=request.user,
            school=request.user.school
        )
    except Class.DoesNotExist:
        return Response({'error': 'Class not found or not assigned to you'}, status=status.HTTP_404_NOT_FOUND)
    
    # Get all active students in the class
    students = Student.objects.filter(
        current_class=cls,
        is_active=True
    ).order_by('last_name', 'first_name')
    
    # Get existing attendance records for the date
    existing_attendance = DailyAttendance.objects.filter(
        class_instance=cls,
        date=selected_date
    ).select_related('student')
    
    # Create a mapping of student_id to attendance status
    attendance_map = {att.student_id: att.status for att in existing_attendance}
    
    students_data = []
    for student in students:
        current_status = attendance_map.get(student.id, 'absent')
        students_data.append({
            'id': student.id,
            'student_id': student.student_id,
            'name': student.get_full_name(),
            'photo': student.photo.url if student.photo else None,
            'current_status': current_status
        })
    
    return Response({
        'class': {
            'id': cls.id,
            'name': str(cls),
            'level': cls.get_level_display()
        },
        'date': selected_date.isoformat(),
        'students': students_data,
        'attendance_already_taken': len(attendance_map) > 0
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def teacher_attendance_save(request):
    """Save attendance for a class"""
    class_id = request.data.get('class_id')
    date_str = request.data.get('date', str(date.today()))
    attendance_data = request.data.get('attendance', [])
    
    if not class_id or not attendance_data:
        return Response({
            'error': 'class_id and attendance data are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    selected_date = parse_date(date_str) or date.today()
    
    try:
        cls = Class.objects.get(
            id=class_id,
            class_teacher=request.user,
            school=request.user.school
        )
    except Class.DoesNotExist:
        return Response({
            'error': 'Class not found or not assigned to you'
        }, status=status.HTTP_404_NOT_FOUND)
    
    saved_count = 0
    updated_count = 0
    daily_fee_count = 0
    daily_fee_total = 0
    errors = []
    
    for item in attendance_data:
        student_id = item.get('student_id')
        status_value = item.get('status', 'absent')
        
        if not student_id:
            errors.append('Missing student_id in attendance data')
            continue
        
        try:
            student = Student.objects.get(
                id=student_id,
                current_class=cls,
                is_active=True
            )
            
            # Create or update attendance record
            attendance, created = DailyAttendance.objects.update_or_create(
                student=student,
                class_instance=cls,
                date=selected_date,
                defaults={
                    'status': status_value,
                    'marked_by': request.user
                }
            )

            if status_value in ('present', 'late'):
                recorded_amount = _auto_record_daily_fee(
                    student,
                    selected_date,
                    request.user,
                )
                if recorded_amount > 0:
                    daily_fee_count += 1
                    daily_fee_total += recorded_amount
            
            if created:
                saved_count += 1
            else:
                updated_count += 1
                
        except Student.DoesNotExist:
            errors.append(f'Student with ID {student_id} not found in class')
            continue
        except Exception as e:
            errors.append(f'Error saving attendance for student {student_id}: {str(e)}')
            continue
    
    return Response({
        'message': 'Attendance saved successfully',
        'saved_count': saved_count,
        'updated_count': updated_count,
        'total_processed': saved_count + updated_count,
        'daily_fee_count': daily_fee_count,
        'daily_fee_total': float(daily_fee_total),
        'errors': errors
    })