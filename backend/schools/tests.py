from datetime import date

from django.test import SimpleTestCase, TestCase

from schools.calendar import count_school_days, public_holidays_between
from schools.models import Class, School
from students.promotion_views import _get_next_class


class SchoolCalendarTests(SimpleTestCase):
    def test_counts_weekdays_and_excludes_confirmed_school_closures(self):
        self.assertEqual(
            count_school_days(
                date(2026, 10, 5),
                date(2026, 10, 11),
                ['2026-10-07'],
            ),
            4,
        )

    def test_returns_ghana_public_holidays_inside_period(self):
        holidays = public_holidays_between(date(2026, 1, 1), date(2026, 1, 7))

        self.assertEqual(
            holidays,
            [
                {'date': '2026-01-01', 'name': "New Year's Day"},
                {'date': '2026-01-07', 'name': 'Constitution Day'},
            ],
        )


class NurseryClassProgressionTests(TestCase):
    def test_nursery_progresses_through_nursery_2_before_kg1(self):
        school = School.objects.create(
            name='Nursery Progression School',
            address='Test address',
            location='Test location',
            phone_number='0200000000',
            email='nursery-progression@example.edu',
        )
        nursery = Class.objects.create(school=school, level='NURSERY', section='A')
        nursery_2 = Class.objects.create(school=school, level='NURSERY_2', section='A')
        kg1 = Class.objects.create(school=school, level='KG1', section='A')

        self.assertEqual(_get_next_class(nursery, school), nursery_2)
        self.assertEqual(_get_next_class(nursery_2, school), kg1)