#!/usr/bin/env python
"""
Simple test script to verify logo display in report preview
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from schools.models import School
from reports.image_loader import ReportImageLoader

def test_logo_display():
    """Test logo loading and display functionality"""
    print("🔍 Testing logo display...")
    
    # Check available logos
    logo_dir = os.path.join('backend', 'media', 'school_logos')
    if os.path.exists(logo_dir):
        logos = os.listdir(logo_dir)
        print(f"📁 Available logos: {logos}")
    
    # Get or create school with logo
    school = School.objects.filter(logo__isnull=False).first()
    
    if not school:
        print("📝 Creating test school with logo...")
        school = School.objects.create(
            name="Test School",
            address="123 Test St",
            location="Test City", 
            phone_number="1234567890",
            email="test@school.edu",
            logo="school_logos/loggo.jfif"
        )
    
    print(f"🏫 School: {school.name}")
    print(f"🖼️  Logo: {school.logo}")
    
    # Test image loading
    reader, width, height = ReportImageLoader.get_image_reader(school.logo, 2, 2)
    
    if reader:
        print(f"✅ Logo loaded successfully!")
        print(f"📏 Dimensions: {width:.1f}x{height:.1f} inches")
        return True
    else:
        print("❌ Logo failed to load")
        return False

if __name__ == "__main__":
    print("=" * 40)
    print("LOGO DISPLAY TEST")
    print("=" * 40)
    
    success = test_logo_display()
    
    print("=" * 40)
    print("✅ PASSED" if success else "❌ FAILED")
    print("=" * 40)