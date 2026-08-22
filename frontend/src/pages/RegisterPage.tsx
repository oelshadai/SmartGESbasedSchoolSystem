import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, getRoleDashboardPath } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, Lock, Mail, User, School, Crown } from 'lucide-react';
import { toast } from 'sonner';

const PLANS = [
  { key: 'FREE',    label: 'Free Trial',  price: 'GH₵ 0',     desc: '30 days full access' },
  { key: 'MONTHLY', label: 'Monthly',     price: 'GH₵ 200',   desc: 'Per month' },
  { key: 'YEARLY',  label: 'Yearly',      price: 'GH₵ 2,200', desc: 'Per year · save 1 month' },
];

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    school_name: '',
    admin_email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
    plan: 'FREE',
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
    <div className="register-page min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 relative flex">
      {/* Animated background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-48 sm:w-80 h-48 sm:h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-48 sm:w-80 h-48 sm:h-80 bg-orange-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 sm:w-96 h-56 sm:h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Scrollable inner */}
      <div className="register-page-content relative w-full overflow-y-auto flex items-center justify-center px-3 py-6 sm:px-4 sm:py-8">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">

          {/* Left side - Branding (desktop only) */}
          <div className="hidden lg:flex flex-col justify-center p-4 xl:p-8">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <img
                  src="/EliteTech logo with 3D cube design.png"
                  alt="Smart School Management System"
                  className="h-24 w-24 object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl xl:text-4xl font-extrabold leading-[1.15]">
                  <span className="text-white">Smart School</span>
                  <br />
                  <span className="login-gradient-text">Management System</span>
                </h2>
                <p className="text-base text-slate-200 leading-relaxed max-w-md">
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
                    <span className="text-sm text-slate-200">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Register form */}
          <div className="relative flex justify-center">
            <div className="login-glow-card w-full max-w-md mx-auto">
              <div className="login-glow-card-inner p-4 sm:p-6 md:p-8">

                {/* Mobile logo */}
                <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
                  <img
                    src="/EliteTech logo with 3D cube design.png"
                    alt="Smart School Management System"
                    className="h-8 w-8 sm:h-10 sm:w-10 object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                  />
                  <span className="text-sm sm:text-base font-bold text-white">Smart School Management System</span>
                </div>

                {/* Header */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-1.5 text-slate-200 hover:text-slate-200 text-xs mb-3 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Login
                  </button>
                  <h3 className="text-lg sm:text-xl font-extrabold mb-1">
                    <span className="text-white">Register </span>
                    <span className="login-gradient-text">Your School</span>
                  </h3>
                  <p className="text-slate-200 text-xs sm:text-sm">Create your school account to get started</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
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
                    <Label htmlFor="school_name" className="text-slate-200 text-xs font-medium">School Name *</Label>
                    <div className="relative">
                      <School className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-200" />
                      <Input
                        id="school_name"
                        value={formData.school_name}
                        onChange={(e) => handleChange('school_name', e.target.value)}
                        required
                        className="pl-9 h-9 bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-700 focus:ring-blue-700/20 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* First & Last Name */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="first_name" className="text-slate-200 text-xs font-medium">First Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-200" />
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => handleChange('first_name', e.target.value)}
                          required
                          className="pl-9 h-9 bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-700 focus:ring-blue-700/20 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="last_name" className="text-slate-200 text-xs font-medium">Last Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-200" />
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) => handleChange('last_name', e.target.value)}
                          required
                          className="pl-9 h-9 bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-700 focus:ring-blue-700/20 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Admin Email */}
                  <div className="space-y-1">
                    <Label htmlFor="admin_email" className="text-slate-200 text-xs font-medium">Admin Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-200" />
                      <Input
                        id="admin_email"
                        type="email"
                        value={formData.admin_email}
                        onChange={(e) => handleChange('admin_email', e.target.value)}
                        required
                        className="pl-9 h-9 bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-700 focus:ring-blue-700/20 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <Label htmlFor="password" className="text-slate-200 text-xs font-medium">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-200" />
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        required
                        minLength={8}
                        className="pl-9 h-9 bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-700 focus:ring-blue-700/20 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Plan Selection */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-200 text-xs font-medium flex items-center gap-1">
                      <Crown className="h-3 w-3 text-amber-400" /> Subscription Plan
                    </Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {PLANS.map(p => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => handleChange('plan', p.key)}
                          className={`rounded-xl border p-2 text-left transition-all ${
                            formData.plan === p.key
                              ? 'border-blue-700 bg-blue-50'
                              : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                          }`}
                        >
                          <p className={`text-xs font-semibold ${ formData.plan === p.key ? 'text-blue-900' : 'text-slate-200' }`}>{p.label}</p>
                          <p className="register-plan-price text-[11px] font-bold mt-0.5">{p.price}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{p.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <Label htmlFor="password_confirm" className="text-slate-200 text-xs font-medium">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-200" />
                      <Input
                        id="password_confirm"
                        type="password"
                        value={formData.password_confirm}
                        onChange={(e) => handleChange('password_confirm', e.target.value)}
                        required
                        minLength={8}
                        className="pl-9 h-9 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-9 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all duration-200 text-sm"
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
                    <span className="bg-white px-3 text-slate-700">Already have an account?</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="w-full h-9 bg-white border-blue-900 text-blue-900 hover:bg-blue-50 hover:text-blue-950 rounded-xl transition-all duration-200 text-sm"
                >
                  Sign In
                </Button>

                <div className="mt-3 text-center">
                  <p className="text-[10px] text-slate-200">
                    By registering, you agree to our{' '}
                    <a href="#" className="text-slate-200 hover:text-slate-200 transition-colors">Terms</a>
                    {' '}and{' '}
                    <a href="#" className="text-slate-200 hover:text-slate-200 transition-colors">Privacy Policy</a>
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
