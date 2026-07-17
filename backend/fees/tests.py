from django.test import TestCase

from fees.serializers import GenerateWeeklyBillsSerializer


class GenerateWeeklyBillsSerializerTests(TestCase):
    def test_rejects_end_date_before_start_date(self):
        serializer = GenerateWeeklyBillsSerializer(
            data={
                'start_date': '2026-07-10',
                'end_date': '2026-07-05',
                'overwrite': False,
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
