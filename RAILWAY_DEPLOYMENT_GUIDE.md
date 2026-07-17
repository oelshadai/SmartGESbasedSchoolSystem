# Railway Deployment Guide - Promotion System & Financial Dashboard

## Pre-Deployment Checklist

### 1. Create Migrations (Run locally before pushing)
```bash
cd backend
python manage.py makemigrations students
python manage.py makemigrations schools
python manage.py makemigrations fees
python manage.py makemigrations notifications
python manage.py makemigrations subscriptions
```

### 2. Files Added/Modified for Promotion System
- ✅ `backend/students/promotion_views.py` - New promotion endpoints
- ✅ `backend/students/promotion_serializers.py` - Data validation
- ✅ `backend/students/management/commands/promote_students.py` - CLI command
- ✅ `backend/students/urls.py` - Updated with promotion routes
- ✅ `backend/students/views.py` - Performance fixes
- ✅ `frontend/src/components/StudentPromotionSystem.tsx` - React component
- ✅ `frontend/src/pages/PromotionPage.tsx` - Page component

### 3. Git Commands for Deployment
```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: Enhanced student promotion system with bulk/selective promotion, financial dashboard improvements, and admin settings"

# Push to main branch (Railway auto-deploys from main)
git push origin main
```

### 4. Railway Environment Variables (if needed)
Ensure these are set in Railway dashboard:
```
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://... (Railway provides this)
ALLOWED_HOSTS=your-domain.railway.app
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### 5. Post-Deployment Verification
After deployment, verify these endpoints work:
- `GET /api/students/promotions/preview/`
- `POST /api/students/promotions/bulk-class/`
- `POST /api/students/promotions/selective/`
- Financial dashboard endpoints
- Admin settings endpoints

## Migration Files to Create

### Students App Migration
Create: `backend/students/migrations/0006_enhanced_promotion_system.py`

### Schools App Migration  
Create: `backend/schools/migrations/0006_financial_dashboard_settings.py`

## Deployment Steps

1. **Local Testing**
   ```bash
   # Test migrations locally first
   python manage.py migrate --dry-run
   python manage.py migrate
   
   # Test the new endpoints
   python manage.py runserver
   ```

2. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: Enhanced promotion system and financial dashboard"
   git push origin main
   ```

3. **Monitor Railway Deployment**
   - Check Railway dashboard for build logs
   - Verify migrations run successfully
   - Test endpoints after deployment

## Expected Railway Build Output
```
[inf] Running database migrations...
[inf] Operations to perform:
[inf]   Apply all migrations: accounts, admin, announcements, assignments, auth, contenttypes, events, fees, notifications, reports, schools, scores, sessions, sites, students, subscriptions, teachers, timetable
[inf] Running migrations:
[inf]   Applying students.0006_enhanced_promotion_system... OK
[inf]   Applying schools.0006_financial_dashboard_settings... OK
[inf] Collecting static files...
[inf] Starting Gunicorn server...
```

## Rollback Plan (if needed)
If deployment fails:
```bash
# Revert to previous commit
git log --oneline -5  # Find previous commit hash
git revert <commit-hash>
git push origin main
```

## Testing Commands After Deployment
```bash
# Test promotion preview
curl -X GET "https://your-app.railway.app/api/students/promotions/preview/?class_id=1&academic_year_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test management command (via Railway CLI if available)
railway run python manage.py promote_students --school-id 1 --academic-year-id 1 --dry-run
```

## Frontend Integration
Add the promotion page to your React router:
```tsx
import PromotionPage from '@/pages/PromotionPage';

// In your router configuration
{
  path: '/admin/promotions',
  element: <PromotionPage />,
  meta: { requiresAuth: true, roles: ['SCHOOL_ADMIN', 'PRINCIPAL'] }
}
```

## Performance Optimizations Applied
- ✅ Fixed `strptime` to `fromisoformat` for better date parsing
- ✅ Added `update_fields` to student saves for efficiency
- ✅ Optimized database queries with select_related
- ✅ Added proper error handling and validation

## Security Enhancements
- ✅ Role-based access control for promotions
- ✅ Input validation with serializers
- ✅ Transaction safety for bulk operations
- ✅ School-scoped data access only