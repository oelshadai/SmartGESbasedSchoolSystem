# 🚀 Render Deployment Guide

## ✅ Repository Structure Fixed

Your repositories are now properly structured for Render deployment:

### Backend Repository
- **URL**: https://github.com/oelshadai/schoolreportbackend
- **Structure**: Files at root level (✓ Render compatible)
- **Branch**: main
- **Status**: ✅ Up to date

### Frontend Repository
- **URL**: https://github.com/oelshadai/schoolreportfrontend
- **Structure**: Files at root level (✓ Render compatible)
- **Branch**: main
- **Status**: ✅ Up to date

## 📋 Deployment Steps

### Part 1: Deploy Backend (Django)

#### Step 1: Create New Web Service
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select repository: **schoolreportbackend**

#### Step 2: Configure Backend Service
```
Name: school-report-backend
Region: Oregon (US West) or closest to you
Branch: main
Root Directory: (leave empty)
Runtime: Python 3
Build Command: ./build.sh
Start Command: gunicorn school_report_saas.wsgi:application
```

#### Step 3: Set Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

**Required Variables:**
```
SECRET_KEY=your-secret-key-here-generate-a-new-one
DEBUG=False
ALLOWED_HOSTS=.onrender.com
DATABASE_URL=(Render will provide this if using PostgreSQL)
CORS_ALLOWED_ORIGINS=https://your-frontend-url.onrender.com

# Email Settings (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# AWS S3 (optional, for file storage)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=your-bucket
AWS_S3_REGION_NAME=us-east-1
```

#### Step 4: Add PostgreSQL Database
1. In the same service page, scroll to **"Environment"**
2. Click **"Add Database"**
3. Select **"PostgreSQL"**
4. Render will automatically set `DATABASE_URL`

#### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Note your backend URL: `https://school-report-backend.onrender.com`

### Part 2: Deploy Frontend (React/Vite)

#### Step 1: Create New Static Site
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Static Site"**
3. Select repository: **schoolreportfrontend**

#### Step 2: Configure Frontend Service
```
Name: school-report-frontend
Branch: main
Root Directory: (leave empty)
Build Command: npm install && npm run build
Publish Directory: dist
```

#### Step 3: Set Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

```
VITE_API_URL=https://school-report-backend.onrender.com/api
VITE_API_BASE_URL=https://school-report-backend.onrender.com
```

#### Step 4: Add Redirect Rules
In **"Redirects/Rewrites"** section:
```
Source: /*
Destination: /index.html
Action: Rewrite
```

This ensures React Router works correctly.

#### Step 5: Deploy
1. Click **"Create Static Site"**
2. Wait for deployment (3-5 minutes)
3. Note your frontend URL: `https://school-report-frontend.onrender.com`

### Part 3: Update Backend CORS

After frontend is deployed, update backend environment variables:

1. Go to backend service on Render
2. Click **"Environment"**
3. Update `CORS_ALLOWED_ORIGINS`:
```
CORS_ALLOWED_ORIGINS=https://school-report-frontend.onrender.com
```
4. Click **"Save Changes"**
5. Service will automatically redeploy

## 🔧 Configuration Files

### Backend: build.sh
Already exists in your backend repo:
```bash
#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
```

### Backend: requirements.txt
Make sure it includes:
```
Django>=4.2
djangorestframework
django-cors-headers
gunicorn
psycopg2-binary
whitenoise
python-decouple
Pillow
reportlab
```

### Frontend: package.json
Make sure build script exists:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

## 🔐 Security Checklist

### Backend
- [ ] `DEBUG=False` in production
- [ ] Strong `SECRET_KEY` (generate new one)
- [ ] `ALLOWED_HOSTS` set correctly
- [ ] `CORS_ALLOWED_ORIGINS` set to frontend URL only
- [ ] Database credentials secure
- [ ] Email credentials secure (use app passwords)
- [ ] AWS credentials secure (if using S3)

### Frontend
- [ ] API URL points to production backend
- [ ] No sensitive data in environment variables
- [ ] Build optimized for production
- [ ] Redirects configured for SPA routing

## 🧪 Testing Deployment

### Test Backend
1. Visit: `https://school-report-backend.onrender.com/api/`
2. Should see API root or 404 (not 500 error)
3. Test login: `https://school-report-backend.onrender.com/api/auth/login/`

### Test Frontend
1. Visit: `https://school-report-frontend.onrender.com`
2. Should see login page
3. Try logging in with test credentials
4. Check browser console for errors
5. Verify API calls work

### Test CORS
1. Open browser console on frontend
2. Try making API request
3. Should not see CORS errors
4. If CORS errors, check backend `CORS_ALLOWED_ORIGINS`

## 🐛 Troubleshooting

### Backend Issues

**Build Fails**
- Check `build.sh` has execute permissions
- Verify `requirements.txt` is complete
- Check Python version compatibility

**Database Connection Fails**
- Verify `DATABASE_URL` is set
- Check PostgreSQL database is created
- Run migrations: `python manage.py migrate`

**Static Files Not Loading**
- Run `python manage.py collectstatic`
- Check `STATIC_ROOT` and `STATIC_URL` settings
- Verify `whitenoise` is installed

**500 Errors**
- Check Render logs: Dashboard → Service → Logs
- Look for Python tracebacks
- Verify all environment variables are set

### Frontend Issues

**Build Fails**
- Check `package.json` has build script
- Verify all dependencies in `package.json`
- Check Node version compatibility

**Blank Page**
- Check browser console for errors
- Verify `dist` folder is published
- Check redirect rules are set

**API Calls Fail**
- Verify `VITE_API_URL` is correct
- Check CORS settings on backend
- Look for network errors in browser console

**Routing Doesn't Work**
- Add redirect rule: `/* → /index.html`
- Verify SPA mode is enabled

## 📊 Monitoring

### Render Dashboard
- **Logs**: Real-time logs for debugging
- **Metrics**: CPU, Memory, Request count
- **Events**: Deployment history
- **Health**: Service status

### Set Up Alerts
1. Go to service settings
2. Enable **"Health Check"**
3. Set up **"Notifications"** for failures

## 🔄 Continuous Deployment

Render automatically deploys when you push to GitHub:

### Auto-Deploy Backend
```bash
cd "c:\Users\ADMIN\Desktop\school sasa report"
git add backend/
git commit -m "Update backend"
git subtree push --prefix=backend backend main
```

### Auto-Deploy Frontend
```bash
cd "c:\Users\ADMIN\Desktop\school sasa report"
git add frontend/
git commit -m "Update frontend"
git subtree push --prefix=frontend frontend main
```

## 💰 Pricing

### Free Tier
- **Web Services**: 750 hours/month (enough for 1 service)
- **Static Sites**: Unlimited
- **PostgreSQL**: 90 days free, then $7/month
- **Bandwidth**: 100 GB/month

### Paid Plans
- **Starter**: $7/month per service
- **Standard**: $25/month per service
- **Pro**: $85/month per service

## 🎯 Next Steps

1. ✅ Deploy backend to Render
2. ✅ Deploy frontend to Render
3. ✅ Update CORS settings
4. ✅ Test login and API calls
5. ✅ Set up custom domain (optional)
6. ✅ Enable HTTPS (automatic on Render)
7. ✅ Set up monitoring and alerts
8. ✅ Configure backups for database

## 📚 Resources

- **Render Docs**: https://render.com/docs
- **Django Deployment**: https://render.com/docs/deploy-django
- **Static Sites**: https://render.com/docs/static-sites
- **Environment Variables**: https://render.com/docs/environment-variables
- **Custom Domains**: https://render.com/docs/custom-domains

## 🆘 Support

If you encounter issues:
1. Check Render logs first
2. Review this guide
3. Check Render documentation
4. Contact Render support: https://render.com/support

---

**Your repositories are ready for deployment!** 🚀

Just follow the steps above to deploy to Render.
