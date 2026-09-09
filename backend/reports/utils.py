from django.conf import settings
from django.contrib.sites.models import Site
from django.core.files.base import ContentFile


def build_report_verification_url(report_code):
    """Return a verification URL for an authentic report card."""
    base_url = getattr(settings, 'FRONTEND_URL', '').strip().rstrip('/')
    if not base_url:
        base_url = getattr(settings, 'PUBLIC_BASE_URL', '').strip().rstrip('/')
    if not base_url:
        base_url = 'http://localhost:8000'
    return f"{base_url}/api/reports/verify/{report_code}/"


def generate_qr_code_for_report(report):
    """Create and save a QR image based on the report verification code."""
    import io
    import qrcode

    if not report.report_code:
        report.generate_report_code()

    verification_url = build_report_verification_url(report.report_code)
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(verification_url)
    qr.make(fit=True)

    image = qr.make_image(fill_color='black', back_color='white')
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    buffer.seek(0)

    filename = f'qr_{report.report_code}.png'
    report.qr_code.save(filename, ContentFile(buffer.read()), save=True)
    return verification_url


def get_media_base_url(request=None):
    """
    Get the correct base URL for media files in both development and production.
    For Cloudinary, return empty string since URLs are already absolute.
    """
    # Check if using Cloudinary (URLs start with https://res.cloudinary.com)
    if hasattr(settings, 'CLOUDINARY_STORAGE') or getattr(settings, 'DEFAULT_FILE_STORAGE', '').find('cloudinary') != -1:
        return ''  # Cloudinary URLs are already absolute
    
    # Try to get from request first
    if request:
        return request.build_absolute_uri('/').rstrip('/')
    
    # Check if we have a configured MEDIA_URL_BASE
    media_base = getattr(settings, 'MEDIA_URL_BASE', None)
    if media_base and not media_base.startswith('http://localhost'):
        return media_base
    
    # Fallback to production URL
    if not settings.DEBUG:
        return 'https://school-report-saas.onrender.com'
    
    # Development fallback
    return 'http://localhost:8000'


def get_absolute_media_url(file_field, request=None):
    """
    Get absolute URL for a file field, handling both development and production.
    Special handling for Cloudinary URLs.
    """
    if not file_field:
        return None
    
    try:
        url = file_field.url
        
        # If URL is already absolute (starts with http/https), return as-is
        if url.startswith('http'):
            return url
        
        # For Cloudinary, the URL should already be absolute
        if hasattr(settings, 'CLOUDINARY_STORAGE') or getattr(settings, 'DEFAULT_FILE_STORAGE', '').find('cloudinary') != -1:
            return url  # Cloudinary URLs are already absolute
        
        # For local files, build absolute URL
        base_url = get_media_base_url(request)
        return base_url + url
    except (ValueError, AttributeError):
        # Handle cases where file_field.url might fail
        return None


def validate_image_url(url):
    """
    Validate if an image URL is accessible
    """
    if not url:
        return False
        
    try:
        import requests
        response = requests.head(url, timeout=5)
        return response.status_code == 200
    except Exception:
        return False