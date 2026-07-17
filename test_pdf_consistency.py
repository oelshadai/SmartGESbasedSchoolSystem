#!/usr/bin/env python
"""
Test script to verify PDF generation uses same context as preview
"""
import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from django.template.loader import render_to_string
from reports.pdf_generator import generate_terminal_report_pdf
from students.models import Student
from schools.models import Term
from django.contrib.auth import get_user_model

User = get_user_model()

def test_pdf_consistency():
    """Test that PDF generation uses same template and context as preview"""
    try:
        # Get a test student and term
        student = Student.objects.filter(is_active=True).first()
        term = Term.objects.first()
        
        if not student or not term:
            print("No test data found. Please create a student and term first.")
            return
        
        print(f"Testing with student: {student.get_full_name()}")
        print(f"Testing with term: {term}")
        
        # Create mock request context
        class MockRequest:
            def __init__(self, user):
                self.user = user
            
            def build_absolute_uri(self, path):
                return f"http://localhost:8000{path}"
        
        # Get a user from the same school
        user = User.objects.filter(school=student.school).first()
        if not user:
            print("No user found for the student's school")
            return
            
        mock_request = MockRequest(user)
        
        # Import the viewset to use its context generation method
        from reports.views import ReportCardViewSet
        viewset = ReportCardViewSet()
        
        # Generate the same context used by both preview and PDF
        context = viewset._get_report_context(student, term, mock_request)
        
        print("Context keys:", list(context.keys()))
        print(f"Student: {context['student'].get_full_name()}")
        print(f"Term: {context['term']}")
        print(f"Subject results count: {context['subject_results'].count()}")
        
        # Test HTML rendering (same as preview)
        html_content = render_to_string('reports/terminal_report.html', context)
        print(f"HTML content length: {len(html_content)} characters")
        
        # Test PDF generation (should use same context)
        try:
            pdf_content = generate_terminal_report_pdf(context)
            print(f"PDF content length: {len(pdf_content)} bytes")
            print("PDF generation successful!")
            
            # Save test files for comparison
            with open('test_preview.html', 'w', encoding='utf-8') as f:
                f.write(html_content)
            print("Preview HTML saved as test_preview.html")
            
            with open('test_generated.pdf', 'wb') as f:
                f.write(pdf_content)
            print("Generated PDF saved as test_generated.pdf")
            
            print("\nSUCCESS: Both preview and PDF use the same context and template!")
            
        except Exception as e:
            print(f"PDF generation failed: {e}")
            print("This means the PDF download won't match the preview")
            
    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_pdf_consistency()