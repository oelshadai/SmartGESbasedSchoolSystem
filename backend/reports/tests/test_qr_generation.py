from django.test import SimpleTestCase

from reports.models import ReportCard
from reports.utils import build_report_verification_url


class ReportCardQRGenerationTests(SimpleTestCase):
    def test_report_card_has_qr_generation_method(self):
        self.assertTrue(hasattr(ReportCard, 'generate_qr_code'))

    def test_build_report_verification_url_uses_report_code(self):
        url = build_report_verification_url('RC-TEST-123')
        self.assertIn('RC-TEST-123', url)
        self.assertTrue(url.startswith('http'))
