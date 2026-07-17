# QUICK FIX INSTRUCTIONS

## Issue 1: System opens teacher dashboard instead of login page

**SOLUTION:** Clear browser authentication data

1. Open browser console (F12)
2. Copy and paste this code:

```javascript
// Clear all authentication data
localStorage.clear();
sessionStorage.clear();
console.log('Auth data cleared');
window.location.href = '/login';
```

3. Press Enter
4. Browser will redirect to login page

## Issue 2: Assignment publish shows success but fails (404 error)

**ROOT CAUSE:** User is not properly authenticated

**SOLUTION:** 
1. First clear auth data (see Issue 1)
2. Go to login page: http://localhost:8080/login
3. Login as Teacher with these credentials:
   - Email: `nanaamaadomah18@gmail.com`
   - Password: `password123`
4. After successful login, go to assignments page
5. Try publishing assignment again

## Backend Server Check

Make sure Django backend is running:
```bash
cd backend
python manage.py runserver 127.0.0.1:8000
```

## Test Login Credentials

If the above credentials don't work, run this in backend directory:
```bash
python reset_teacher_password.py
```

This will show you the correct email and password to use.

## Expected Result

After following these steps:
✅ System opens login page first
✅ User can login successfully  
✅ Assignment publish works without 404 errors
✅ Console shows success messages instead of errors

The 404 error happens because the user is not authenticated, so the API endpoints return "Not Found" instead of the actual data.