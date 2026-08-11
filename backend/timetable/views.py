from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from schools.models import Class, ClassSubject
from students.models import Student
from .models import LessonSlot, LessonResource
from django.core.files.storage import default_storage
from django.http import FileResponse, HttpResponse


# ── helpers ──────────────────────────────────────────────────────────────────

def _resource_data(resource, request=None):
    url = getattr(resource.file, 'url', '') or ''
    if url and url.startswith('/') and request is not None:
        url = request.build_absolute_uri(url)
    return {
        'id': resource.id,
        'title': resource.title,
        'description': resource.description,
        'url': url,
        'original_filename': resource.original_filename,
        'content_type': resource.content_type,
        'resource_type': resource.resource_type,
        'uploaded_at': resource.uploaded_at,
        'expires_at': resource.expires_at,
    }


def _resource_owner_class(resource):
    if resource.class_instance_id:
        return resource.class_instance
    if resource.slot_id:
        return getattr(resource.slot, 'class_instance', None)
    return None


def _user_can_manage_resource(user, resource):
    cls = _resource_owner_class(resource)
    if not cls:
        return False
    if cls.class_teacher_id == user.id:
        return True
    return ClassSubject.objects.filter(teacher=user, class_instance=cls).exists()


def _student_has_access(user, resource):
    """Check if a student has access to a resource (class or slot level)."""
    cls = _resource_owner_class(resource)
    if not cls:
        return False
    try:
        student = Student.objects.get(user=user)
        return student.current_class_id == cls.id
    except Student.DoesNotExist:
        return False


def _slot_data(slot, request=None):
    from datetime import time as time_type
    def fmt_time(t):
        if isinstance(t, time_type):
            return t.strftime('%H:%M')
        # already a string like "09:00" or "09:00:00"
        return str(t)[:5]
    resources = []
    try:
        for r in slot.resources.all():
            resources.append(_resource_data(r, request=request))
    except Exception:
        resources = []

    return {
        'id':         slot.id,
        'day':        slot.day,
        'day_label':  slot.get_day_display(),
        'start_time': fmt_time(slot.start_time),
        'end_time':   fmt_time(slot.end_time),
        'subject':    slot.class_subject.subject.name,
        'subject_id': slot.class_subject.subject.id,
        'teacher':    slot.class_subject.teacher.get_full_name() if slot.class_subject.teacher else None,
        'room':       slot.room,
        'notes':      slot.notes,
        'resources':  resources,
    }


DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI']


def _group_by_day(slots_qs, request=None):
    grouped = {d: [] for d in DAY_ORDER}
    for slot in slots_qs.select_related('class_subject__subject', 'class_subject__teacher'):
        grouped[slot.day].append(_slot_data(slot, request=request))
    return [{'day': d, 'day_label': dict(LessonSlot.DAY_CHOICES)[d], 'slots': grouped[d]}
            for d in DAY_ORDER]


# ── Teacher ViewSet ───────────────────────────────────────────────────────────

class TeacherTimetableViewSet(viewsets.ViewSet):
    """Teacher manages timetable for their class(es)."""
    permission_classes = [IsAuthenticated]

    def _get_class(self, request, class_id):
        try:
            return Class.objects.get(id=class_id, class_teacher=request.user, school=request.user.school)
        except Class.DoesNotExist:
            return None

    def _get_teacher_classes(self, request):
        """Return all classes this teacher is either class teacher of or teaches a subject in."""
        school = request.user.school
        class_teacher_ids = Class.objects.filter(
            class_teacher=request.user, school=school
        ).values_list('id', flat=True)
        subject_teacher_ids = ClassSubject.objects.filter(
            teacher=request.user, class_instance__school=school
        ).values_list('class_instance_id', flat=True)
        all_ids = set(list(class_teacher_ids) + list(subject_teacher_ids))
        return Class.objects.filter(id__in=all_ids)

    def list(self, request):
        """GET /api/timetable/teacher/?class_id=<id>"""
        class_id = request.query_params.get('class_id')
        if not class_id:
            classes = self._get_teacher_classes(request)
            return Response([{'id': c.id, 'name': str(c)} for c in classes])

        cls = self._get_class(request, class_id)
        if not cls:
            # Also allow subject teachers to view the timetable
            try:
                cls = Class.objects.get(id=class_id, school=request.user.school)
                if not ClassSubject.objects.filter(teacher=request.user, class_instance=cls).exists():
                    return Response({'error': 'Class not found or not assigned to you'}, status=404)
            except Class.DoesNotExist:
                return Response({'error': 'Class not found or not assigned to you'}, status=404)

        slots = LessonSlot.objects.filter(class_instance=cls)
        class_resources = LessonResource.objects.filter(class_instance=cls)
        return Response({
            'class': {'id': cls.id, 'name': str(cls)},
            'timetable': _group_by_day(slots, request=request),
            'class_resources': [_resource_data(r, request=request) for r in class_resources],
        })

    @action(detail=False, methods=['get'], url_path='class-subjects')
    def class_subjects(self, request):
        """GET /api/timetable/teacher/class-subjects/?class_id=<id>
        Returns all subjects for a class — used to populate the Add Slot form.
        """
        class_id = request.query_params.get('class_id')
        if not class_id:
            return Response({'error': 'class_id is required'}, status=400)
        if not getattr(request.user, 'school', None):
            return Response({'error': 'User is not associated with a school'}, status=400)
        try:
            cls = Class.objects.get(id=class_id, school=request.user.school)
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=404)
        subjects = ClassSubject.objects.filter(class_instance=cls).select_related('subject', 'teacher')
        return Response([{
            'id': cs.id,
            'subject_name': cs.subject.name,
            'teacher_name': cs.teacher.get_full_name() if cs.teacher else None,
        } for cs in subjects])

    def create(self, request):
        """POST /api/timetable/teacher/ — add a lesson slot"""
        class_id         = request.data.get('class_id')
        class_subject_id = request.data.get('class_subject_id')
        day              = request.data.get('day')
        start_time       = request.data.get('start_time')
        end_time         = request.data.get('end_time')
        room             = request.data.get('room', '')
        notes            = request.data.get('notes', '')

        if not all([class_id, class_subject_id, day, start_time, end_time]):
            return Response({'error': 'class_id, class_subject_id, day, start_time, end_time are required'}, status=400)

        if not getattr(request.user, 'school', None):
            return Response({'error': 'User is not associated with a school'}, status=400)

        # Allow both class teachers and subject teachers to add slots
        try:
            cls = Class.objects.get(id=class_id, school=request.user.school)
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=404)

        is_class_teacher = cls.class_teacher_id == request.user.id
        is_subject_teacher = ClassSubject.objects.filter(teacher=request.user, class_instance=cls).exists()
        if not (is_class_teacher or is_subject_teacher):
            return Response({'error': 'Class not found or not assigned to you'}, status=404)

        try:
            cs = ClassSubject.objects.get(id=class_subject_id, class_instance=cls)
        except ClassSubject.DoesNotExist:
            return Response({'error': 'Subject not found in this class'}, status=404)

        slot = LessonSlot.objects.create(
            class_instance=cls,
            class_subject=cs,
            day=day,
            start_time=start_time,
            end_time=end_time,
            room=room,
            notes=notes,
            created_by=request.user,
        )

        # Notify all students in the class
        try:
            from notifications.views import create_notification
            from students.models import Student
            day_label = dict(LessonSlot.DAY_CHOICES).get(day, day)
            students = Student.objects.filter(current_class=cls, is_active=True).select_related('user')
            for student in students:
                create_notification(
                    user=student.user,
                    title=f'New Lesson: {cs.subject.name}',
                    message=f'A new lesson slot has been added — {cs.subject.name} on {day_label} at {start_time}.',
                    notification_type='general',
                    activity_type='lesson_added',
                    class_name=str(cls),
                    teacher_name=request.user.get_full_name(),
                    class_id=cls.id,
                )
        except Exception:
            pass

        return Response(_slot_data(slot), status=201)

    @action(detail=True, methods=['post'], url_path='upload_resource')
    def upload_resource(self, request, pk=None):
        """POST /api/timetable/teacher/<slot_id>/upload_resource/ — upload a lesson resource (file/video)"""
        try:
            slot = LessonSlot.objects.select_related('class_instance').get(pk=pk)
        except LessonSlot.DoesNotExist:
            return Response({'error': 'Slot not found'}, status=404)

        cls = slot.class_instance
        is_class_teacher = cls.class_teacher == request.user
        is_subject_teacher = ClassSubject.objects.filter(teacher=request.user, class_instance=cls).exists()
        if not (is_class_teacher or is_subject_teacher):
            return Response({'error': 'Permission denied'}, status=403)

        upload = request.FILES.get('file')
        if not upload:
            return Response({'error': 'No file provided'}, status=400)

        title = request.data.get('title', '')
        description = request.data.get('description', '')

        try:
            resource = LessonResource(
                slot=slot,
                title=title,
                description=description,
                file=upload,
                uploaded_by=request.user
            )
            resource.save()

            students = Student.objects.filter(current_class=cls, is_active=True).select_related('user')
            for student in students:
                try:
                    from notifications.utils import create_notification
                    create_notification(
                        user=student.user,
                        title=f'New lesson resource for {cls}',
                        message=f'{request.user.get_full_name()} uploaded "{resource.title or resource.original_filename}" for {slot.subject}.',
                        notification_type='general',
                        activity_type='resource_uploaded',
                        class_name=str(cls),
                        teacher_name=request.user.get_full_name(),
                        class_id=cls.id,
                        url=f'/student/lessons?class_id={cls.id}',
                    )
                except Exception:
                    pass

            url = getattr(resource.file, 'url', '') or ''
            if url.startswith('/'):
                url = request.build_absolute_uri(url)

            return Response({
                'id': resource.id,
                'title': resource.title,
                'description': resource.description,
                'url': url,
                'original_filename': resource.original_filename,
                'content_type': resource.content_type,
                'resource_type': resource.resource_type,
                'uploaded_at': resource.uploaded_at,
                'expires_at': resource.expires_at,
            }, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'], url_path='upload_to_class')
    def upload_to_class(self, request):
        """POST /api/timetable/teacher/upload_to_class/ — upload a resource directly to a class (no slot)"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"[UPLOAD] upload_to_class called by {request.user}. data keys: {list(request.data.keys())}. files: {list(request.FILES.keys())}")

        class_id = request.data.get('class_id')
        if not class_id:
            logger.warning(f"[UPLOAD] Missing class_id. data={dict(request.data)}")
            return Response({'error': 'class_id is required'}, status=400)

        try:
            cls = Class.objects.get(id=class_id, school=request.user.school)
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=404)

        is_class_teacher = cls.class_teacher_id == request.user.id
        is_subject_teacher = ClassSubject.objects.filter(teacher=request.user, class_instance=cls).exists()
        if not (is_class_teacher or is_subject_teacher):
            return Response({'error': 'Permission denied'}, status=403)

        upload = request.FILES.get('file')
        if not upload:
            return Response({'error': 'No file provided'}, status=400)

        title = request.data.get('title', '')
        description = request.data.get('description', '')

        try:
            resource = LessonResource(
                class_instance=cls,
                title=title,
                description=description,
                file=upload,
                uploaded_by=request.user
            )
            resource.save()

            students = Student.objects.filter(current_class=cls, is_active=True).select_related('user')
            for student in students:
                try:
                    from notifications.utils import create_notification
                    create_notification(
                        user=student.user,
                        title=f'New class resource for {cls}',
                        message=f'{request.user.get_full_name()} uploaded "{resource.title or resource.original_filename}" for your class.',
                        notification_type='general',
                        activity_type='resource_uploaded',
                        class_name=str(cls),
                        teacher_name=request.user.get_full_name(),
                        class_id=cls.id,
                        url=f'/student/lessons?class_id={cls.id}',
                    )
                except Exception:
                    pass

            url = getattr(resource.file, 'url', '') or ''
            if url.startswith('/'):
                url = request.build_absolute_uri(url)

            return Response({
                'id': resource.id,
                'title': resource.title,
                'description': resource.description,
                'url': url,
                'original_filename': resource.original_filename,
                'content_type': resource.content_type,
                'resource_type': resource.resource_type,
                'uploaded_at': resource.uploaded_at,
                'expires_at': resource.expires_at,
            }, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    def update(self, request, pk=None):
        """PUT /api/timetable/teacher/<id>/"""
        try:
            slot = LessonSlot.objects.select_related('class_instance').get(pk=pk)
        except LessonSlot.DoesNotExist:
            return Response({'error': 'Slot not found'}, status=404)

        cls = slot.class_instance
        is_class_teacher = cls.class_teacher == request.user
        is_subject_teacher = ClassSubject.objects.filter(teacher=request.user, class_instance=cls).exists()
        if not (is_class_teacher or is_subject_teacher):
            return Response({'error': 'Permission denied'}, status=403)

        for field in ('day', 'start_time', 'end_time', 'room', 'notes'):
            if field in request.data:
                setattr(slot, field, request.data[field])

        if 'class_subject_id' in request.data:
            try:
                cs = ClassSubject.objects.get(id=request.data['class_subject_id'], class_instance=slot.class_instance)
                slot.class_subject = cs
            except ClassSubject.DoesNotExist:
                return Response({'error': 'Subject not found in this class'}, status=404)

        slot.save()
        return Response(_slot_data(slot))

    def destroy(self, request, pk=None):
        """DELETE /api/timetable/teacher/<id>/"""
        try:
            slot = LessonSlot.objects.select_related('class_instance').get(pk=pk)
        except LessonSlot.DoesNotExist:
            return Response({'error': 'Slot not found'}, status=404)

        cls = slot.class_instance
        is_class_teacher = cls.class_teacher == request.user
        is_subject_teacher = ClassSubject.objects.filter(teacher=request.user, class_instance=cls).exists()
        if not (is_class_teacher or is_subject_teacher):
            return Response({'error': 'Permission denied'}, status=403)

        slot.delete()
        return Response(status=204)


class LessonResourceViewSet(viewsets.ViewSet):
    """Teacher-managed lesson resource details."""
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, pk=None):
        try:
            resource = LessonResource.objects.select_related('class_instance', 'slot__class_instance').get(pk=pk)
        except LessonResource.DoesNotExist:
            return Response({'error': 'Resource not found'}, status=404)

        if not _user_can_manage_resource(request.user, resource):
            return Response({'error': 'Permission denied'}, status=403)

        return Response(_resource_data(resource, request=request))

    def destroy(self, request, pk=None):
        try:
            resource = LessonResource.objects.select_related('class_instance', 'slot__class_instance').get(pk=pk)
        except LessonResource.DoesNotExist:
            return Response({'error': 'Resource not found'}, status=404)

        if not _user_can_manage_resource(request.user, resource):
            return Response({'error': 'Permission denied'}, status=403)

        try:
            if resource.file and default_storage.exists(resource.file.name):
                default_storage.delete(resource.file.name)
        except Exception:
            pass

        resource.delete()
        return Response(status=204)

    def update(self, request, pk=None):
        try:
            resource = LessonResource.objects.select_related('class_instance', 'slot__class_instance').get(pk=pk)
        except LessonResource.DoesNotExist:
            return Response({'error': 'Resource not found'}, status=404)

        if not _user_can_manage_resource(request.user, resource):
            return Response({'error': 'Permission denied'}, status=403)

        file_upload = request.FILES.get('file')
        if file_upload:
            try:
                if resource.file and default_storage.exists(resource.file.name):
                    default_storage.delete(resource.file.name)
            except Exception:
                pass
            resource.file = file_upload

        if 'title' in request.data:
            resource.title = request.data.get('title', resource.title)
        if 'description' in request.data:
            resource.description = request.data.get('description', resource.description)

        resource.save()

        return Response(_resource_data(resource, request=request))

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        import logging
        from django.shortcuts import redirect
        logger = logging.getLogger(__name__)

        try:
            resource = LessonResource.objects.select_related('class_instance', 'slot__class_instance').get(pk=pk)
        except LessonResource.DoesNotExist:
            return Response({'error': 'Resource not found'}, status=404)

        if not _user_can_manage_resource(request.user, resource):
            if not _student_has_access(request.user, resource):
                return Response({'error': 'Permission denied'}, status=403)

        if not resource.file:
            return Response({'error': 'File not found'}, status=404)

        try:
            # For cloud storage (Cloudinary etc.) redirect to the file URL directly
            url = getattr(resource.file, 'url', None)
            if url:
                return redirect(url)
            # Fallback: stream file content (local storage)
            file_content = resource.file.read()
            response = HttpResponse(
                file_content,
                content_type=resource.content_type or 'application/octet-stream'
            )
            filename = resource.original_filename.replace('"', '')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            logger.exception(f"[DOWNLOAD] Error downloading resource {pk}: {str(e)}")
            return Response({'error': f'Failed to download file: {str(e)}'}, status=500)



# ── Student ViewSet ───────────────────────────────────────────────────────────

class StudentTimetableViewSet(viewsets.ViewSet):
    """Student reads their class timetable."""
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """GET /api/timetable/student/"""
        try:
            student = Student.objects.select_related('current_class').get(user=request.user)
        except Student.DoesNotExist:
            return Response({'error': 'Student profile not found'}, status=404)

        if not student.current_class:
            return Response({'class': None, 'timetable': [], 'subjects': []})

        cls = student.current_class
        slots = LessonSlot.objects.filter(class_instance=cls)

        # Also return subjects list for the "My Subjects" section
        from schools.models import ClassSubject
        class_subjects = ClassSubject.objects.filter(
            class_instance=cls
        ).select_related('subject', 'teacher').order_by('subject__name')

        subjects = [{
            'id':       cs.id,
            'subject':  cs.subject.name,
            'code':     cs.subject.code,
            'teacher':  cs.teacher.get_full_name() if cs.teacher else None,
        } for cs in class_subjects]

        class_resources = LessonResource.objects.filter(class_instance=cls)
        return Response({
            'class': {
                'name':         str(cls),
                'level':        cls.get_level_display(),
                'class_teacher': cls.class_teacher.get_full_name() if cls.class_teacher else None,
            },
            'timetable': _group_by_day(slots, request=request),
            'class_resources': [_resource_data(r, request=request) for r in class_resources],
            'subjects':  subjects,
        })
