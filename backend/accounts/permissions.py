"""
Centralized DRF permission classes for the school SaaS system.
Import and use these on every view instead of writing ad-hoc role checks.
"""
from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    """Allow access only to users with the SUPER_ADMIN role."""
    message = 'Super admin access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'SUPER_ADMIN'
        )


class IsSchoolAdmin(permissions.BasePermission):
    """Allow access only to SCHOOL_ADMIN or PRINCIPAL for their own school."""
    message = 'School admin access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) in ('SCHOOL_ADMIN', 'PRINCIPAL')
        )


class IsSuperAdminOrSchoolAdmin(permissions.BasePermission):
    """Allow SUPER_ADMIN, SCHOOL_ADMIN, PRINCIPAL, or TEACHER."""
    message = 'Admin or teacher access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) in ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
        )


class IsTeacher(permissions.BasePermission):
    """Allow access only to TEACHER role."""
    message = 'Teacher access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'TEACHER'
        )


class ReadOnly(permissions.BasePermission):
    """Allow only safe HTTP methods (GET, HEAD, OPTIONS)."""
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS
