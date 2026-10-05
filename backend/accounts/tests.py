from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from schools.models import AcademicYear, Class, School, Term
from students.models import DailyAttendance, Student


class AdminDashboardAttendanceTests(TestCase):
    def setUp(self):
        self.today = timezone.localdate()
        self.school = self.create_school('Dashboard School', 'dashboard@example.edu')
        self.admin = get_user_model().objects.create_user(
            email='admin@example.edu',
            password='secret123',
            first_name='School',
            last_name='Admin',
            role='SCHOOL_ADMIN',
            school=self.school,
        )
        self.class_room = Class.objects.create(
            school=self.school,
            level='BASIC_1',
            section='A',
        )
        academic_year = AcademicYear.objects.create(
            school=self.school,
            name='2026/2027',
            start_date=self.today - timedelta(days=30),
            end_date=self.today + timedelta(days=300),
            is_current=True,
        )
        Term.objects.create(
            academic_year=academic_year,
            name='FIRST',
            start_date=self.today - timedelta(days=10),
            end_date=self.today + timedelta(days=90),
            is_current=True,
        )

    def create_school(self, name, email):
        return School.objects.create(
            name=name,
            address='Test address',
            location='Test location',
            phone_number='0200000000',
            email=email,
        )

    def create_student(self, school, class_room, student_id):
        student = Student(
            school=school,
            student_id=student_id,
            first_name='Test',
            last_name='Student',
            gender='F',
            date_of_birth='2012-01-01',
            current_class=class_room,
            guardian_name='Guardian',
            guardian_phone='0201111111',
            guardian_address='Test address',
            admission_date='2024-01-01',
            user=None,
        )
        student._skip_account_creation = True
        student.save()
        return student

    def test_dashboard_aggregates_daily_attendance_without_leaking_other_schools(self):
        present_student = self.create_student(self.school, self.class_room, 'DASH-001')
        DailyAttendance.objects.create(
            student=present_student,
            class_instance=self.class_room,
            date=self.today,
            status='present',
        )
        absent_student = self.create_student(self.school, self.class_room, 'DASH-002')
        DailyAttendance.objects.create(
            student=absent_student,
            class_instance=self.class_room,
            date=self.today,
            status='absent',
        )
        late_student = self.create_student(self.school, self.class_room, 'DASH-003')
        DailyAttendance.objects.create(
            student=late_student,
            class_instance=self.class_room,
            date=self.today - timedelta(days=1),
            status='late',
        )

        other_school = self.create_school('Other School', 'other@example.edu')
        other_class = Class.objects.create(
            school=other_school,
            level='BASIC_1',
            section='A',
        )
        other_student = self.create_student(other_school, other_class, 'OTHER-001')
        DailyAttendance.objects.create(
            student=other_student,
            class_instance=other_class,
            date=self.today,
            status='present',
        )

        client = APIClient()
        client.force_authenticate(user=self.admin)
        response = client.get('/api/auth/admin-dashboard/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['attendance_stats']['total_present_today'], 1)
        self.assertEqual(response.data['attendance_stats']['total_absent_today'], 1)
        self.assertEqual(response.data['attendance_stats']['attendance_rate'], 66.7)
        self.assertEqual(response.data['attendance_stats']['classes_with_low_attendance'], 1)
        self.assertEqual(len(response.data['class_stats']), 1)
        self.assertEqual(response.data['class_stats'][0]['name'], 'Basic 1 A')
        self.assertEqual(response.data['class_stats'][0]['student_count'], 3)
        self.assertEqual(response.data['class_stats'][0]['attendance_rate'], 66.7)
