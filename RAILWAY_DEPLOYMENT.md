# Railway Deployment Guide

## Prerequisites
1. Railway account (https://railway.app)
2. GitHub repository with your code

## Backend Deployment

### 1. Create Railway Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new
```

### 2. Add PostgreSQL Database
- In Railway dashboard, click "New Service"
- Select "Database" → "PostgreSQL"
- Railway will automatically provide DATABASE_URL

### 3. Deploy Backend
- Connect your GitHub repository
- Select the `backend` folder as root directory
- Select Docker as the build method and use `backend/Dockerfile`

### 4. Set Environment Variables
Copy variables from `railway.env.template` and set them in Railway dashboard:
- Go to your service → Variables tab
- Add each environment variable

### 5. Update Domain Settings
After deployment, update these variables with your actual Railway URLs:
- `ALLOWED_HOSTS`: Add your Railway backend URL
- `CORS_ALLOWED_ORIGINS`: Add your Railway frontend URL
- `CSRF_TRUSTED_ORIGINS`: Add both frontend and backend URLs
- `MEDIA_URL_BASE`: Set to your backend Railway URL
- `FRONTEND_URL`: Set to your frontend Railway URL

## Frontend Deployment

### 1. Create Frontend Service
- In same Railway project, click "New Service"
- Connect same GitHub repository
- Select the `frontend` folder as root directory
### 2. Set Frontend Build Method
- Select Docker as the build method and use `frontend/Dockerfile`

### 3. Set Frontend Environment Variables
```
VITE_API_URL=https://your-backend.railway.app/api
VITE_APP_ENV=production
```

### 3. Build Settings
Railway will automatically:
- Install dependencies with `npm install`
- Build with `npm run build`
- Serve with static file server

## Database Migration

### 1. Run Migrations
In Railway backend service terminal:
```bash
python manage.py migrate
```

### 2. Create Superuser
```bash
python manage.py createsuperuser
```

### 3. Load Initial Data (if needed)
```bash
python manage.py loaddata initial_data.json
```

## Custom Domain (Optional)

### 1. Add Custom Domain
- Go to service → Settings → Domains
- Add your custom domain
- Update DNS records as instructed

### 2. Update Environment Variables
Update ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS, etc. with your custom domain

## Monitoring and Logs

### View Logs
```bash
railway logs
```

### Monitor Resources
- Check CPU/Memory usage in Railway dashboard
- Set up alerts if needed

## Troubleshooting

### Common Issues
1. **Static files not loading**: Ensure `python manage.py collectstatic` runs in build phase
2. **CORS errors**: Check CORS_ALLOWED_ORIGINS includes frontend URL
3. **Database connection**: Verify DATABASE_URL is set automatically by Railway
4. **Media files**: Ensure MEDIA_URL_BASE points to backend URL

### Debug Mode
Temporarily set `DEBUG=True` to see detailed error messages, then set back to `False`

## Security Checklist
- [ ] DEBUG=False in production
- [ ] Strong SECRET_KEY
- [ ] Proper ALLOWED_HOSTS
- [ ] CORS settings configured
- [ ] HTTPS enforced
- [ ] Database credentials secure