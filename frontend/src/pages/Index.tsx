import { Navigate } from 'react-router-dom';
import { useAuthStore, getRoleDashboardPath } from '@/stores/authStore';

const Index = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) {
    return <Navigate to={getRoleDashboardPath(user.role)} replace />;
  }
  return <Navigate to="/login" replace />;
};

export default Index;
