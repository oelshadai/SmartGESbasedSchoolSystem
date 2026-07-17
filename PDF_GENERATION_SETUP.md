# PDF Generation Setup Guide

## Critical Requirement
The PDF must render **100% identically** to the HTML preview shown in the iframe.

## Solution Implemented
Using **wkhtmltopdf** with **pdfkit** Python wrapper to ensure pixel-perfect PDF generation.

---

## Installation Steps

### 1. Install wkhtmltopdf

#### Windows:
1. Download from: https://wkhtmltopdf.org/downloads.html
2. Download the installer: `wkhtmltox-0.12.6-1.msvc2015-win64.exe`
3. Run installer and install to default location: `C:\Program Files\wkhtmltopdf\`
4. Verify installation:
   ```cmd
   "C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe" --version
   ```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install -y wkhtmltopdf
```

#### Linux (CentOS/RHEL):
```bash
sudo yum install -y wkhtmltopdf
```

#### macOS:
```bash
brew install wkhtmltopdf
```

### 2. Install Python Package
```bash
pip install pdfkit
```

### 3. Verify Django Settings
The settings have been configured in `backend/school_report_saas/settings.py`:

```python
# wkhtmltopdf configuration for PDF generation
if os.name == 'nt':  # Windows
    WKHTMLTOPDF_CMD = r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"
else:  # Linux/Unix
    WKHTMLTOPDF_CMD = '/usr/local/bin/wkhtmltopdf'
```

---

## How It Works

### Preview System (Iframe)
1. Django view renders `terminal_report.html`
2. Context data is prepared using `_get_report_context()`
3. HTML is displayed in iframe with full CSS styling

### PDF Generation System
1. **SAME** Django view uses `_get_report_context()` (single source of truth)
2. **SAME** template `terminal_report.html` is rendered
3. **SAME** CSS styles are applied
4. wkhtmltopdf converts HTML → PDF with exact rendering

### Key Implementation Details

#### 1. Single Context Function
Both preview and PDF use the same context:
```python
def _get_report_context(self, student, term, request):
    \"\"\"Get EXACT same context for both preview and PDF generation\"\"\"
    # ... context preparation
    return context
```

#### 2. PDF Generation
```python
from .pdf_generator import generate_terminal_report_pdf

def generate_pdf_report(self, request):
    # Get EXACT same context as preview
    context = self._get_report_context(student, term, request)
    
    # Generate PDF using same template
    pdf_content = generate_terminal_report_pdf(context)
    
    response = HttpResponse(pdf_content, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="report.pdf"'
    return response
```

#### 3. PDF Generator (pdf_generator.py)
```python
def generate_terminal_report_pdf(report_context):
    # Render SAME template as preview
    html_content = render_to_string('reports/terminal_report.html', report_context)
    
    # Convert to PDF using pdfkit
    config = pdfkit.configuration(wkhtmltopdf=settings.WKHTMLTOPDF_CMD)
    
    options = {
        'page-size': 'A4',
        'margin-top': '10mm',
        'margin-right': '10mm',
        'margin-bottom': '10mm',
        'margin-left': '10mm',
        'encoding': 'UTF-8',
        'enable-local-file-access': None,
        'print-media-type': None,
        'zoom': 1.0,
        'dpi': 96
    }
    
    pdf_content = pdfkit.from_string(html_content, False, configuration=config, options=options)
    return pdf_content
```

---

## Testing

### 1. Test wkhtmltopdf Installation
```bash
# Windows
"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe" --version

# Linux/Mac
wkhtmltopdf --version
```

Expected output: `wkhtmltopdf 0.12.6`

### 2. Test PDF Generation
```python
# Run Django shell
python manage.py shell

# Test PDF generation
from reports.pdf_generator import generate_terminal_report_pdf
from students.models import Student
from schools.models import Term

# Get test data
student = Student.objects.first()
term = Term.objects.first()

# Create context (simplified for testing)
context = {
    'school': student.school,
    'student': student,
    'term': term,
    # ... other context data
}

# Generate PDF
pdf_bytes = generate_terminal_report_pdf(context)
print(f"PDF generated: {len(pdf_bytes)} bytes")
```

### 3. Test via API
```bash
# Using curl
curl -X POST http://localhost:8000/api/reports/report-cards/generate_pdf_report/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"student_id": 1, "term_id": 1}' \
  --output test_report.pdf

# Check the generated PDF
# Windows: start test_report.pdf
# Linux: xdg-open test_report.pdf
# Mac: open test_report.pdf
```

---

## Troubleshooting

### Error: "wkhtmltopdf not found"
**Solution:** Install wkhtmltopdf or update the path in settings.py

### Error: "OSError: No wkhtmltopdf executable found"
**Solution:** 
1. Verify installation path
2. Update `WKHTMLTOPDF_CMD` in settings.py
3. On Windows, ensure path uses raw string: `r"C:\Program Files\..."`

### PDF layout differs from preview
**Solution:**
1. Ensure both preview and PDF use `_get_report_context()`
2. Check that CSS `@media print` rules match screen styles
3. Verify `--print-media-type` option is enabled in pdfkit options

### Images not showing in PDF
**Solution:**
1. Use absolute URLs for images: `request.build_absolute_uri(image.url)`
2. Or use file paths: `file://{{ image.path }}`
3. Ensure `--enable-local-file-access` is in pdfkit options

### Fonts look different in PDF
**Solution:**
1. Use web-safe fonts (Arial, Times New Roman, etc.)
2. Or embed custom fonts using `@font-face` in CSS
3. Ensure font files are accessible to wkhtmltopdf

---

## Production Deployment

### Railway/Heroku
Add buildpack for wkhtmltopdf:
```bash
# Add to railway.json or Procfile
heroku buildpacks:add https://github.com/dscout/wkhtmltopdf-buildpack.git
```

### Docker
```dockerfile
# Add to Dockerfile
RUN apt-get update && apt-get install -y wkhtmltopdf
```

### Linux Server
```bash
sudo apt-get install -y wkhtmltopdf
```

---

## Verification Checklist

✅ wkhtmltopdf installed and accessible
✅ pdfkit Python package installed
✅ Settings.py configured with correct path
✅ Preview uses `_get_report_context()`
✅ PDF generation uses `_get_report_context()`
✅ Both use `terminal_report.html` template
✅ CSS styles render correctly in PDF
✅ Images display correctly in PDF
✅ Tables align perfectly
✅ Fonts and spacing match preview
✅ Layout is pixel-perfect

---

## API Endpoints

### Preview Report (Iframe)
```
GET /api/reports/template-preview-public/?token=JWT_TOKEN
```

### Download PDF
```
POST /api/reports/report-cards/generate_pdf_report/
Body: {"student_id": 1, "term_id": 1}
Headers: Authorization: Bearer JWT_TOKEN
```

---

## Support

If you encounter issues:
1. Check wkhtmltopdf installation: `wkhtmltopdf --version`
2. Verify Django settings path is correct
3. Check Django logs for detailed error messages
4. Test with simple HTML first before complex reports
5. Ensure all dependencies are installed: `pip install -r requirements.txt`
