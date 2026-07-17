#!/usr/bin/env python3
"""
Simple script to check URL patterns
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

def check_urls():
    """Check available URL patterns"""
    resolver = get_resolver()
    
    print("Available URL patterns:")
    
    def print_patterns(patterns, prefix=""):
        for pattern in patterns:
            if hasattr(pattern, 'url_patterns'):
                # This is an include() pattern
                print(f"{prefix}{pattern.pattern} -> includes:")
                print_patterns(pattern.url_patterns, prefix + "  ")
            else:
                # This is a regular pattern
                print(f"{prefix}{pattern.pattern} -> {pattern.callback}")
    
    print_patterns(resolver.url_patterns)
    
    print("\n" + "="*50)
    print("Checking specific attendance patterns:")
    
    # Check students app URLs specifically
    try:
        from students.urls import router
        print("\nStudents router registered patterns:")
        for prefix, viewset, basename in router.registry:
            print(f"  {prefix}/ -> {viewset}")
            
            # Check if it's the attendance viewset
            if 'attendance' in prefix.lower():
                print(f"    Actions available:")
                for action_name in dir(viewset):
                    if not action_name.startswith('_') and callable(getattr(viewset, action_name)):
                        action = getattr(viewset, action_name)
                        if hasattr(action, 'detail') or hasattr(action, 'url_path'):
                            print(f"      - {action_name}")
    except Exception as e:
        print(f"Error checking router: {e}")

if __name__ == '__main__':
    check_urls()