import { useState } from 'react';
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
    <div className="login-page min-h-[100dvh] bg-slate-50 flex flex-col overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 relative">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative w-full max-w-6xl mx-auto my-auto">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">

          {/* Left side - Branding (desktop only) */}
          <div className="hidden lg:flex flex-col justify-center p-4 xl:p-8">
            <div className="flex flex-col items-center space-y-8 text-center">
              {/* Logo */}
              <div className="flex items-center justify-center gap-4">
                <div className="relative flex h-36 w-36 items-center justify-center rounded-[50%] bg-slate-900 p-3 shadow-lg shadow-slate-900/20">
                  <img
                    src="/EliteTech logo with 3D cube design.png"
                    alt="Smart School Management System"
                    className="h-32 w-32 object-contain drop-shadow-[0_0_20px_rgba(37,99,235,0.25)]"
                  />
                </div>
              </div>

              {/* Headline */}
              <div className="space-y-4">
                <h2 className="text-4xl xl:text-5xl font-extrabold leading-[1.15]">
                  <span className="text-slate-900">Smart School</span>
                  <br />
                    <span className="login-gradient-text">
                    Management System
                  </span>
                </h2>
                <p className="text-base text-slate-600 leading-relaxed max-w-md">
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
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center transition-all">
                      <CheckCircle2 className="h-3.5 w-3.5 text-slate-700" />
                    </div>
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>


            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="relative flex justify-center">
            <div className="login-glow-card w-full max-w-md">
              <div className="login-glow-card-inner p-5 sm:p-8">

                {/* Mobile: logo + title in one compact row */}
                <div className="lg:hidden flex items-center gap-2 mb-5 sm:mb-5">
                  <img
                    src="/EliteTech logo with 3D cube design.png"
                    alt="Smart School Management System"
                    className="h-8 w-8 sm:h-14 sm:w-14 flex-shrink-0 object-contain drop-shadow-[0_0_12px_rgba(37,99,235,0.18)]"
                  />
                  <div>
                    <h3 className="text-[13px] sm:text-xl font-extrabold leading-tight">
                      <span className="text-slate-900">Smart School </span>
                      <span className="login-gradient-text">Management System</span>
                    </h3>
                    <p className="text-slate-600 text-[9px] sm:text-sm">Sign in to access your dashboard</p>
                  </div>
                </div>

                {/* Role Selection */}
                <div className="mb-5 sm:mb-5">
                  <Label className="text-blue-700 text-[9px] sm:text-xs font-medium mb-2 sm:mb-2.5 block tracking-wide uppercase">Select Your Role</Label>
                  <div className="grid grid-cols-4 gap-1 sm:gap-2">
                    {ROLE_CONFIGS.map((role) => {
                      const RoleIcon = role.icon;
                      const isActive = loginRole === role.key;
                      return (
                        <button
                          key={role.key}
                          type="button"
                          onClick={() => handleRoleChange(role.key)}
                          className={`relative group px-1 py-1 sm:py-3 rounded-xl transition-all duration-200 ${
                            isActive
                              ? 'bg-slate-900 text-white shadow-sm scale-[1.02]'
                              : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                            <RoleIcon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-800'}`} />
                            <span className={`text-[9px] sm:text-[11px] font-medium ${isActive ? 'text-white' : 'text-slate-700 group-hover:text-slate-900'}`}>
                              {role.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="hidden sm:block text-[10px] sm:text-[11px] text-slate-600 mt-1.5 text-center">{currentRole.description}</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-4">
                  {error && (
                    <div className="p-2 sm:p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-2">
                      <div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
                        <span className="text-[9px] sm:text-[10px] font-bold">!</span>
                      </div>
                      <span className="text-[10px] sm:text-sm leading-snug">{error}</span>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="identifier" className="text-slate-700 text-[10px] sm:text-sm font-medium block mb-0.5">
                      {currentRole.inputType === 'studentId' ? 'Student ID' : 'Email Address'}
                    </Label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500" />
                      <Input
                        id="identifier"
                        type={currentRole.inputType === 'email' ? 'email' : 'text'}
                        placeholder={currentRole.placeholder}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        className="pl-9 h-11 sm:h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-200 rounded-xl text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <Label htmlFor="password" className="text-slate-700 text-[10px] sm:text-sm font-medium">Password</Label>
                      {loginRole === 'student' || loginRole === 'parent' ? (
                        <span className="text-[9px] sm:text-[11px] text-slate-500">Contact admin to reset</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setShowForgot(true); setForgotMessage(''); setForgotError(''); }}
                          className="text-[9px] sm:text-[11px] text-sky-600 hover:text-sky-700 transition-colors"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-9 pr-9 h-11 sm:h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-200 rounded-xl text-xs sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-sm transition-all duration-200 text-xs sm:text-sm"
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
                </form>

                {/* Divider */}
                <div className="relative my-4 sm:my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[10px]">
                    <span className="bg-white px-3 text-slate-500">New to the platform?</span>
                  </div>
                </div>

                {/* Register Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/register')}
                  className="w-full h-10 sm:h-11 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 rounded-xl transition-all duration-200 text-xs sm:text-sm"
                >
                  Register Your School
                </Button>

                {/* Footer */}
                <div className="mt-1.5 sm:mt-5 text-center hidden sm:block">
                  <p className="text-[10px] text-slate-500">
                    By signing in, you agree to our{' '}
                    <a href="#" className="text-sky-600 hover:text-sky-700 transition-colors">Terms</a>
                    {' '}and{' '}
                    <a href="#" className="text-sky-600 hover:text-sky-700 transition-colors">Privacy Policy</a>
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
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-xl shadow-slate-200/70">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-900 font-semibold text-base sm:text-lg">Reset Password</h2>
              <button onClick={() => setShowForgot(false)} className="text-slate-500 hover:text-slate-700 transition-colors p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm mb-4">Enter your email address and we'll send you a reset link.</p>
            {forgotMessage ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-700 text-sm">{forgotMessage}</div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Label htmlFor="forgot-email" className="text-slate-700 text-sm">Email Address</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="mt-1 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-500"
                  />
                </div>
                {forgotError && <p className="text-red-500 text-xs">{forgotError}</p>}
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
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
