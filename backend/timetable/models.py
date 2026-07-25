import os
from datetime import timedelta

from django.db import models
from django.conf import settings
from django.utils import timezone
from schools.models import Class, ClassSubject


class LessonSlot(models.Model):
    DAY_CHOICES = [
        ('MON', 'Monday'),
        ('TUE', 'Tuesday'),
        ('WED', 'Wednesday'),
        ('THU', 'Thursday'),
        ('FRI', 'Friday'),
    ]

    class_instance = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='lesson_slots')
    class_subject  = models.ForeignKey(ClassSubject, on_delete=models.CASCADE, related_name='lesson_slots')
    day            = models.CharField(max_length=3, choices=DAY_CHOICES)
    start_time     = models.TimeField()
    end_time       = models.TimeField()
    room           = models.CharField(max_length=100, blank=True, default='')
    notes          = models.CharField(max_length=255, blank=True, default='')
    created_by     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lesson_slots'
        ordering = ['day', 'start_time']

    def __str__(self):
        return f"{self.class_instance} | {self.get_day_display()} {self.start_time:%H:%M} — {self.class_subject.subject.name}"


class LessonResource(models.Model):
    RESOURCE_TYPE_CHOICES = [
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('image', 'Image'),
        ('document', 'Document'),
        ('file', 'File'),
    ]

    slot = models.ForeignKey(LessonSlot, on_delete=models.CASCADE, related_name='resources', null=True, blank=True)
    class_instance = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='lesson_resources', null=True, blank=True)
    title = models.CharField(max_length=200, blank=True)
    description = models.CharField(max_length=255, blank=True)
    file = models.FileField(upload_to='lesson_resources/%Y/%m/%d/')
    original_filename = models.CharField(max_length=255, blank=True)
    content_type = models.CharField(max_length=100, blank=True)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPE_CHOICES, default='file')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'lesson_resources'
        ordering = ['-uploaded_at']

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        if self.file and not self.original_filename:
            self.original_filename = os.path.basename(self.file.name)
        if self.file and getattr(self.file, 'content_type', None):
            self.content_type = self.file.content_type

        if self.file and self.resource_type in ['', 'file']:
            content_type = (self.content_type or '').lower()
            ext = os.path.splitext(self.original_filename or self.file.name)[1].lower()
            if content_type.startswith('video/') or ext in ['.mp4', '.mov', '.avi', '.mkv', '.webm']:
                self.resource_type = 'video'
            elif content_type.startswith('audio/') or ext in ['.mp3', '.wav', '.m4a', '.ogg', '.flac']:
                self.resource_type = 'audio'
            elif content_type.startswith('image/') or ext in ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp', '.webp']:
                self.resource_type = 'image'
            elif content_type in [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain',
                'text/csv',
                'application/zip',
            ] or ext in ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.zip']:
                self.resource_type = 'document'
            else:
                self.resource_type = 'file'

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title or self.original_filename or f'Resource {self.pk}'
