import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Subscription lock check – only for school-level users, not on the subscription page itself
  if (
    user.role === 'SCHOOL_ADMIN' &&
    !location.pathname.startsWith('/school/subscription') &&
    !location.pathname.startsWith('/subscription-locked')
  ) {
    const schoolData = (user as any).school_subscription;
    if (schoolData?.is_locked) {
      return <Navigate to="/subscription-locked" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
