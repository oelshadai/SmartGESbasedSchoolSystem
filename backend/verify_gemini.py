import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('.env'))
key = (os.getenv('GEMINI_API_KEY') or '').strip().strip('"').strip("'")
print('KEY_PRESENT', bool(key))
print('KEY_LENGTH', len(key))
print('KEY_PREFIX', key[:8])

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from core.ai_service import _get_gemini_client

client = _get_gemini_client()
print('CLIENT_CREATED', type(client).__name__)

try:
    response = client.models.generate_content(model='gemini-2.0-flash', contents='Say hello in one word')
    print('RESPONSE_OK', bool(getattr(response, 'text', None)))
    print('RESPONSE_TEXT', (getattr(response, 'text', '') or '')[:80])
except Exception as exc:
    print('REQUEST_ERROR', repr(exc))
    raise
