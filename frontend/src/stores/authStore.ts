import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

// Security-enhanced auth state interface
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  sessionExpiry: number | null;
  lastActivity: number;
  securityLevel: 'low' | 'medium' | 'high';
  
  // Actions
  setAuth: (user: User, access: string, refresh: string) => void;
  setTokens: (access: string, refresh: string) => void;
  updateLastActivity: () => void;
  checkSessionValidity: () => boolean;
  logout: () => void;
  
  // Security utilities
  hasPermission: (permission: string) => boolean;
  requiresReauth: () => boolean;
}

// Session timeout configuration (in milliseconds)
const SESSION_CONFIG = {
  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_SESSION_DURATION: 8 * 60 * 60 * 1000, // 8 hours
  REAUTH_REQUIRED_ACTIONS: ['password_change', 'sensitive_data_access']
};

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['*'], // All permissions
  SCHOOL_ADMIN: [
    'manage_school', 'manage_teachers', 'manage_students', 
    'view_reports', 'manage_classes', 'manage_subjects'
  ],
  PRINCIPAL: [
    'manage_school', 'manage_teachers', 'manage_students',
    'view_reports', 'manage_classes', 'approve_grades'
  ],
  TEACHER: [
    'manage_assignments', 'grade_students', 'view_students',
    'manage_attendance', 'create_reports'
  ],
  STUDENT: [
    'view_assignments', 'submit_assignments', 'view_grades',
    'view_attendance', 'view_profile'
  ],
  PARENT: [
    'view_children_grades', 'view_children_attendance', 'view_children_fees', 'view_children_reports'
  ]
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      sessionExpiry: null,
      lastActivity: Date.now(),
      securityLevel: 'medium',
      
      setAuth: (user, access, refresh) => {
        const now = Date.now();
        const expiry = now + SESSION_CONFIG.MAX_SESSION_DURATION;
        
        // Determine security level based on user role
        const securityLevel = ['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user.role) ? 'high' : 'medium';
        
        set({ 
          user, 
          accessToken: access, 
          refreshToken: refresh, 
          isAuthenticated: true,
          sessionExpiry: expiry,
          lastActivity: now,
          securityLevel
        });
      },
      
      setTokens: (access, refresh) => {
        const state = get();
        set({ 
          accessToken: access, 
          refreshToken: refresh,
          lastActivity: Date.now()
        });
      },
      
      updateLastActivity: () => {
        set({ lastActivity: Date.now() });
      },
      
      checkSessionValidity: () => {
        const state = get();
        const now = Date.now();
        
        if (!state.isAuthenticated || !state.sessionExpiry) {
          return false;
        }
        
        // Check if session has expired
        if (now > state.sessionExpiry) {
          get().logout();
          return false;
        }
        
        // Check for idle timeout
        const idleTime = now - state.lastActivity;
        if (idleTime > SESSION_CONFIG.IDLE_TIMEOUT) {
          get().logout();
          return false;
        }
        
        return true;
      },
      
      logout: () => {
        // Clear all auth data
        set({ 
          user: null, 
          accessToken: null, 
          refreshToken: null, 
          isAuthenticated: false,
          sessionExpiry: null,
          lastActivity: Date.now(),
          securityLevel: 'medium'
        });
        
        // Clear tokens from storage
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('token_timestamp');
        sessionStorage.removeItem('user_data');
        localStorage.removeItem('access_token');
        localStorage.removeItem('token_timestamp');
        localStorage.removeItem('refresh_token');
      },
      
      hasPermission: (permission: string) => {
        const state = get();
        if (!state.user || !state.isAuthenticated) {
          return false;
        }
        
        const userPermissions = ROLE_PERMISSIONS[state.user.role] || [];
        return userPermissions.includes('*') || userPermissions.includes(permission);
      },
      
      requiresReauth: () => {
        const state = get();
        if (!state.isAuthenticated) return true;
        
        // High security users need more frequent reauth
        if (state.securityLevel === 'high') {
          const timeSinceAuth = Date.now() - state.lastActivity;
          return timeSinceAuth > (15 * 60 * 1000); // 15 minutes for high security
        }
        
        return false;
      }
    }),
    { 
      name: 'auth-storage',
      // Only persist non-sensitive data
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        securityLevel: state.securityLevel,
        sessionExpiry: state.sessionExpiry
      })
    }
  )
);

export const getRoleDashboardPath = (role: UserRole): string => {
  const routes: Record<UserRole, string> = {
    SUPER_ADMIN: '/admin/dashboard',
    SCHOOL_ADMIN: '/school/dashboard',
    PRINCIPAL: '/school/dashboard',
    TEACHER: '/teacher/dashboard',
    STUDENT: '/student/dashboard',
    PARENT: '/parent/dashboard',
  };
  return routes[role] || '/login';
};
