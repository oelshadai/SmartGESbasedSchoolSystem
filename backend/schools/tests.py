from datetime import date

from django.test import SimpleTestCase

from schools.calendar import count_school_days, public_holidays_between


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