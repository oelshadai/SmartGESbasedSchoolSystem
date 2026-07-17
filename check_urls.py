#!/usr/bin/env python3
"""
Check URL patterns for attendance endpoints
"""
import os
import sys
import django
from django.conf import settings

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from django.urls import get_resolver
from django.core.management import execute_from_command_line

def print_urls(urlpatterns, prefix=''):
    """Print all URL patterns"""
    for pattern in urlpatterns:
        if hasattr(pattern, 'url_patterns'):
            # This is an include() pattern
            print_urls(pattern.url_patterns, prefix + str(pattern.pattern))
        else:
            # This is a regular URL pattern
            print(f"{prefix}{pattern.pattern} -> {pattern.callback}")

def check_attendance_urls():
    """Check if attendance URLs exist"""
    print("Checking URL patterns...")
    
    resolver = get_resolver()
    
    # Look for attendance-related patterns
    attendance_patterns = []
    
    def find_attendance_patterns(patterns, prefix=''):
        for pattern in patterns:
            pattern_str = str(pattern.pattern)
            if hasattr(pattern, 'url_patterns'):
                find_attendance_patterns(pattern.url_patterns, prefix + pattern_str)
            else:
                full_pattern = prefix + pattern_str
                if 'attendance' in full_pattern.lower():
                    attendance_patterns.append(full_pattern)
    
    find_attendance_patterns(resolver.url_patterns)
    
    print("Found attendance-related URL patterns:")
    for pattern in attendance_patterns:
        print(f"  {pattern}")
    
    # Check students app URLs specifically
    print("\nChecking students app URLs...")
    try:
        from students.urls import urlpatterns as student_urls
        print("Students app URL patterns:")
        for pattern in student_urls:
            print(f"  /api/students/{pattern.pattern}")
    except Exception as e:
        print(f"Error checking students URLs: {e}")

if __name__ == '__main__':
    check_attendance_urls()