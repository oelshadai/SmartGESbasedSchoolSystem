# Logo and Term Selection Fixes - Deployment Guide

## Issues Fixed

### 1. Logo Loading Issue on Report Cards
**Problem**: School logos were not displaying on report cards after deployment, showing placeholder text instead.

**Solution**: 
- Updated report template to properly handle school logo URLs
- Modified PDF generator to support both file paths and URLs
- Added proper error handling for logo loading
- Added MEDIA_URL_BASE configuration for deployment

### 2. Missing Term Selection in Admin Settings
**Problem**: Admin settings page lacked term selection functionality.

**Solution**:
- Added term selection dropdown in school settings
- Integrated with existing academic year and term APIs
- Added current term management functionality

## Files Modified

### Backend Changes:
1. `backend/reports/templates/reports/terminal_report_template.html`
   - Fixed logo display logic with proper Django template tags
   - Added error handling for missing logos

2. `backend/reports/pdf_generator.py`
   - Enhanced image loading to support URLs and file paths
   - Added requests library for URL-based image loading
   - Improved error handling for logo loading

3. `backend/school_report_saas/settings.py`
   - Added MEDIA_URL_BASE configuration for deployment

### Frontend Changes:
1. `frontend/src/pages/SchoolSettings.jsx`
   - Added term selection functionality
   - Integrated academic year and term management
   - Added current term display and selection

### New Files:
1. `backend/schools/management/commands/setup_academic_data.py`
   - Management command to set up default academic years and terms

## Deployment Steps

### 1. Backend Deployment
```bash
# Install dependencies (requests already included)
pip install -r requirements.txt

# Run migrations (if any new ones)
python manage.py migrate

# Set up academic data for existing schools
python manage.py setup_academic_data

# Set environment variable for media URL base
export MEDIA_URL_BASE="https://your-backend-domain.com"
```

### 2. Environment Variables
Add to your deployment environment:
```
MEDIA_URL_BASE=https://your-backend-domain.com
```

### 3. Frontend Deployment
No additional steps needed - changes are included in the existing build.

## Testing

### Logo Display:
1. Upload a school logo in admin settings
2. Generate a report card
3. Verify logo appears correctly in PDF

### Term Selection:
1. Go to School Settings page
2. Verify "Current Term Selection" section appears
3. Select different terms and verify they update correctly
4. Check that current term is displayed properly

## Notes

- The logo fix handles both local file paths and remote URLs
- Term selection integrates with existing academic year/term system
- Management command can be run multiple times safely (idempotent)
- All changes are backward compatible

## Troubleshooting

### Logo Still Not Loading:
- Check MEDIA_URL_BASE environment variable
- Verify logo file is accessible via URL
- Check network connectivity from server

### Term Selection Not Working:
- Ensure academic years and terms exist (run setup command)
- Check API endpoints are accessible
- Verify user permissions for term management