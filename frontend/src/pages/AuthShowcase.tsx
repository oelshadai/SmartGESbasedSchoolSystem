import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, getRoleDashboardPath } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  GraduationCap, 
  Loader2, 
  BookOpen, 
  Shield, 
  User, 
  Settings,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import type { UserRole } from '@/types';

const AuthShowcase = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [isStudentLogin, setIsStudentLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const demoCredentials = {
    SUPER_ADMIN: { email: 'superadmin@school.edu', password: 'admin123', name: 'Super Admin' },
    SCHOOL_ADMIN: { email: 'admin@school.edu', password: 'admin123', name: 'School Admin' },
    PRINCIPAL: { email: 'principal@school.edu', password: 'principal123', name: 'Principal' },
    TEACHER: { email: 'teacher@test.com', password: 'Password123!', name: 'Teacher' },
    STUDENT: { username: 'std_STD001', password: 'abc123', name: 'Student' }
  };

  const roleIcons: Record<UserRole, React.ReactNode> = {
    SUPER_ADMIN: <Shield className="h-4 w-4" />,
    SCHOOL_ADMIN: <Settings className="h-4 w-4" />,
    PRINCIPAL: <User className="h-4 w-4" />,
    TEACHER: <BookOpen className="h-4 w-4" />,
    STUDENT: <GraduationCap className="h-4 w-4" />
  };

  const roleColors: Record<UserRole, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-800 border-red-200',
    SCHOOL_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    PRINCIPAL: 'bg-blue-100 text-blue-800 border-blue-200',
    TEACHER: 'bg-green-100 text-green-800 border-green-200',
    STUDENT: 'bg-orange-100 text-orange-800 border-orange-200'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = isStudentLogin
        ? await authService.studentLogin(username, password)
        : await authService.login(email, password);

      setAuth(data.user, data.access, data.refresh);
      navigate(getRoleDashboardPath(data.user.role));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setLoading(true);
    setError('');
    
    try {
      const creds = demoCredentials[role];
      let data;
      
      if (role === 'STUDENT') {
        data = await authService.studentLogin(creds.username!, creds.password);
      } else {
        data = await authService.login(creds.email!, creds.password);
      }
      
      setAuth(data.user, data.access, data.refresh);
      navigate(getRoleDashboardPath(data.user.role));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (role: UserRole) => {
    const creds = demoCredentials[role];
    if (role === 'STUDENT') {
      setIsStudentLogin(true);
      setUsername(creds.username!);
      setPassword(creds.password);
    } else {
      setIsStudentLogin(false);
      setEmail(creds.email!);
      setPassword(creds.password);
    }
    setActiveTab('login');
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(175_42%_46%/0.15),transparent_60%)]" />
        <div className="relative z-10 text-primary-foreground max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-secondary/20 backdrop-blur-sm">
              <GraduationCap className="h-10 w-10 text-secondary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight">
            School Report <span className="text-secondary">SaaS</span>
          </h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            A comprehensive school management platform with role-based authentication for administrators, teachers, and students.
          </p>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-secondary">User Roles:</h3>
            <div className="grid gap-2">
              {Object.entries(demoCredentials).map(([role, creds]) => (
                <div key={role} className="flex items-center gap-2 text-sm text-primary-foreground/80">
                  {roleIcons[role as UserRole]}
                  <span>{creds.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">School Report SaaS</span>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-foreground">Authentication System</h2>
            <p className="text-muted-foreground">Role-based access control demo</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Manual Login</TabsTrigger>
              <TabsTrigger value="demo">Quick Demo</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Login Form</CardTitle>
                  <CardDescription>
                    Use the toggle below to switch between staff and student login
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex rounded-lg bg-muted p-1">
                    <button
                      type="button"
                      onClick={() => { setIsStudentLogin(false); setError(''); }}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${
                        !isStudentLogin ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <BookOpen className="h-4 w-4" />
                      Staff Login
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsStudentLogin(true); setError(''); }}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${
                        isStudentLogin ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <GraduationCap className="h-4 w-4" />
                      Student Login
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {isStudentLogin ? (
                      <div className="space-y-2">
                        <Label htmlFor="username">Student ID</Label>
                        <Input
                          id="username"
                          placeholder="e.g. std_STD001"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="teacher@test.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="demo" className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Quick Demo Access</CardTitle>
                  <CardDescription>
                    Click any role below to instantly login and explore the dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Each role has different permissions and dashboard views
                    </AlertDescription>
                  </Alert>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    {Object.entries(demoCredentials).map(([role, creds]) => (
                      <div key={role} className="flex gap-2">
                        <Button
                          onClick={() => handleDemoLogin(role as UserRole)}
                          disabled={loading}
                          variant="outline"
                          className="flex-1 justify-start gap-2"
                        >
                          {roleIcons[role as UserRole]}
                          <span className="flex-1 text-left">{creds.name}</span>
                        </Button>
                        <Button
                          onClick={() => fillDemoCredentials(role as UserRole)}
                          variant="ghost"
                          size="sm"
                          className="px-3"
                          title="Fill credentials in form"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 space-y-2">
                    <h4 className="text-sm font-medium">Test Credentials:</h4>
                    <div className="grid gap-1 text-xs text-muted-foreground">
                      {Object.entries(demoCredentials).map(([role, creds]) => (
                        <div key={role} className="flex justify-between">
                          <Badge variant="outline" className={`text-xs ${roleColors[role as UserRole]}`}>
                            {roleIcons[role as UserRole]}
                            <span className="ml-1">{creds.name}</span>
                          </Badge>
                          <span className="font-mono">
                            {role === 'STUDENT' ? creds.username : creds.email} / {creds.password}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AuthShowcase;
