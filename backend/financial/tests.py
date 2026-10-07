from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase

from schools.models import School, Staff
from teachers.models import Teacher

from .views import _count_active_staff


class ActiveStaffCountTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(
            name='Staff Count School',
            address='Test address',
            location='Test location',
            phone_number='0200000000',
            email='staff-count@example.edu',
        )

    def test_teacher_profiles_are_counted_once_even_when_payroll_link_is_missing(self):
        user_model = get_user_model()
        linked_teacher_user = user_model.objects.create_user(
            email='linked-teacher@example.edu',
            password='secret123',
            role='TEACHER',
            school=self.school,
        )
        unlinked_teacher_user = user_model.objects.create_user(
            email='unlinked-teacher@example.edu',
            password='secret123',
            role='TEACHER',
            school=self.school,
        )

        Teacher.objects.create(
            user=linked_teacher_user,
            school=self.school,
            employee_id='T001',
            hire_date=date(2024, 1, 1),
        )
        Teacher.objects.create(
            user=unlinked_teacher_user,
            school=self.school,
            employee_id='T002',
            hire_date=date(2024, 1, 1),
        )

        Staff.objects.create(
            school=self.school,
            user=linked_teacher_user,
            staff_id='T001',
            first_name='Linked',
            last_name='Teacher',
            position='Teacher',
            hire_date=date(2024, 1, 1),
        )
        Staff.objects.create(
            school=self.school,
            staff_id='T002',
            first_name='Unlinked',
            last_name='Teacher',
            position='Teacher',
            hire_date=date(2024, 1, 1),
        )
        Staff.objects.create(
            school=self.school,
            staff_id='S001',
            first_name='Office',
            last_name='Staff',
            position='Administrator',
            hire_date=date(2024, 1, 1),
        )

        self.assertEqual(_count_active_staff(self.school), 3)
