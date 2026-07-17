# CORS Fix Deployment Instructions

## Backend Deployment (school-report-saas.onrender.com)

### 1. Update Environment Variables in Render Dashboard
1. Go to your backend service in Render dashboard
2. Navigate to "Environment" tab
3. Update/add these variables:
   ```
   CORS_ALLOWED_ORIGINS=https://school-report-saas-1.onrender.com
   CORS_ALLOW_ALL_ORIGINS=False
   FRONTEND_URL=https://school-report-saas-1.onrender.com
   ALLOWED_HOSTS=.onrender.com,school-report-saas.onrender.com
   ```

### 2. Deploy Backend Changes
1. Commit the settings.py changes to your git repository
2. Push to your main branch
3. Render will automatically redeploy the backend

## Frontend Deployment (school-report-saas-1.onrender.com)

### 1. Update Environment Variables in Render Dashboard
1. Go to your frontend service in Render dashboard
2. Navigate to "Environment" tab
3. Ensure this variable is set:
   ```
   VITE_API_BASE=https://school-report-saas.onrender.com/api
   ```

### 2. Deploy Frontend Changes
1. Commit the .env changes to your git repository
2. Push to your main branch
3. Render will automatically redeploy the frontend

## Verification Steps

### 1. Test CORS Configuration
Open browser console and visit: https://school-report-saas.onrender.com/api/cors-test/
- Should return JSON response without CORS errors

### 2. Test Authentication Endpoint
Check if login endpoint exists: https://school-report-saas.onrender.com/api/auth/login/
- Should return 405 Method Not Allowed (not 404)

### 3. Test Frontend Login
1. Visit: https://school-report-saas-1.onrender.com/login
2. Try logging in with valid credentials
3. Check browser console for errors
4. Login should work without CORS errors

### 4. Test API Calls
After successful login:
1. Navigate to dashboard
2. Check browser network tab
3. All API calls should go to https://school-report-saas.onrender.com/api/
4. No CORS errors should appear

## Troubleshooting

### If CORS errors persist:
1. Check Render logs for backend service
2. Verify environment variables are correctly set
3. Ensure both services have redeployed after changes

### If 404 errors on /auth/login/:
1. Check backend logs for URL routing issues
2. Verify Django URLs are properly configured
3. Test direct API endpoint access

### If login still fails:
1. Check browser network tab for exact error messages
2. Verify API base URL in frontend console logs
3. Test backend health endpoint: https://school-report-saas.onrender.com/api/health/

## Expected Timeline
- Backend redeploy: 3-5 minutes
- Frontend redeploy: 2-3 minutes
- DNS propagation: 1-2 minutes
- Total: ~10 minutes maximum