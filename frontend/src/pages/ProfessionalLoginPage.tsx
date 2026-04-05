import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, getRoleDashboardPath } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Loader2, BookOpen, Lock, Shield, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';

type LoginRole = 'student' | 'teacher' | 'admin';

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
];

const ProfessionalLoginPage = () => {
  const [loginRole, setLoginRole] = useState<LoginRole>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative w-full max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-8 items-center">
          {/* Left side - Branding */}
          <div className="hidden lg:block space-y-8 p-8">
            <div className="space-y-6">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl blur-xl opacity-50" />
                  <div className="relative bg-gradient-to-br from-orange-500 to-amber-500 p-4 rounded-2xl">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">School Report</h1>
                  <p className="text-sm text-slate-400">SaaS Platform</p>
                </div>
              </div>

              {/* Headline */}
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-white leading-tight">
                  Modern School
                  <br />
                  <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                    Management System
                  </span>
                </h2>
                <p className="text-lg text-slate-400 leading-relaxed">
                  Streamline your educational institution with our comprehensive platform for assignments, grading, and reporting.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4 pt-4">
                {[
                  'Real-time grade tracking and analytics',
                  'Automated assignment management',
                  'Professional report generation',
                  'Secure cloud-based platform'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-slate-300">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-orange-400" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                {[
                  { label: 'Schools', value: '500+' },
                  { label: 'Students', value: '50K+' },
                  { label: 'Uptime', value: '99.9%' }
                ].map((stat, index) => (
                  <div key={index} className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="relative">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-800/50 shadow-2xl p-5 sm:p-8 lg:p-10">
              {/* Mobile logo */}
              <div className="lg:hidden flex items-center justify-center gap-3 mb-5 sm:mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl blur-lg opacity-50" />
                  <div className="relative bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 sm:p-3 rounded-xl">
                    <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white">School Report</h1>
                  <p className="text-xs text-slate-400">SaaS Platform</p>
                </div>
              </div>

              {/* Header */}
              <div className="text-center mb-5 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">Welcome Back</h3>
                <p className="text-slate-400 text-sm">Sign in to access your dashboard</p>
              </div>

              {/* Role Selection */}
              <div className="mb-4 sm:mb-6">
                <Label className="text-slate-300 text-xs sm:text-sm font-medium mb-2 sm:mb-3 block">Select Your Role</Label>
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
                  {ROLE_CONFIGS.map((role) => {
                    const RoleIcon = role.icon;
                    const isActive = loginRole === role.key;
                    return (
                      <button
                        key={role.key}
                        type="button"
                        onClick={() => handleRoleChange(role.key)}
                        className={`relative group px-2 py-3 sm:p-4 rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25'
                            : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                          <RoleIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} />
                          <span className={`text-xs sm:text-sm font-medium ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                            {role.label}
                          </span>
                        </div>
                        {isActive && (
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-400/20 to-amber-400/20 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2 sm:mt-3 text-center">{currentRole.description}</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
                      <span className="text-xs">!</span>
                    </div>
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-slate-300 text-sm font-medium">
                    {currentRole.inputType === 'studentId' ? 'Student ID' : 'Email Address'}
                  </Label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <Input
                      id="identifier"
                      type={currentRole.inputType === 'email' ? 'email' : 'text'}
                      placeholder={currentRole.placeholder}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      className="pl-11 h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300 text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-11 pr-11 h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-xl shadow-lg shadow-orange-500/25 transition-all duration-200 hover:shadow-orange-500/40"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                {loading && (
                  <p className="text-xs text-slate-500 text-center animate-pulse">
                    Establishing secure connection...
                  </p>
                )}
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-900/50 px-3 text-slate-500">New to the platform?</span>
                </div>
              </div>

              {/* Register Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/register')}
                className="w-full h-12 bg-transparent border-slate-700/50 text-slate-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-600 rounded-xl transition-all duration-200"
              >
                Register Your School
              </Button>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500">
                  By signing in, you agree to our{' '}
                  <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Privacy Policy</a>
                </p>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalLoginPage;
