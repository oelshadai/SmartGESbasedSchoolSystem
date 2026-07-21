import { useState, useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Settings, Users, School, BarChart3, 
  HeadphonesIcon, FileText, Shield, 
  LogOut, Bell, Search, Menu, X,
  ChevronRight, ChevronLeft, Home, CalendarDays, BookOpen, GraduationCap, Briefcase, CreditCard, Receipt, TrendingUp, PieChart, Globe, ShieldCheck, MessageSquare,
  ClipboardList, Award, User, HelpCircle, CheckCheck, Clock, DollarSign, Sparkles
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

const getNavItems = (role: UserRole) => {
  const adminNavItems = [
    { 
      path: '/admin/dashboard', 
      label: 'Dashboard', 
      icon: Home,
      description: 'Overview & analytics'
    },
    { 
      path: '/admin/schools', 
      label: 'Schools', 
      icon: School,
      description: 'Manage institutions'
    },
    { 
      path: '/admin/users', 
      label: 'Users', 
      icon: Users,
      description: 'User management'
    },
    { 
      path: '/admin/analytics', 
      label: 'Analytics', 
      icon: BarChart3,
      description: 'System metrics'
    },
    { 
      path: '/admin/settings', 
      label: 'Settings', 
      icon: Settings,
      description: 'Platform config'
    },
    { 
      path: '/admin/support', 
      label: 'Support', 
      icon: HeadphonesIcon,
      description: 'Help & tickets'
    },
    { 
      path: '/admin/audit-logs', 
      label: 'Audit Logs', 
      icon: FileText,
      description: 'System logs'
    },
  ];

  const schoolAdminNavItems = [
    {
      path: '/school/dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'School overview',
    },
    {
      path: '/school/academic-years',
      label: 'Academic Years',
      icon: CalendarDays,
      description: 'Manage terms and sessions',
    },
    {
      path: '/school/classes',
      label: 'Classes',
      icon: BookOpen,
      description: 'Class groups and sections',
    },
    {
      path: '/school/teachers',
      label: 'Teachers',
      icon: Users,
      description: 'Staff management',
    },
    {
      path: '/school/students',
      label: 'Students',
      icon: GraduationCap,
      description: 'Enrollments and overview',
    },
    {
      path: '/school/subjects',
      label: 'Subjects',
      icon: Briefcase,
      description: 'Curriculum management',
    },
    {
      path: '/school/reports',
      label: 'Reports',
      icon: FileText,
      description: 'School performance',
    },
    {
      path: '/school/announcements',
      label: 'Announcements',
      icon: Bell,
      description: 'School notices',
    },
    {
      path: '/school/events',
      label: 'Events',
      icon: CalendarDays,
      description: 'Manage school events',
    },
    {
      path: '/school/attendance',
      label: 'Attendance',
      icon: CalendarDays,
      description: 'Track attendance',
    },
    {
      path: '/school/fees',
      label: 'Fees',
      icon: CreditCard,
      description: 'Collections and invoices',
    },
    {
      path: '/school/financial',
      label: 'Financial',
      icon: TrendingUp,
      description: 'Financial dashboard',
    },
    {
      path: '/school/financial/staff',
      label: 'Finance Staff',
      icon: Users,
      description: 'Financial team',
    },
    {
      path: '/school/financial/payroll',
      label: 'Payroll',
      icon: Receipt,
      description: 'Payroll management',
    },
    {
      path: '/school/financial/expenses',
      label: 'Expenses',
      icon: Receipt,
      description: 'Expense tracking',
    },
    {
      path: '/school/financial/income',
      label: 'Income',
      icon: TrendingUp,
      description: 'Income tracking',
    },
    {
      path: '/school/financial/budget',
      label: 'Budget',
      icon: PieChart,
      description: 'Budget planning',
    },
    {
      path: '/school/sms-purchase',
      label: 'Purchase SMS',
      icon: Globe,
      description: 'SMS top-up',
    },
    {
      path: '/school/sms-settings',
      label: 'SMS Settings',
      icon: Settings,
      description: 'Message settings',
    },
    {
      path: '/school/staff-permissions',
      label: 'Staff Permissions',
      icon: ShieldCheck,
      description: 'Access control',
    },
    {
      path: '/school/parent-portal',
      label: 'Parent Portal',
      icon: Globe,
      description: 'Parent access controls',
    },
    {
      path: '/school/settings',
      label: 'Settings',
      icon: Settings,
      description: 'School configuration',
    },
    {
      path: '/school/messages',
      label: 'Messages',
      icon: MessageSquare,
      description: 'Communications',
    },
    {
      path: '/school/ai',
      label: 'AI Intelligence',
      icon: Sparkles,
      description: 'Risk, trends & smart SMS',
    },
  ];

  const teacherNavItems = [
    {
      path: '/teacher/dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Teacher overview',
    },
    {
      path: '/teacher/classes',
      label: 'Classes',
      icon: BookOpen,
      description: 'Class management',
    },
    {
      path: '/teacher/assignments',
      label: 'Assignments',
      icon: ClipboardList,
      description: 'Create and grade work',
    },
    {
      path: '/teacher/lessons',
      label: 'Lessons',
      icon: BookOpen,
      description: 'Lesson notes & live sessions',
    },
    {
      path: '/teacher/gradebook',
      label: 'Grade Book',
      icon: Award,
      description: 'Student progress',
    },
    {
      path: '/teacher/attendance',
      label: 'Attendance',
      icon: CalendarDays,
      description: 'Track attendance',
    },
    {
      path: '/teacher/fees',
      label: 'Fee Collection',
      icon: DollarSign,
      description: 'Manage payments',
    },
    {
      path: '/teacher/behavior',
      label: 'Behavior',
      icon: Shield,
      description: 'Student conduct',
    },
    {
      path: '/teacher/scores',
      label: 'Score Entry',
      icon: CheckCheck,
      description: 'Enter scores',
    },
    {
      path: '/teacher/reports',
      label: 'Reports',
      icon: FileText,
      description: 'Performance reports',
    },
    {
      path: '/teacher/students',
      label: 'Students',
      icon: Users,
      description: 'Student roster',
    },
    {
      path: '/teacher/profile',
      label: 'Profile',
      icon: User,
      description: 'Account settings',
    },
    {
      path: '/teacher/timetable',
      label: 'Timetable',
      icon: Clock,
      description: 'Schedule overview',
    },
    {
      path: '/teacher/help',
      label: 'Help',
      icon: HelpCircle,
      description: 'Support resources',
    },
    {
      path: '/school/ai',
      label: 'AI Tools',
      icon: Sparkles,
      description: 'Lesson plans & insights',
    },
  ];

  const studentNavItems = [
    {
      path: '/student/dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Student overview',
    },
    {
      path: '/student/assignments',
      label: 'Assignments',
      icon: ClipboardList,
      description: 'View tasks',
    },
    {
      path: '/student/grades',
      label: 'Grades',
      icon: Award,
      description: 'Track results',
    },
    {
      path: '/student/attendance',
      label: 'Attendance',
      icon: CalendarDays,
      description: 'Attendance records',
    },
    {
      path: '/student/schedule',
      label: 'Schedule',
      icon: Clock,
      description: 'Class schedule',
    },
    {
      path: '/student/lessons',
      label: 'Lessons',
      icon: BookOpen,
      description: 'Join live lessons',
    },
    {
      path: '/student/announcements',
      label: 'Announcements',
      icon: Bell,
      description: 'School news',
    },
    {
      path: '/student/reports',
      label: 'Reports',
      icon: FileText,
      description: 'Academic reports',
    },
    {
      path: '/student/bills',
      label: 'Bills',
      icon: DollarSign,
      description: 'Fee overview',
    },
    {
      path: '/student/payments',
      label: 'Payments',
      icon: CreditCard,
      description: 'Pay school fees',
    },
    {
      path: '/student/events',
      label: 'Events',
      icon: CalendarDays,
      description: 'Upcoming events',
    },
    {
      path: '/student/submissions',
      label: 'Submissions',
      icon: CheckCheck,
      description: 'Submitted work',
    },
    {
      path: '/student/profile',
      label: 'Profile',
      icon: User,
      description: 'Account settings',
    },
    {
      path: '/student/ai',
      label: 'AI Learning Hub',
      icon: Sparkles,
      description: 'Tutor, analysis & practice',
    },
  ];

  const parentNavItems = [
    {
      path: '/parent/dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Parent overview',
    },
    {
      path: '/parent/attendance',
      label: 'Attendance',
      icon: CalendarDays,
      description: 'Child attendance',
    },
    {
      path: '/parent/grades',
      label: 'Grades',
      icon: Award,
      description: 'Child progress',
    },
    {
      path: '/parent/reports',
      label: 'Reports',
      icon: FileText,
      description: 'Academic reports',
    },
    {
      path: '/parent/bills',
      label: 'Bills',
      icon: DollarSign,
      description: 'Fee overview',
    },
    {
      path: '/parent/announcements',
      label: 'Announcements',
      icon: Bell,
      description: 'School news',
    },
    {
      path: '/parent/profile',
      label: 'Profile',
      icon: User,
      description: 'Account settings',
    },
  ];

  if (role === 'SUPER_ADMIN') return adminNavItems;
  if (role === 'SCHOOL_ADMIN' || role === 'PRINCIPAL') return schoolAdminNavItems;
  if (role === 'TEACHER') return teacherNavItems;
  if (role === 'STUDENT') return studentNavItems;
  if (role === 'PARENT') return parentNavItems;
  return schoolAdminNavItems;
};

const roleLabel: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  SCHOOL_ADMIN: 'School Admin',
  PRINCIPAL: 'Principal',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent / Guardian',
};

interface ProfessionalAdminLayoutProps {
  children?: ReactNode;
}

const ProfessionalAdminLayout = ({ children }: ProfessionalAdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleSidebarKeyDown = (e: KeyboardEvent) => {
    if (!sidebarRef.current) return;
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const focusable = Array.from(sidebarRef.current.querySelectorAll<HTMLButtonElement>('button'))
      .filter(b => !b.hasAttribute('disabled'));
    const idx = focusable.indexOf(document.activeElement as HTMLButtonElement);
    let nextIdx = idx;
    if (e.key === 'ArrowDown') nextIdx = Math.min(focusable.length - 1, idx + 1);
    if (e.key === 'ArrowUp') nextIdx = Math.max(0, idx - 1);
    if (focusable[nextIdx]) focusable[nextIdx].focus();
  };

  const navItems = getNavItems(user?.role || 'SCHOOL_ADMIN');
  const title = user?.role === 'SUPER_ADMIN'
    ? 'Admin Panel'
    : user?.role === 'SCHOOL_ADMIN' || user?.role === 'PRINCIPAL'
      ? 'School Admin Panel'
      : user?.role === 'TEACHER'
        ? 'Teacher Panel'
        : user?.role === 'STUDENT'
          ? 'Student Panel'
          : user?.role === 'PARENT'
            ? 'Parent Portal'
            : 'School Admin Panel';
  const subtitle = user?.role ? roleLabel[user.role] : 'Admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  useEffect(() => {
    // Auto-scroll active item into view on route change (or when sidebar opens)
    const activeEl = sidebarRef.current?.querySelector('[data-active="true"]') as HTMLElement | null;
    if (activeEl && sidebarRef.current) {
      try {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (err) {
        /* ignore */
      }
    }
  }, [location.pathname, sidebarOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        role="navigation"
        aria-label={`${subtitle} navigation`}
        onKeyDown={handleSidebarKeyDown}
        className={`professional-sidebar app-sidebar-scrollbar fixed lg:static inset-y-0 left-0 z-50 ${collapsed ? 'w-20 lg:w-24' : 'w-72 lg:w-80'} bg-slate-900/95 lg:bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/50 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo & Header */}
        <div className={`${collapsed ? 'p-2 border-b border-slate-800/30' : 'p-4 lg:p-6 border-b border-slate-800/50'}`}>
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className={collapsed ? 'flex items-center justify-center mb-2' : 'flex items-center gap-3 mb-4'}>
            <div className={collapsed ? 'relative p-1' : 'relative'}>
              <div className={collapsed ? 'relative bg-gradient-to-br from-blue-600 to-cyan-600 p-2 rounded-md flex items-center justify-center' : 'relative bg-gradient-to-br from-blue-600 to-cyan-600 p-3 rounded-xl flex items-center justify-center'}>
                <img
                  src="/EliteTech logo with 3D cube design.png"
                  alt="App logo"
                  className={collapsed ? 'h-5 w-5 object-contain' : 'h-6 w-6 object-contain'}
                />
              </div>
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold text-white">{title}</h1>
                <p className="text-xs text-slate-100">{subtitle}</p>
              </div>
            )}
          </div>

          <div className="absolute top-4 left-4 lg:left-auto lg:right-6">
            <button
              onClick={() => setCollapsed(s => !s)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:inline-flex items-center justify-center h-8 w-8 rounded-md bg-slate-800/30 text-slate-200 hover:bg-slate-800/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* User Info (compact when collapsed) */}
          {collapsed ? (
            <div className="flex items-center justify-center mt-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                <span className="text-blue-400 font-semibold text-sm">
                  {user?.first_name?.[0] || user?.email?.[0] || 'A'}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/30 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <span className="text-blue-400 font-semibold text-sm">
                    {user?.first_name?.[0] || user?.email?.[0] || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {user?.first_name && user?.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : user?.email || 'Admin User'
                    }
                  </p>
                  <p className="text-slate-100 text-xs truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                data-active={isActive ? 'true' : 'false'}
                className={`group relative flex w-full items-center rounded-2xl px-3 py-3 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${collapsed ? 'justify-center' : 'justify-start text-left'} ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30'
                    : 'hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-slate-700/50 text-slate-100 group-hover:text-slate-300'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>

                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${
                      isActive ? 'text-white' : 'text-slate-100 group-hover:text-white'
                    }`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-100 group-hover:text-slate-100">
                      {item.description}
                    </p>
                  </div>
                )}

                {!collapsed && isActive && (
                  <ChevronRight className="h-4 w-4 text-blue-400" />
                )}

                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/10 to-cyan-400/10 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-3 lg:p-4 border-t border-slate-800/50">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button className="h-8 w-8 rounded-md flex items-center justify-center bg-slate-800/30 text-slate-100 hover:bg-slate-800/50">
                <Bell className="h-4 w-4" />
              </button>
              <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
                <AlertDialogTrigger asChild>
                  <button className="h-8 w-8 rounded-md flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20">
                    <LogOut className="h-4 w-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign out?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You'll need to sign in again to access your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>Sign out</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-slate-800/30 border-slate-700/50 text-slate-100 hover:bg-slate-800 hover:text-white hover:border-slate-600"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              
              <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign out?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You'll need to sign in again to access your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>Sign out</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-slate-900/30 backdrop-blur-xl border-b border-slate-800/50 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-slate-300 hover:text-white hover:bg-slate-800"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-100">{user?.role ? roleLabel[user.role] : 'Admin'}</span>
                <ChevronRight className="h-3 w-3 text-slate-100" />
                <span className="text-white font-medium">
                  {navItems.find(item => isActivePath(item.path))?.label || 'Dashboard'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-100" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 w-full sm:w-64"
                />
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-slate-100" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto min-w-0">
          <Outlet />
        </div>
      </div>

      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/3 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
    </div>
  );
};

export default ProfessionalAdminLayout;