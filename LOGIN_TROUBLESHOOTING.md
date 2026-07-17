# Login Troubleshooting Guide

## Issue: Login fails and page auto-refreshes

### Quick Fix Steps:

1. **Start Backend Server First**
   ```
   Double-click: start_both_servers.bat
   ```
   OR manually:
   ```
   cd backend
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Verify Backend is Running**
   - Open browser: http://localhost:8000
   - Should see Django page or API response
   - Check console for any errors

3. **Test API Connection**
   ```
   python test_backend_connection.py
   ```

4. **Check Frontend Configuration**
   - Frontend should connect to: http://localhost:8000/api
   - Verify .env.development file has correct API URL

### Common Login Credentials:

**For Testing (if users exist):**
- Teacher: teacher@school.edu / password123
- Student: std_STD001 / password123
- Admin: admin@school.edu / password123

### Create Test Users:

If no users exist, run:
```
cd backend
python create_test_student.py
python create_test_teacher.py
```

### Debug Steps:

1. **Check Browser Console (F12)**
   - Look for network errors
   - Check if API calls are failing
   - Verify CORS errors

2. **Check Backend Logs**
   - Look at Django server console
   - Check for authentication errors
   - Verify database connections

3. **Network Issues**
   - Ensure both servers are on correct ports:
     - Backend: http://localhost:8000
     - Frontend: http://localhost:8080
   - Check firewall settings
   - Verify no other services using these ports

### Error Messages:

- **"Network Error"** → Backend not running
- **"CORS Error"** → CORS configuration issue
- **"Invalid credentials"** → Wrong username/password
- **"Too many attempts"** → Account temporarily locked

### Reset Everything:

If all else fails:
1. Stop both servers (Ctrl+C)
2. Run: `start_both_servers.bat`
3. Wait 10 seconds for both to fully start
4. Try login again

### Contact Support:

If issues persist, check:
- Python version (3.8+)
- Node.js version (16+)
- Network connectivity
- Antivirus/firewall blocking ports