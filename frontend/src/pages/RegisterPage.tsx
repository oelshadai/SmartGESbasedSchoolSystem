import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, getRoleDashboardPath } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, Lock, Mail, User, School } from 'lucide-react';
import { toast } from 'sonner';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    school_name: '',
    admin_email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await authService.registerSchool(formData);
      setAuth(response.user, response.access, response.refresh);
      toast.success('School registered successfully!');
      navigate(getRoleDashboardPath(response.user.role));
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative flex">
      {/* Animated background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 sm:w-80 h-64 sm:h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-64 sm:w-80 h-64 sm:h-80 bg-orange-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Scrollable inner */}
      <div className="relative w-full h-full overflow-y-auto flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">

          {/* Left side - Branding (desktop only) */}
          <div className="hidden lg:flex flex-col justify-center p-4 xl:p-8">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <img
                  src="/EliteTech logo with 3D cube design.png"
                  alt="EliteTech"
                  className="h-24 w-24 object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl xl:text-5xl font-extrabold leading-[1.15]">
                  <span className="text-white">GES School</span>
                  <br />
                  <span className="login-gradient-text">Management System</span>
                </h2>
                <p className="text-base text-slate-400 leading-relaxed max-w-md">
                  Register your school and unlock a comprehensive platform for assignments, grading, attendance, and reporting.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  'Full platform access for all users',
                  'Student, teacher & admin portals',
                  'Automated report generation',
                  'Secure cloud-based platform',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 group">
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-3.5 w-3.5 text-orange-400" />
                    </div>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Register form */}
          <div className="relative flex justify-center">
            <div className="login-glow-card w-full max-w-md">
              <div className="login-glow-card-inner p-4 sm:p-6">

                {/* Mobile logo */}
                <div className="lg:hidden flex items-center justify-center gap-3 mb-3">
                  <img
                    src="/EliteTech logo with 3D cube design.png"
                    alt="EliteTech"
                    className="h-10 w-10 object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                  />
                </div>

                {/* Header */}
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-xs mb-2 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Login
                  </button>
                  <h3 className="text-base sm:text-lg font-extrabold mb-1">
                    <span className="text-white">Register </span>
                    <span className="login-gradient-text">Your School</span>
                  </h3>
                  <p className="text-slate-400 text-xs">Create your school account to get started</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
                        <span className="text-[10px] font-bold">!</span>
                      </div>
                      <span className="text-xs sm:text-sm leading-relaxed">{error}</span>
                    </div>
                  )}

                  {/* School Name */}
                  <div className="space-y-1">
                    <Label htmlFor="school_name" className="text-slate-300 text-xs font-medium">School Name *</Label>
                    <div className="relative">
                      <School className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <Input
                        id="school_name"
                        placeholder="Accra Senior High School"
                        value={formData.school_name}
                        onChange={(e) => handleChange('school_name', e.target.value)}
                        required
                        className="pl-9 h-9 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* First & Last Name */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="first_name" className="text-slate-300 text-xs font-medium">First Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                        <Input
                          id="first_name"
                          placeholder="Kwame"
                          value={formData.first_name}
                          onChange={(e) => handleChange('first_name', e.target.value)}
                          required
                          className="pl-9 h-9 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="last_name" className="text-slate-300 text-xs font-medium">Last Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                        <Input
                          id="last_name"
                          placeholder="Mensah"
                          value={formData.last_name}
                          onChange={(e) => handleChange('last_name', e.target.value)}
                          required
                          className="pl-9 h-9 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Admin Email */}
                  <div className="space-y-1">
                    <Label htmlFor="admin_email" className="text-slate-300 text-xs font-medium">Admin Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <Input
                        id="admin_email"
                        type="email"
                        placeholder="k.mensah@school.edu.gh"
                        value={formData.admin_email}
                        onChange={(e) => handleChange('admin_email', e.target.value)}
                        required
                        className="pl-9 h-9 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <Label htmlFor="password" className="text-slate-300 text-xs font-medium">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        required
                        minLength={8}
                        className="pl-9 h-9 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <Label htmlFor="password_confirm" className="text-slate-300 text-xs font-medium">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <Input
                        id="password_confirm"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password_confirm}
                        onChange={(e) => handleChange('password_confirm', e.target.value)}
                        required
                        minLength={8}
                        className="pl-9 h-9 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-9 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-200 hover:shadow-orange-500/30 text-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create School Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800/80" />
                  </div>
                  <div className="relative flex justify-center text-[11px]">
                    <span className="bg-[hsl(222_47%_8%)] px-3 text-slate-500">Already have an account?</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="w-full h-9 bg-transparent border-slate-700/40 text-slate-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-600 rounded-xl transition-all duration-200 text-sm"
                >
                  Sign In
                </Button>

                <div className="mt-3 text-center">
                  <p className="text-[10px] text-slate-600">
                    By registering, you agree to our{' '}
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
      </div>
    </div>
  );
};

export default RegisterPage;
