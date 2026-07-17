# Logo and Term Selection Fixes - Deployment Guide

## Overview
This guide covers the deployment of critical fixes for school logo display on report cards and term selection functionality in the admin settings. These fixes ensure proper logo rendering in PDF reports and provide administrators with term management capabilities.

## Issues Resolved

### 1. Logo Display Issue
**Problem**: School logos were not appearing on generated report cards, showing placeholder text instead.
**Impact**: Professional appearance of report cards was compromised.

### 2. Missing Term Selection
**Problem**: Admin settings lacked term selection functionality.
**Impact**: Administrators couldn't manage current academic terms effectively.

## Pre-Deployment Checklist

- [ ] Backend server is accessible
- [ ] Database is backed up
- [ ] Frontend build environment is ready
- [ ] Environment variables are configured
- [ ] All dependencies are installed

## Deployment Steps

### Phase 1: Backend Deployment

#### 1.1 Update Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### 1.2 Environment Configuration
Add to your deployment environment variables:
```env
MEDIA_URL_BASE=https://your-backend-domain.com
```

For Render deployment, add this in the Environment section of your web service.

#### 1.3 Database Migration
```bash
python manage.py migrate
```

#### 1.4 Setup Academic Data
Run the management command to initialize academic years and terms:
```bash
python manage.py setup_academic_data
```

This command:
- Creates default academic years (2023-2024, 2024-2025, 2025-2026)
- Creates terms (First, Second, Third) for each academic year
- Sets the current term to First Term 2024-2025
- Is idempotent (safe to run multiple times)

#### 1.5 Test Backend Changes
Verify the following endpoints work:
- `GET /api/schools/settings/` - Returns school settings
- `GET /api/schools/terms/` - Returns available terms
- `POST /api/schools/terms/{id}/set_current/` - Sets current term

### Phase 2: Frontend Deployment

#### 2.1 Build Frontend
```bash
cd frontend
npm install
npm run build
```

#### 2.2 Deploy to Netlify
If using Netlify:
1. Push changes to your repository
2. Netlify will automatically rebuild and deploy
3. No additional configuration needed

### Phase 3: Verification

#### 3.1 Logo Display Testing
1. **Upload a school logo**:
   - Go to School Settings
   - Upload a logo using the image capture component
   - Save settings

2. **Generate a test report**:
   - Navigate to Reports section
   - Generate a report card for any student
   - Verify the school logo appears correctly in the PDF

3. **Test different logo formats**:
   - Try PNG and JPG formats
   - Test different image sizes
   - Ensure logos display properly

#### 3.2 Term Selection Testing
1. **Access School Settings**:
   - Navigate to School Settings page
   - Verify "Current Term Selection" section is visible

2. **Test term selection**:
   - Select different terms from the dropdown
   - Verify current term updates correctly
   - Check that the selection persists after page refresh

3. **Verify API integration**:
   - Ensure terms load properly
   - Test that setting current term works
   - Verify success/error messages display

## Technical Details

### Files Modified

#### Backend Changes:
1. **`reports/pdf_generator.py`**:
   - Enhanced image loading to support both file paths and URLs
   - Added requests library for URL-based image loading
   - Improved error handling for logo loading failures
   - Added MEDIA_URL_BASE configuration support

2. **`reports/templates/reports/terminal_report_template.html`**:
   - Fixed logo display logic with proper Django template tags
   - Added fallback handling for missing logos

3. **`school_report_saas/settings.py`**:
   - Added MEDIA_URL_BASE configuration for deployment environments

4. **`schools/management/commands/setup_academic_data.py`**:
   - New management command for academic data initialization
   - Creates default academic years and terms
   - Sets up proper relationships and current term

#### Frontend Changes:
1. **`pages/SchoolSettings.jsx`**:
   - Added comprehensive term selection functionality
   - Integrated with academic year and term APIs
   - Added current term display and management
   - Enhanced responsive design for mobile devices

### Key Features Added

#### Logo Handling:
- Support for both local file paths and remote URLs
- Automatic URL construction for relative paths
- Graceful fallback when logos fail to load
- Network timeout handling (10 seconds)
- Support for PNG, JPG, and other image formats

#### Term Management:
- Dynamic term selection dropdown
- Current term highlighting
- Real-time term switching
- Integration with existing academic year system
- Responsive design for all screen sizes

## Environment-Specific Configuration

### Development
```env
MEDIA_URL_BASE=http://localhost:8000
DEBUG=True
```

### Production (Render)
```env
MEDIA_URL_BASE=https://your-app-name.onrender.com
DEBUG=False
ALLOWED_HOSTS=your-app-name.onrender.com,your-frontend-domain.netlify.app
```

### Production (Other Platforms)
```env
MEDIA_URL_BASE=https://your-backend-domain.com
DEBUG=False
ALLOWED_HOSTS=your-backend-domain.com,your-frontend-domain.com
```

## Troubleshooting

### Logo Issues

#### Logo Not Displaying
1. **Check MEDIA_URL_BASE**:
   ```bash
   echo $MEDIA_URL_BASE
   ```
   Should return your backend domain

2. **Verify logo file accessibility**:
   - Test logo URL directly in browser
   - Check file permissions
   - Verify network connectivity from server

3. **Check server logs**:
   ```bash
   # Look for image loading errors
   grep "Error loading image" logs/
   ```

#### Logo Upload Fails
1. **Check file size limits**:
   - Ensure images are under size limits
   - Verify server disk space

2. **Verify file format**:
   - Use PNG or JPG formats
   - Ensure files are not corrupted

### Term Selection Issues

#### Terms Not Loading
1. **Run setup command**:
   ```bash
   python manage.py setup_academic_data
   ```

2. **Check database**:
   ```sql
   SELECT * FROM schools_academicyear;
   SELECT * FROM schools_term;
   ```

3. **Verify API endpoints**:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://your-backend.com/api/schools/terms/
   ```

#### Current Term Not Updating
1. **Check user permissions**:
   - Ensure user has admin privileges
   - Verify authentication token

2. **Test API directly**:
   ```bash
   curl -X POST \
        -H "Authorization: Bearer YOUR_TOKEN" \
        https://your-backend.com/api/schools/terms/1/set_current/
   ```

## Rollback Plan

If issues occur after deployment:

### Backend Rollback
1. **Revert to previous version**:
   ```bash
   git checkout previous-commit-hash
   ```

2. **Restore database backup**:
   ```bash
   # Restore from backup if needed
   ```

### Frontend Rollback
1. **Revert Netlify deployment**:
   - Go to Netlify dashboard
   - Select previous deployment
   - Click "Publish deploy"

## Performance Considerations

### Logo Loading
- Images are cached after first load
- 10-second timeout prevents hanging requests
- Graceful fallback maintains report generation speed

### Term Selection
- Terms are loaded once per session
- Minimal API calls for term switching
- Responsive design optimized for mobile

## Security Notes

- Logo uploads are validated for file type
- Image processing includes size limits
- Term selection requires proper authentication
- All API endpoints use token-based authentication

## Monitoring

### Key Metrics to Monitor
1. **Report generation success rate**
2. **Logo loading success rate**
3. **Term selection API response times**
4. **Error rates for image processing**

### Log Monitoring
Watch for these log patterns:
```bash
# Logo loading errors
grep "Error loading image" logs/

# Term selection errors
grep "Error setting current term" logs/

# Report generation issues
grep "PDF generation failed" logs/
```

## Support

For issues with this deployment:
1. Check the troubleshooting section above
2. Review server logs for specific error messages
3. Test individual components (logo upload, term selection) separately
4. Verify environment variables are correctly set

## Next Steps

After successful deployment:
1. Train administrators on new term selection features
2. Update user documentation
3. Monitor system performance
4. Plan for future enhancements (custom logo positioning, additional term types)