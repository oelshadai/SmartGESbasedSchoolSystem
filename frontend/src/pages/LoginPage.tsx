import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, getRoleDashboardPath } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Loader2, BookOpen, Lock, LucideIcon } from 'lucide-react';
import AnimatedLogoBackground from '@/components/AnimatedLogoBackground';

type LoginRole = 'student' | 'teacher' | 'admin' | 'superadmin';

interface RoleConfig {
  key: LoginRole;
  label: string;
  icon: LucideIcon;
  loginMethod: (identifier: string, password: string) => Promise<any>;
  inputType: 'email' | 'studentId';
  placeholder: string;
}

// Visible role tabs — superadmin is intentionally omitted
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

const SUPERADMIN_CONFIG: RoleConfig = {
  key: 'superadmin',
  label: 'System',
  icon: Lock,
  loginMethod: authService.superadminLogin,
  inputType: 'email',
  placeholder: 'system@platform.internal'
};

const LoginPage = () => {
  const [loginRole, setLoginRole] = useState<LoginRole>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [superAdminMode, setSuperAdminMode] = useState(false);
  const secretClickCount = useRef(0);
  const secretClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const currentRole = superAdminMode
    ? SUPERADMIN_CONFIG
    : ROLE_CONFIGS.find(role => role.key === loginRole)!;

  // Secret trigger: click logo 5 times within 3 seconds to activate system access
  const handleLogoSecretClick = () => {
    secretClickCount.current += 1;
    if (secretClickTimer.current) clearTimeout(secretClickTimer.current);
    secretClickTimer.current = setTimeout(() => {
      secretClickCount.current = 0;
    }, 3000);
    if (secretClickCount.current >= 5) {
      secretClickCount.current = 0;
      setSuperAdminMode(true);
      setLoginRole('superadmin');
      setIdentifier('');
      setError('');
    }
  };

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
    setSuperAdminMode(false);
    setLoginRole(role);
    setIdentifier('');
    setError('');
  };

  return (
    <div className="flex min-h-screen relative">
      {/* Animated background logos covering entire page */}
      <AnimatedLogoBackground />
      
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-8 xl:p-12 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(175_42%_46%/0.15),transparent_60%)]" style={{ zIndex: 2 }} />
        <div className="relative z-10 text-primary-foreground max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-xl bg-secondary/20 backdrop-blur-sm cursor-pointer select-none"
              onClick={handleLogoSecretClick}
            >
              <img 
                src="/EliteTech logo with sleek design.png" 
                alt="School Report SaaS" 
                className="h-10 w-10 object-contain"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight">
            School Report <span className="text-secondary">SaaS</span>
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
      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:p-8 bg-background">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <div className="lg:hidden flex flex-col items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/10">
              <img 
                src="/EliteTech logo with sleek design.png" 
                alt="School Report SaaS" 
                className="h-10 w-10 object-contain"
              />
            </div>
            <span className="text-lg sm:text-xl font-bold text-foreground">School Report SaaS</span>
          </div>

          <div className="space-y-1 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <div className="space-y-3">
            {superAdminMode ? (
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-muted-foreground">System Access</Label>
                <button
                  type="button"
                  onClick={() => handleRoleChange('admin')}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <Label className="text-sm font-medium">Login as:</Label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLE_CONFIGS.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleRoleChange(key)}
                      className={`py-2.5 px-3 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                        loginRole === key
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="identifier">
                {currentRole.inputType === 'studentId' ? 'Student ID' : 'Email Address'}
              </Label>
              <Input
                id="identifier"
                type={currentRole.inputType === 'email' ? 'email' : 'text'}
                placeholder={currentRole.placeholder}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full h-11 text-sm sm:text-base" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Connecting...' : 'Sign In'}
            </Button>

            {loading && (
              <p className="text-xs text-muted-foreground text-center animate-pulse">
                Server may take a moment to wake up on first request
              </p>
            )}

            <div className="relative">
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
              className="w-full"
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
