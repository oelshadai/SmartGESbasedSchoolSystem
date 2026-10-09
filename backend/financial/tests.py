from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from schools.models import Expense, School, Staff
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


class DailyExpenseSummaryTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(
            name='Daily Expense School',
            address='Test address',
            location='Test location',
            phone_number='0200000000',
            email='daily-expense@example.edu',
        )
        self.admin = get_user_model().objects.create_user(
            email='daily-expense-admin@example.edu',
            password='secret123',
            role='SCHOOL_ADMIN',
            school=self.school,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_daily_summary_counts_approved_and_paid_expenses_for_requested_date(self):
        report_date = date(2026, 10, 8)
        Expense.objects.create(
            school=self.school,
            category='SUPPLIES',
            amount=Decimal('12.50'),
            description='Classroom supplies',
            date=report_date,
            requested_by=self.admin,
            status='APPROVED',
        )
        Expense.objects.create(
            school=self.school,
            category='UTILITIES',
            amount=Decimal('7.50'),
            description='Water bill',
            date=report_date,
            requested_by=self.admin,
            status='PAID',
        )
        Expense.objects.create(
            school=self.school,
            category='OTHER',
            amount=Decimal('99.00'),
            description='Pending purchase',
            date=report_date,
            requested_by=self.admin,
            status='PENDING',
        )
        Expense.objects.create(
            school=self.school,
            category='OTHER',
            amount=Decimal('40.00'),
            description='Different day',
            date=date(2026, 10, 7),
            requested_by=self.admin,
            status='PAID',
        )

        response = self.client.get(
            '/api/schools/financial/expenses/daily-summary/',
            {'date': report_date.isoformat()},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_expenses'], 20.0)
        self.assertEqual(len(response.data['expenses']), 2)
