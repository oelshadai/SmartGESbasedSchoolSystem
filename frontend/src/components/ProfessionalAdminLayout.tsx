import { useState, useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import NotificationPanel from '@/components/NotificationPanel';
import usePushSubscription from '@/hooks/usePushSubscription';
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
      path: '/teacher/ai',
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

  usePushSubscription(!!user);

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
    <div className="h-screen overflow-hidden bg-white flex">
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
        className={`professional-sidebar app-sidebar-scrollbar fixed lg:static inset-y-0 left-0 z-50 ${collapsed ? 'w-20 lg:w-24' : 'w-72 lg:w-80'} h-full bg-[#0a1f4e] border-t border-[#f0c040]/20 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo & Header */}
        <div className={`${collapsed ? 'p-2 border-b border-[#f0c040]/20' : 'p-4 lg:p-6 border-b border-[#f0c040]/20'}`}>
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className={collapsed ? 'flex items-center justify-center mb-2' : 'flex items-center gap-3 mb-4'}>
            {/* Logo */}
            <div className="relative shrink-0">
              <div className={`relative ${
                collapsed ? 'p-2 rounded-xl' : 'p-2.5 rounded-2xl'
              } bg-[#0f2a5e] shadow-lg shadow-[#f0c040]/20 ring-1 ring-[#f0c040]/30 flex items-center justify-center`}>
                <img
                  src="/EliteTech logo with 3D cube design.png"
                  alt="SmartGES"
                  className={collapsed ? 'h-6 w-6 object-contain drop-shadow-md' : 'h-8 w-8 object-contain drop-shadow-md'}
                />
              </div>
              {/* Glow dot */}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#f0c040] ring-2 ring-[#0a1f4e] shadow shadow-[#f0c040]/60" />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-base font-bold leading-tight tracking-tight text-slate-900 truncate">
                  {user?.school?.name || 'SmartGES'}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                    user?.role === 'SUPER_ADMIN'
                      ? 'bg-[#f0c040]/20 text-[#f0c040] ring-1 ring-[#f0c040]/40'
                      : user?.role === 'SCHOOL_ADMIN' || user?.role === 'PRINCIPAL'
                      ? 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/30'
                      : user?.role === 'TEACHER'
                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                      : user?.role === 'STUDENT'
                      ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30'
                      : 'bg-[#f0c040]/20 text-[#f0c040] ring-1 ring-[#f0c040]/30'
                  }`}>
                    {subtitle}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="absolute top-4 left-4 lg:left-auto lg:right-6">
            <button
              onClick={() => setCollapsed(s => !s)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:inline-flex items-center justify-center h-8 w-8 rounded-md bg-[#f0c040]/10 text-[#f0c040] hover:bg-[#f0c040]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c040]"
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
              <div className={`w-9 h-9 rounded-full ring-2 ring-offset-2 ring-offset-slate-900 flex items-center justify-center font-bold text-sm ${
                user?.role === 'SUPER_ADMIN' ? 'bg-gradient-to-br from-red-500 to-orange-500 ring-red-500/50 text-white'
                : user?.role === 'SCHOOL_ADMIN' || user?.role === 'PRINCIPAL' ? 'bg-gradient-to-br from-blue-500 to-cyan-500 ring-blue-500/50 text-white'
                : user?.role === 'TEACHER' ? 'bg-gradient-to-br from-emerald-500 to-teal-500 ring-emerald-500/50 text-white'
                : user?.role === 'STUDENT' ? 'bg-gradient-to-br from-purple-500 to-pink-500 ring-purple-500/50 text-white'
                : 'bg-gradient-to-br from-amber-500 to-yellow-500 ring-amber-500/50 text-white'
              }`}>
                {user?.first_name?.[0] || user?.email?.[0] || 'A'}
              </div>
            </div>
          ) : (
            <div className="bg-[#0f2a5e] rounded-xl p-3 ring-1 ring-[#f0c040]/20">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ring-2 ring-offset-1 ring-offset-slate-800 flex items-center justify-center font-bold text-sm shrink-0 ${
                  user?.role === 'SUPER_ADMIN' ? 'bg-gradient-to-br from-red-500 to-orange-500 ring-red-500/40 text-white'
                  : user?.role === 'SCHOOL_ADMIN' || user?.role === 'PRINCIPAL' ? 'bg-gradient-to-br from-blue-500 to-cyan-500 ring-blue-500/40 text-white'
                  : user?.role === 'TEACHER' ? 'bg-gradient-to-br from-emerald-500 to-teal-500 ring-emerald-500/40 text-white'
                  : user?.role === 'STUDENT' ? 'bg-gradient-to-br from-purple-500 to-pink-500 ring-purple-500/40 text-white'
                  : 'bg-gradient-to-br from-amber-500 to-yellow-500 ring-amber-500/40 text-white'
                }`}>
                  {user?.first_name?.[0] || user?.email?.[0] || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.email || 'User'
                    }
                  </p>
                  <p className="text-slate-400 text-xs truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="app-sidebar-scrollbar flex-1 overflow-y-auto px-2 py-3 space-y-2">
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
                className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${collapsed ? 'justify-center' : 'justify-start text-left'} ${
                  isActive
                    ? 'bg-amber-50 border border-amber-300'
                    : 'hover:bg-white/10 border border-transparent hover:border-[#f0c040]/30'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-amber-50 text-amber-600 group-hover:text-amber-700'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>

                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm tracking-wide ${
                      isActive ? 'text-slate-900 font-semibold' : 'text-white group-hover:text-[#f0c040]'
                    }`}>
                      {item.label}
                    </p>
                    <p className={`text-xs tracking-wide ${
                      isActive ? 'text-slate-700' : 'text-slate-300 group-hover:text-slate-200'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                )}

                {!collapsed && isActive && (
                  <ChevronRight className="h-4 w-4 text-[#f0c040]" />
                )}

                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/10 to-cyan-400/10" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-3 lg:p-4 border-t border-[#f0c040]/20">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              {user?.role !== 'TEACHER' && user?.role !== 'STUDENT' && <NotificationPanel />}
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
              {user?.role !== 'TEACHER' && user?.role !== 'STUDENT' && (
                <div className="px-1">
                  <NotificationPanel />
                </div>
              )}
              
              <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-red-600 border-red-600 text-white font-bold hover:bg-red-700 hover:text-white hover:border-red-700"
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
        <div className="professional-topbar bg-[#0a1f4e] border-b border-[#f0c040]/20 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white hover:text-white hover:bg-white/10"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-300 text-xs">{user?.role ? roleLabel[user.role] : 'Admin'}</span>
                <ChevronRight className="h-3 w-3 text-[#f0c040]" />
                <span className="text-white font-semibold">
                  {navItems.find(item => isActivePath(item.path))?.label || 'Dashboard'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications — hidden for teacher/student (they use carousel on dashboard) */}
              {user?.role !== 'TEACHER' && user?.role !== 'STUDENT' && (
                <NotificationPanel />
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="professional-theme-content flex-1 overflow-auto min-w-0 bg-white p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>

      {/* Static background — no animation to avoid scroll jank */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default ProfessionalAdminLayout;