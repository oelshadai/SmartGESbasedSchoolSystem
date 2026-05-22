import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, getRoleDashboardPath } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Loader2, BookOpen, Lock, LucideIcon } from 'lucide-react';
import AnimatedLogoBackground from '@/components/AnimatedLogoBackground';

type LoginRole = 'student' | 'teacher' | 'admin';

interface RoleConfig {
  key: LoginRole;
  label: string;
  icon: LucideIcon;
  loginMethod: (identifier: string, password: string) => Promise<any>;
  inputType: 'email' | 'studentId';
  placeholder: string;
}

// Visible role tabs
const ROLE_CONFIGS: RoleConfig[] = [
  {
    key: 'student',
    label: 'Student',
    icon: GraduationCap,
    loginMethod: authService.studentLogin,
    inputType: 'studentId',
    placeholder: 'Enter your Student ID (e.g. STD001)'
  },
  {
    key: 'teacher',
    label: 'Teacher',
    icon: BookOpen,
    loginMethod: authService.teacherLogin,
    inputType: 'email',
    placeholder: 'name@school.edu'
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: Lock,
    loginMethod: authService.adminLogin,
    inputType: 'email',
    placeholder: 'admin@school.edu'
  }
];

const LoginPage = () => {
  const [loginRole, setLoginRole] = useState<LoginRole>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  // Prevent flash of unstyled content
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentRole = ROLE_CONFIGS.find(role => role.key === loginRole)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await currentRole.loginMethod(identifier, password);
      setAuth(data.user, data.access, data.refresh);
      
      const storedRefresh = localStorage.getItem('refresh_token');
      if (!storedRefresh) {
        setError('Login failed: No refresh token was saved. Please contact support or try again.');
        return;
      }

      navigate(getRoleDashboardPath(data.user.role));
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.error || 
                          err.message || 
                          'Login failed. Please check your credentials.';
      
      setError(import.meta.env.DEV && err.response?.data?.debug 
        ? `${errorMessage} (Debug: ${JSON.stringify(err.response.data.debug)})`
        : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: LoginRole) => {
    setLoginRole(role);
    setIdentifier('');
    setError('');
  };

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen relative overflow-hidden">
      {/* Animated background logos covering entire page */}
      <AnimatedLogoBackground />
      
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-8 xl:p-12 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(175_42%_46%/0.15),transparent_60%)]" style={{ zIndex: 2 }} />
        <div className="relative z-10 text-primary-foreground max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-secondary/20 backdrop-blur-sm">
              <img 
                src="/EliteTech logo with 3D cube design.png" 
                alt="GES School Management System" 
                className="h-10 w-10 object-contain"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight">
            Elitech Smart <span className="text-secondary">School Management System</span>
          </h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            A comprehensive school management platform for administrators, teachers, and students. Manage assignments, track performance, and generate reports effortlessly.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {['Assignment Management', 'Grade Tracking', 'Report Generation', 'Real-time Analytics'].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-primary-foreground/60">
                <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-4 sm:p-8 bg-background">
        <div className="w-full max-w-md space-y-2 sm:space-y-4">
          <div className="flex flex-col items-center gap-1 mb-2">
            <div className="p-2 rounded-xl bg-primary/10 select-none relative z-10">
              <img 
                src="/EliteTech logo with 3D cube design.png" 
                alt="GES School Management System" 
                className="h-8 w-8 sm:h-12 sm:w-12 object-contain"
              />
            </div>
            <span className="text-xs sm:text-lg font-bold text-foreground text-center leading-tight">Elitech Smart School Management</span>
          </div>

          <div className="space-y-0.5 text-center">
            <h2 className="text-base sm:text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Sign in to continue</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-medium">Login as:</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {ROLE_CONFIGS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleRoleChange(key)}
                  className={`py-1.5 px-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                    loginRole === key
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{label.slice(0,3)}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
            {error && (
              <div className="p-2 sm:p-3 rounded-lg bg-destructive/10 text-destructive text-xs sm:text-sm border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-xs sm:text-sm">
                {currentRole.inputType === 'studentId' ? 'Student ID' : 'Email'}
              </Label>
              <Input
                id="identifier"
                type={currentRole.inputType === 'email' ? 'email' : 'text'}
                placeholder={currentRole.placeholder}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <Button type="submit" className="w-full h-9 sm:h-10 text-sm" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
              {loading ? 'Connecting...' : 'Sign In'}
            </Button>

            {loading && (
              <p className="text-xs text-muted-foreground text-center animate-pulse">
                Server may take a moment to wake up
              </p>
            )}

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-9 sm:h-10 text-xs sm:text-sm"
              onClick={() => navigate('/register')}
            >
              Register Your School
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
