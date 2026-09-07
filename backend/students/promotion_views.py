from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import Student, StudentPromotion
from schools.models import Class, Term, AcademicYear
from .promotion_serializers import (
    BulkClassPromotionSerializer, SelectivePromotionSerializer, 
    PromotionPreviewSerializer, PromotionSummarySerializer
)
try:
    from scores.models import SubjectResult
except ImportError:
    SubjectResult = None


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def promote_class_bulk(request):
    """
    Promote entire class to next level after third term completion
    """
    user = request.user
    if not user.school or user.role not in ['SCHOOL_ADMIN', 'PRINCIPAL']:
        return Response(
            {'error': 'Only school admins can perform bulk class promotions'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Validate input data
    serializer = BulkClassPromotionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    validated_data = serializer.validated_data
    from_class_id = validated_data['from_class_id']
    to_class_id = validated_data.get('to_class_id')
    academic_year_id = validated_data['academic_year_id']
    force_promotion = validated_data['force_promotion']
    
    try:
        from_class = Class.objects.get(id=from_class_id, school=user.school)
        academic_year = AcademicYear.objects.get(id=academic_year_id, school=user.school)
    except (Class.DoesNotExist, AcademicYear.DoesNotExist):
        return Response(
            {'error': 'Invalid class or academic year'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate third term completion
    if not force_promotion:
        third_term = Term.objects.filter(
            academic_year=academic_year, 
            name='THIRD'
        ).first()
        
        if not third_term or third_term.end_date > timezone.now().date():
            return Response(
                {'error': 'Third term must be completed before promotion. Use force_promotion=true to override.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Auto-determine next class if not provided
    if not to_class_id:
        to_class = _get_next_class(from_class, user.school)
        if not to_class:
            return Response(
                {'error': f'Cannot determine next class for {from_class}. Please specify to_class_id.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        try:
            to_class = Class.objects.get(id=to_class_id, school=user.school)
        except Class.DoesNotExist:
            return Response(
                {'error': 'Invalid destination class'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Get eligible students
    students = Student.objects.filter(
        current_class=from_class, 
        is_active=True,
        school=user.school
    )
    
    if not students.exists():
        return Response(
            {'error': 'No active students found in the specified class'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    promoted_students = []
    failed_students = []
    
    with transaction.atomic():
        for student in students:
            try:
                # Check promotion eligibility
                if not force_promotion:
                    eligible, reason = _check_promotion_eligibility(student, academic_year)
                    if not eligible:
                        failed_students.append({
                            'student_id': student.student_id,
                            'name': student.get_full_name(),
                            'reason': reason
                        })
                        continue
                
                # Create promotion record
                promotion = StudentPromotion.objects.create(
                    student=student,
                    from_class=from_class,
                    to_class=to_class,
                    academic_year=academic_year,
                    is_graduated=_is_graduation_class(from_class),
                    remarks=f"Promoted from {from_class} to {to_class} after completing {academic_year.name}"
                )
                
                # Update student's current class (only if not graduating)
                if not promotion.is_graduated:
                    student.current_class = to_class
                    student.save(update_fields=['current_class'])
                
                promoted_students.append({
                    'student_id': student.student_id,
                    'name': student.get_full_name(),
                    'from_class': str(from_class),
                    'to_class': str(to_class) if not promotion.is_graduated else 'GRADUATED',
                    'promotion_id': promotion.id
                })
                
            except Exception as e:
                failed_students.append({
                    'student_id': student.student_id,
                    'name': student.get_full_name(),
                    'reason': f'Error: {str(e)}'
                })
    
    return Response({
        'message': f'Promotion completed for {len(promoted_students)} students',
        'promoted_students': promoted_students,
        'failed_students': failed_students,
        'summary': {
            'total_students': len(students),
            'promoted_count': len(promoted_students),
            'failed_count': len(failed_students),
            'from_class': str(from_class),
            'to_class': str(to_class),
            'academic_year': academic_year.name
        }
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def promote_students_selective(request):
    """
    Promote selected students to a specific class
    """
    user = request.user
    if not user.school or user.role not in ['SCHOOL_ADMIN', 'PRINCIPAL']:
        return Response(
            {'error': 'Only school admins can perform student promotions'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Validate input data
    serializer = SelectivePromotionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    validated_data = serializer.validated_data
    student_ids = validated_data['student_ids']
    to_class_id = validated_data['to_class_id']
    academic_year_id = validated_data['academic_year_id']
    remarks = validated_data.get('remarks', '')
    force_promotion = validated_data['force_promotion']
    
    try:
        to_class = Class.objects.get(id=to_class_id, school=user.school)
        academic_year = AcademicYear.objects.get(id=academic_year_id, school=user.school)
    except (Class.DoesNotExist, AcademicYear.DoesNotExist):
        return Response(
            {'error': 'Invalid class or academic year'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    promoted_students = []
    failed_students = []
    
    with transaction.atomic():
        for student_id in student_ids:
            try:
                student = Student.objects.get(id=student_id, school=user.school)
                from_class = student.current_class
                
                # Check promotion eligibility
                if not force_promotion:
                    eligible, reason = _check_promotion_eligibility(student, academic_year)
                    if not eligible:
                        failed_students.append({
                            'student_id': student.student_id,
                            'name': student.get_full_name(),
                            'reason': reason
                        })
                        continue
                
                # Create promotion record
                promotion = StudentPromotion.objects.create(
                    student=student,
                    from_class=from_class,
                    to_class=to_class,
                    academic_year=academic_year,
                    is_graduated=_is_graduation_class(to_class),
                    remarks=remarks or f"Special promotion from {from_class} to {to_class}"
                )
                
                # Update student's current class
                if not promotion.is_graduated:
                    student.current_class = to_class
                    student.save(update_fields=['current_class'])
                
                promoted_students.append({
                    'student_id': student.student_id,
                    'name': student.get_full_name(),
                    'from_class': str(from_class) if from_class else 'No Class',
                    'to_class': str(to_class) if not promotion.is_graduated else 'GRADUATED',
                    'promotion_id': promotion.id
                })
                
            except Student.DoesNotExist:
                failed_students.append({
                    'student_id': student_id,
                    'name': 'Unknown',
                    'reason': 'Student not found'
                })
            except Exception as e:
                failed_students.append({
                    'student_id': student_id,
                    'name': 'Unknown',
                    'reason': f'Error: {str(e)}'
                })
    
    return Response({
        'message': f'Promotion completed for {len(promoted_students)} students',
        'promoted_students': promoted_students,
        'failed_students': failed_students,
        'summary': {
            'promoted_count': len(promoted_students),
            'failed_count': len(failed_students),
            'to_class': str(to_class),
            'academic_year': academic_year.name
        }
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_promotion_preview(request):
    """
    Preview students eligible for promotion from a class
    """
    user = request.user
    if not user.school:
        return Response(
            {'error': 'User not associated with a school'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    class_id = request.query_params.get('class_id')
    academic_year_id = request.query_params.get('academic_year_id')
    
    if not class_id or not academic_year_id:
        return Response(
            {'error': 'class_id and academic_year_id are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        class_obj = Class.objects.get(id=class_id, school=user.school)
        academic_year = AcademicYear.objects.get(id=academic_year_id, school=user.school)
    except (Class.DoesNotExist, AcademicYear.DoesNotExist):
        return Response(
            {'error': 'Invalid class or academic year'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    students = Student.objects.filter(
        current_class=class_obj, 
        is_active=True,
        school=user.school
    )
    
    eligible_students = []
    ineligible_students = []
    next_class = _get_next_class(class_obj, user.school)
    
    for student in students:
        eligible, reason = _check_promotion_eligibility(student, academic_year)
        student_data = {
            'id': student.id,
            'student_id': student.student_id,
            'name': student.get_full_name(),
            'current_class': str(class_obj),
            'next_class': str(next_class) if next_class else 'GRADUATION'
        }
        
        if eligible:
            eligible_students.append(student_data)
        else:
            student_data['reason'] = reason
            ineligible_students.append(student_data)
    
    return Response({
        'class_info': {
            'id': class_obj.id,
            'name': str(class_obj),
            'next_class': str(next_class) if next_class else 'GRADUATION',
            'is_graduation_class': _is_graduation_class(class_obj)
        },
        'academic_year': academic_year.name,
        'eligible_students': eligible_students,
        'ineligible_students': ineligible_students,
        'summary': {
            'total_students': len(students),
            'eligible_count': len(eligible_students),
            'ineligible_count': len(ineligible_students)
        }
    })


def _get_next_class(current_class, school):
    """
    Determine the next class in progression
    """
    level_progression = {
        'NURSERY': 'KG1',
        'KG1': 'KG2',
        'KG2': 'BASIC_1',
        'BASIC_1': 'BASIC_2',
        'BASIC_2': 'BASIC_3',
        'BASIC_3': 'BASIC_4',
        'BASIC_4': 'BASIC_5',
        'BASIC_5': 'BASIC_6',
        'BASIC_6': 'BASIC_7',
        'BASIC_7': 'BASIC_8',
        'BASIC_8': 'BASIC_9',
        'BASIC_9': None  # Graduation
    }
    
    next_level = level_progression.get(current_class.level)
    if not next_level:
        return None  # Graduation class
    
    # Find next class with same section or default section
    next_class = Class.objects.filter(
        school=school,
        level=next_level,
        section=current_class.section
    ).first()
    
    if not next_class:
        # Try without section match
        next_class = Class.objects.filter(
            school=school,
            level=next_level
        ).first()
    
    return next_class


def _check_promotion_eligibility(student, academic_year):
    """
    Check if student is eligible for promotion
    """
    try:
        # Check attendance requirement (minimum 75%)
        from students.models import Attendance
        attendance_records = Attendance.objects.filter(
            student=student,
            term__academic_year=academic_year
        )
        
        total_present = sum(record.days_present for record in attendance_records)
        total_days = sum(record.total_days for record in attendance_records)
        
        if total_days > 0:
            attendance_rate = (total_present / total_days) * 100
            if attendance_rate < 75:
                return False, f"Poor attendance: {attendance_rate:.1f}% (minimum 75% required)"
        
        # Check academic performance (minimum average of 50%)
        try:
            subject_results = SubjectResult.objects.filter(
                student=student,
                term__academic_year=academic_year
            )
            
            if subject_results.exists():
                total_score = sum(
                    float(result.total_score) for result in subject_results 
                    if result.total_score is not None
                )
                subject_count = subject_results.count()
                
                if subject_count > 0:
                    average_score = total_score / subject_count
                    if average_score < 50:
                        return False, f"Poor academic performance: {average_score:.1f}% average (minimum 50% required)"
        except:
            # If scores module doesn't exist, skip academic check
            pass
        
        return True, "Eligible for promotion"
        
    except Exception as e:
        return False, f"Error checking eligibility: {str(e)}"


def _is_graduation_class(class_obj):
    """
    Check if this is a graduation class (Basic 9)
    """
    return class_obj.level == 'BASIC_9'