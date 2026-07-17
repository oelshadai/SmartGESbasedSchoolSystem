# Login Troubleshooting Guide

## Common Causes and Solutions

### 1. **API Connection Issues**
- **Check Backend Status**: Ensure your Django backend is running on the correct port
- **CORS Configuration**: Verify CORS settings allow frontend requests
- **API URL**: Confirm the API URL in your frontend matches the backend

### 2. **Authentication Endpoint Issues**
Your system has two login endpoints:
- **Staff Login**: `/auth/login/` (for teachers, admins)
- **Student Login**: `/auth/student-login/` (for students)

### 3. **Rate Limiting**
Your system has aggressive rate limiting:
- **IP Rate Limit**: 15 attempts per hour per IP
- **Email Rate Limit**: 8 attempts per 30 minutes per email
- **Student Rate Limit**: 10 attempts per 30 minutes per student ID

### 4. **Account Lockout**
Accounts get locked after failed attempts with progressive delays:
- 5 failed attempts → 5-minute lockout
- More attempts → longer lockouts (up to 2 hours)

## Quick Fixes

### Fix 1: Clear Rate Limiting Cache
```python
# Run this in Django shell: python manage.py shell
from django.core.cache import cache
cache.clear()
```

### Fix 2: Check User Credentials
```python
# Run in Django shell
from django.contrib.auth import get_user_model
User = get_user_model()

# For staff login
user = User.objects.get(email='your_email@example.com')
print(f"User exists: {user.email}")
print(f"Is active: {user.is_active}")
print(f"Role: {user.role}")

# For student login
from students.models import Student
student = Student.objects.get(student_id='your_student_id')
print(f"Student ID: {student.student_id}")
print(f"Password: {student.password}")
```

### Fix 3: Reset Password
```python
# In Django shell
user = User.objects.get(email='your_email@example.com')
user.set_password('Password123!')
user.save()
```

### Fix 4: Check API Connectivity
Create a test file to verify API connection:
```html
<!DOCTYPE html>
<html>
<head><title>API Test</title></head>
<body>
<script>
fetch('https://school-report-saas.onrender.com/api/auth/login/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123'
    })
})
.then(response => response.json())
.then(data => console.log('API Response:', data))
.catch(error => console.error('API Error:', error));
</script>
</body>
</html>
```

## Debugging Steps

### Step 1: Check Backend Logs
Look for error messages in your Django console output.

### Step 2: Verify Environment Variables
Ensure your `.env` file has correct database and security settings.

### Step 3: Test with Known Credentials
Try logging in with a test account you know exists.

### Step 4: Check Network Tab
In browser DevTools, check the Network tab for:
- 401 Unauthorized
- 429 Too Many Requests
- 500 Internal Server Error
- CORS errors

## Create Test Accounts

### Create Test Teacher
```python
# In Django shell
from django.contrib.auth import get_user_model
from schools.models import School

User = get_user_model()
school = School.objects.first()  # or create one

user = User.objects.create_user(
    email='teacher@test.com',
    password='Password123!',
    first_name='Test',
    last_name='Teacher',
    role='TEACHER',
    school=school
)
```

### Create Test Student
```python
# In Django shell
from students.models import Student
from schools.models import School, Class

school = School.objects.first()
class_obj = Class.objects.first()

student = Student.objects.create(
    student_id='STD001',
    first_name='Test',
    last_name='Student',
    password='Password123!',
    school=school,
    current_class=class_obj
)
```

## Security Bypass (Temporary)

If you need to temporarily bypass security for testing:

1. **Disable Rate Limiting**: Comment out rate limiting checks in `accounts/views.py`
2. **Disable Account Lockout**: Comment out lockout checks
3. **Simplify Password Validation**: Use basic password validation

## Common Error Messages

- **"Invalid credentials"**: Wrong email/password or account doesn't exist
- **"Too many login attempts"**: Rate limiting triggered
- **"Account locked"**: Account temporarily locked due to failed attempts
- **"IP temporarily blocked"**: IP-based rate limiting
- **"Authentication failed"**: Server error or database issue

## Next Steps

1. Try the quick fixes above
2. Check your specific error in browser DevTools
3. Verify your test credentials exist in the database
4. Clear cache and rate limiting
5. If still failing, check backend logs for detailed error messages

## Emergency Access

If completely locked out, you can create a superuser:
```bash
python manage.py createsuperuser
```

Then use Django admin to manage users and reset passwords.