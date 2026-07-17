#!/usr/bin/env python3
"""
Test script for PDF generation using WeasyPrint
"""

import weasyprint
from pathlib import Path

def test_pdf_generation():
    """Test PDF generation with the HTML template"""
    
    # Define paths
    html_file = Path("terminal_report.html")
    output_file = Path("test_report.pdf")
    
    # Check if HTML template exists
    if not html_file.exists():
        print(f"Error: {html_file} not found!")
        return False
    
    try:
        # Generate PDF
        print("Generating PDF...")
        html_doc = weasyprint.HTML(filename=str(html_file))
        html_doc.write_pdf(str(output_file))
        
        print(f"✅ PDF generated successfully: {output_file}")
        print(f"📄 File size: {output_file.stat().st_size} bytes")
        return True
        
    except Exception as e:
        print(f"❌ Error generating PDF: {e}")
        return False

if __name__ == "__main__":
    success = test_pdf_generation()
    if success:
        print("\n🎉 PDF generation test passed!")
    else:
        print("\n💥 PDF generation test failed!")