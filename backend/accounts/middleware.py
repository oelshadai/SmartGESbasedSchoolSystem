from django.http import JsonResponse
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings
from django.utils import timezone
import jwt

User = get_user_model()


class LastSeenMiddleware:
    """Updates user.last_seen on every authenticated API request."""

    # Only update DB at most once every 60 seconds per user to avoid hammering the DB
    UPDATE_INTERVAL = 60

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        self._update_last_seen(request)
        return response

    def _update_last_seen(self, request):
        try:
            user = getattr(request, 'user', None)
            if not user or not user.is_authenticated:
                return
            now = timezone.now()
            # Throttle: skip if updated recently
            if user.last_seen and (now - user.last_seen).total_seconds() < self.UPDATE_INTERVAL:
                return
            User.objects.filter(pk=user.pk).update(last_seen=now)
        except Exception:
            pass  # Never let this break a request


class RoleBasedAccessMiddleware:
    """Strict role-based access control middleware"""
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip auth for public endpoints
        public_paths = ['/api/auth/login/', '/api/auth/student-login/', '/api/health/']
        if any(request.path.startswith(path) for path in public_paths):
            return self.get_response(request)

        # Extract and validate JWT token
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Authentication required'}, status=401)

        token = auth_header.split(' ')[1]
        
        try:
            # Validate token
            UntypedToken(token)
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = decoded.get('user_id')
            
            # Get user and validate role
            user = User.objects.get(id=user_id, is_active=True)
            request.user = user
            
            # Role-based endpoint protection
            if not self._check_role_permissions(request, user.role):
                return JsonResponse({'error': 'Insufficient permissions'}, status=403)
                
        except (InvalidToken, TokenError, User.DoesNotExist, jwt.InvalidTokenError):
            return JsonResponse({'error': 'Invalid token'}, status=401)

        return self.get_response(request)

    def _check_role_permissions(self, request, user_role):
        """Check if user role has access to requested endpoint"""
        path = request.path
        method = request.method
        
        # Super admin has access to everything
        if user_role == 'SUPER_ADMIN':
            return True
            
        # Role-specific restrictions
        role_permissions = {
            'SCHOOL_ADMIN': ['/api/schools/', '/api/teachers/', '/api/students/', '/api/reports/'],
            'TEACHER': ['/api/assignments/', '/api/students/', '/api/scores/', '/api/attendance/'],
            'STUDENT': ['/api/assignments/student/', '/api/students/dashboard/']
        }
        
        allowed_paths = role_permissions.get(user_role, [])
        return any(path.startswith(allowed_path) for allowed_path in allowed_paths)