from django.db import models
from students.models import Student
from schools.models import Term, Class


class StudentRiskProfile(models.Model):
    RISK_LEVELS = [
        ('HIGH', 'High'),
        ('MEDIUM', 'Medium'),
        ('LOW', 'Low'),
        ('EXCELLING', 'Excelling'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='risk_profiles')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='risk_profiles')
    risk_level = models.CharField(max_length=10, choices=RISK_LEVELS, default='LOW')
    attendance_score = models.FloatField(default=100.0)
    academic_score = models.FloatField(default=100.0)
    fee_score = models.FloatField(default=100.0)
    risk_factors = models.JSONField(default=list)
    recommendations = models.JSONField(default=list)
    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_student_risk_profiles'
        unique_together = ['student', 'term']
        ordering = ['-calculated_at']

    def __str__(self):
        return f"{self.student} — {self.term} — {self.risk_level}"


class AttendanceInsight(models.Model):
    PATTERN_TYPES = [
        ('REGULAR_ABSENCE', 'Regular Absence'),
        ('DECLINING', 'Declining'),
        ('IMPROVING', 'Improving'),
        ('CONSISTENT', 'Consistent'),
    ]
    TREND_CHOICES = [('IMPROVING', 'Improving'), ('DECLINING', 'Declining'), ('STABLE', 'Stable')]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_insights')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='attendance_insights')
    pattern_type = models.CharField(max_length=20, choices=PATTERN_TYPES, default='CONSISTENT')
    absent_day = models.CharField(max_length=10, blank=True, null=True)
    trend = models.CharField(max_length=10, choices=TREND_CHOICES, default='STABLE')
    consecutive_absences = models.IntegerField(default=0)
    late_count = models.IntegerField(default=0)
    alert_needed = models.BooleanField(default=False)
    analysed_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_attendance_insights'
        unique_together = ['student', 'term']

    def __str__(self):
        return f"{self.student} — {self.term} — {self.pattern_type}"


class AcademicTrend(models.Model):
    TREND_CHOICES = [('IMPROVING', 'Improving'), ('DECLINING', 'Declining'), ('STABLE', 'Stable')]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='academic_trends')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='academic_trends')
    overall_trend = models.CharField(max_length=10, choices=TREND_CHOICES, default='STABLE')
    percentage_change = models.FloatField(default=0.0)
    best_subject = models.CharField(max_length=100, blank=True, null=True)
    worst_subject = models.CharField(max_length=100, blank=True, null=True)
    subjects_declined = models.JSONField(default=list)
    subjects_improved = models.JSONField(default=list)
    alert_needed = models.BooleanField(default=False)
    alert_reason = models.TextField(blank=True, null=True)
    analysed_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_academic_trends'
        unique_together = ['student', 'term']

    def __str__(self):
        return f"{self.student} — {self.term} — {self.overall_trend}"


class AIGeneratedReport(models.Model):
    REPORT_TYPES = [
        ('STUDENT_REPORT', 'Student Report'),
        ('LESSON_PLAN', 'Lesson Plan'),
        ('CLASS_INSIGHTS', 'Class Insights'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, null=True, blank=True, related_name='ai_reports')
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, null=True, blank=True, related_name='ai_reports')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='ai_reports')
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    content = models.TextField()
    metadata = models.JSONField(default=dict)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_ai_generated_reports'
        ordering = ['-generated_at']

    def __str__(self):
        target = self.student or self.class_obj
        return f"{self.report_type} — {target} — {self.term}"


class SmartSMSLog(models.Model):
    ALERT_TYPES = [
        ('ATTENDANCE_LOW', 'Attendance Low'),
        ('EXAM_POOR', 'Exam Poor'),
        ('FEE_REMINDER', 'Fee Reminder'),
        ('RISK_ALERT', 'Risk Alert'),
        ('POSITIVE_FEEDBACK', 'Positive Feedback'),
    ]
    STATUS_CHOICES = [('SENT', 'Sent'), ('FAILED', 'Failed'), ('PENDING', 'Pending')]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='smart_sms_logs')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='smart_sms_logs')
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    message = models.CharField(max_length=160)
    recipient_phone = models.CharField(max_length=20)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_smart_sms_logs'
        ordering = ['-sent_at']

    def __str__(self):
        return f"{self.alert_type} → {self.student} ({self.status})"
