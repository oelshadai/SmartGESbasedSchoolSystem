# 🧪 MANUAL TESTING CHECKLIST - Deployment Fixes

## Before Running Tests:
1. Ensure Django environment is set up
2. Database is accessible
3. Cloudinary is configured (if using)

## Test 1: Teacher Creation Fix ✅

### What to Test:
- Admin can create teacher WITHOUT selecting school field
- School is automatically set from admin's school
- Teacher creation form is simpler

### Steps:
1. Login as school admin
2. Go to teacher creation form
3. Fill out teacher details (NO school field should be required)
4. Submit form
5. Verify teacher is created with correct school

### Expected Results:
- ✅ No school field in form
- ✅ Teacher created successfully
- ✅ Teacher.school = Admin.school
- ✅ No validation errors about missing school

---

## Test 2: Logo Display Fix ✅

### What to Test:
- School logos display in reports (Cloudinary URLs)
- Both preview and PDF generation work
- Logos appear in header and watermark

### Steps:
1. Ensure school has logo uploaded (Cloudinary)
2. Generate report preview
3. Check logo appears in header
4. Check watermark shows logo
5. Download PDF and verify logo

### Expected Results:
- ✅ Logo displays in preview iframe
- ✅ Logo displays in downloaded PDF
- ✅ Cloudinary URLs work correctly
- ✅ No broken image icons

---

## Quick Code Verification:

### Teacher Serializer Check:
```python
# In teachers/serializers.py
school = serializers.PrimaryKeyRelatedField(queryset=School.objects.all(), required=False, write_only=True)

# In create method:
school = self.context.get('request').user.school
```

### Logo Utils Check:
```python
# In reports/utils.py
def get_media_base_url(request=None):
    if hasattr(settings, 'CLOUDINARY_STORAGE') or getattr(settings, 'DEFAULT_FILE_STORAGE', '').find('cloudinary') != -1:
        return ''  # Cloudinary URLs are already absolute

def get_absolute_media_url(file_field, request=None):
    if url.startswith('http'):
        return url  # Already absolute (Cloudinary)
```

### Template Check:
```html
<!-- In terminal_report.html -->
{% if school_logo_absolute %}
    <img src="{{ school_logo_absolute }}" alt="School Logo">
{% else %}
    <img src="{{ media_url_base }}{{ school.logo.url }}" alt="School Logo">
{% endif %}
```

---

## Production Deployment Checklist:

### Before Deployment:
- [ ] All tests pass
- [ ] Teacher creation works without school field
- [ ] Logos display correctly in reports
- [ ] No console errors in browser
- [ ] No server errors in logs

### After Deployment:
- [ ] Test teacher creation on production
- [ ] Test report generation on production
- [ ] Verify Cloudinary images load
- [ ] Check different schools have their own logos

---

## Rollback Plan:
If issues occur after deployment:
1. Revert to previous commit
2. Redeploy previous version
3. Fix issues in development
4. Re-test before next deployment

---

## Contact Info:
- If tests fail, check error logs
- Verify Cloudinary configuration
- Check Django settings for media handling