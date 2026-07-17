import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Shield, GraduationCap, BookOpen, Settings } from 'lucide-react';
import type { UserRole } from '@/types';

const AuthDemo = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const demoCredentials = {
    SUPER_ADMIN: { email: 'superadmin@school.edu', password: 'admin123' },
    SCHOOL_ADMIN: { email: 'admin@school.edu', password: 'admin123' },
    PRINCIPAL: { email: 'principal@school.edu', password: 'principal123' },
    TEACHER: { email: 'teacher@school.edu', password: 'teacher123' },
    STUDENT: { username: 'std_STD001', password: 'abc123' }
  };

  const roleIcons: Record<UserRole, React.ReactNode> = {
    SUPER_ADMIN: <Shield className="h-5 w-5" />,
    SCHOOL_ADMIN: <Settings className="h-5 w-5" />,
    PRINCIPAL: <User className="h-5 w-5" />,
    TEACHER: <BookOpen className="h-5 w-5" />,
    STUDENT: <GraduationCap className="h-5 w-5" />
  };

  const roleColors: Record<UserRole, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-800 border-red-200',
    SCHOOL_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    PRINCIPAL: 'bg-blue-100 text-blue-800 border-blue-200',
    TEACHER: 'bg-green-100 text-green-800 border-green-200',
    STUDENT: 'bg-orange-100 text-orange-800 border-orange-200'
  };

  const handleDemoLogin = async (role: UserRole) => {
    setLoading(true);
    try {
      const creds = demoCredentials[role];
      let data;
      
      if (role === 'STUDENT') {
        data = await authService.studentLogin(creds.username!, creds.password);
      } else {
        data = await authService.login(creds.email!, creds.password);
      }
      
      useAuthStore.getState().setAuth(data.user, data.access, data.refresh);
    } catch (error) {
      console.error('Demo login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
    }
  };

  if (isAuthenticated && user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {roleIcons[user.role]}
            <CardTitle>Welcome Back!</CardTitle>
          </div>
          <CardDescription>You are successfully logged in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="font-medium">{user.first_name} {user.last_name}</p>
            <Badge className={roleColors[user.role]}>
              {user.role.replace('_', ' ')}
            </Badge>
            {user.email && (
              <p className="text-sm text-muted-foreground">{user.email}</p>
            )}
            {user.username && (
              <p className="text-sm text-muted-foreground">ID: {user.username}</p>
            )}
            {user.school && (
              <p className="text-sm text-muted-foreground">{user.school.name}</p>
            )}
          </div>
          <Button onClick={handleLogout} variant="outline" className="w-full">
            Logout
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Authentication Demo</CardTitle>
        <CardDescription>
          Test login with different user roles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(demoCredentials).map(([role, creds]) => (
          <Button
            key={role}
            onClick={() => handleDemoLogin(role as UserRole)}
            disabled={loading}
            variant="outline"
            className="w-full justify-start gap-2"
          >
            {roleIcons[role as UserRole]}
            <span className="flex-1 text-left">
              {role === 'STUDENT' ? 'Student Login' : `${role.replace('_', ' ')} Login`}
            </span>
            <Badge variant="secondary" className="text-xs">
              {role === 'STUDENT' ? creds.username : creds.email}
            </Badge>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default AuthDemo;