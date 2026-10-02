from datetime import date, timedelta

import holidays


def count_school_days(start_date, end_date, closed_dates=()):
    """Count inclusive Monday-Friday school days, excluding confirmed closures."""
    if not start_date or not end_date or end_date < start_date:
        return 0

    closed = {
        date.fromisoformat(value) if isinstance(value, str) else value
        for value in closed_dates
    }
    total = 0
    current = start_date
    while current <= end_date:
        if current.weekday() < 5 and current not in closed:
            total += 1
        current += timedelta(days=1)
    return total


def public_holidays_between(start_date, end_date):
    """Return Ghana public holidays on weekdays within the selected school period."""
    if not start_date or not end_date or end_date < start_date:
        return []

    calendar = holidays.country_holidays(
        'GH',
        years=range(start_date.year, end_date.year + 1),
    )
    return [
        {'date': holiday_date.isoformat(), 'name': name}
        for holiday_date, name in sorted(calendar.items())
        if start_date <= holiday_date <= end_date and holiday_date.weekday() < 5
    ]