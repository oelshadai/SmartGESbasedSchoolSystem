# 🚀 Quick Deployment Reference

## 📦 Repositories

| Type | URL | Status |
|------|-----|--------|
| Backend | https://github.com/oelshadai/schoolreportbackend | ✅ Ready |
| Frontend | https://github.com/oelshadai/schoolreportfrontend | ✅ Ready |

## 🔧 Render Configuration

### Backend (Web Service)
```
Name: school-report-backend
Runtime: Python 3
Build: ./build.sh
Start: gunicorn school_report_saas.wsgi:application
```

### Frontend (Static Site)
```
Name: school-report-frontend
Build: npm install && npm run build
Publish: dist
```

## 🔐 Environment Variables

### Backend
```bash
SECRET_KEY=generate-new-secret-key
DEBUG=False
ALLOWED_HOSTS=.onrender.com
CORS_ALLOWED_ORIGINS=https://your-frontend.onrender.com
DATABASE_URL=auto-provided-by-render
```

### Frontend
```bash
VITE_API_URL=https://your-backend.onrender.com/api
```

## 📝 Deployment Steps

1. **Deploy Backend** → Render Dashboard → New Web Service
2. **Deploy Frontend** → Render Dashboard → New Static Site
3. **Update CORS** → Backend env vars → Add frontend URL
4. **Test** → Visit frontend URL → Login

## 🔄 Update Commands

### Push Backend Updates
```bash
cd "c:\Users\ADMIN\Desktop\school sasa report"
git add backend/
git commit -m "Update backend"
git subtree push --prefix=backend backend main
```

### Push Frontend Updates
```bash
cd "c:\Users\ADMIN\Desktop\school sasa report"
git add frontend/
git commit -m "Update frontend"
git subtree push --prefix=frontend frontend main
```

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check logs, verify requirements.txt |
| 500 errors | Check env vars, run migrations |
| CORS errors | Update CORS_ALLOWED_ORIGINS |
| Blank page | Check API URL, verify redirects |
| Login fails | Check backend URL, test API |

## 📚 Documentation

- **Full Guide**: RENDER_DEPLOYMENT_GUIDE.md
- **Verification**: REPOSITORY_VERIFICATION.md
- **Summary**: DEPLOYMENT_READY_SUMMARY.md

## ✅ Pre-Flight Checklist

- [ ] Backend repo pushed
- [ ] Frontend repo pushed
- [ ] Render account ready
- [ ] GitHub connected to Render
- [ ] Environment variables prepared
- [ ] Database plan selected

## 🎯 Post-Deployment

- [ ] Test login (all roles)
- [ ] Test assignment creation
- [ ] Test grading system
- [ ] Test student portal
- [ ] Set up monitoring
- [ ] Configure custom domain

---

**Ready to deploy!** Follow RENDER_DEPLOYMENT_GUIDE.md for details.
