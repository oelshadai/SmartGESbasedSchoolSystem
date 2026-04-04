import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore, getRoleDashboardPath } from '@/stores/authStore';
import { authService } from '@/services/authService';
import {
  GraduationCap, LayoutDashboard, Users, BookOpen, ClipboardList,
  FileText, Settings, LogOut, ChevronLeft, Menu, School, BarChart3,
  CalendarDays, Award, CreditCard, Shield, MessageSquare, Bell,
  HelpCircle, User, Clock, Briefcase, DollarSign, Globe, Calendar
} from 'lucide-react';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const getNavItems = (role: UserRole): NavItem[] => {
  const base: Record<UserRole, NavItem[]> = {
    SUPER_ADMIN: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
      { label: 'Schools', path: '/admin/schools', icon: <School className="h-5 w-5" /> },
      { label: 'Users', path: '/admin/users', icon: <Users className="h-5 w-5" /> },
      { label: 'Analytics', path: '/admin/analytics', icon: <BarChart3 className="h-5 w-5" /> },
      { label: 'Subscriptions', path: '/admin/subscriptions', icon: <CreditCard className="h-5 w-5" /> },
      { label: 'Audit Logs', path: '/admin/audit-logs', icon: <Shield className="h-5 w-5" /> },
      { label: 'Support', path: '/admin/support', icon: <MessageSquare className="h-5 w-5" /> },
      { label: 'Settings', path: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
    ],
    SCHOOL_ADMIN: [
      { label: 'Dashboard', path: '/school/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
      { label: 'Academic Years', path: '/school/academic-years', icon: <CalendarDays className="h-5 w-5" /> },
      { label: 'Classes', path: '/school/classes', icon: <BookOpen className="h-5 w-5" /> },
      { label: 'Teachers', path: '/school/teachers', icon: <Users className="h-5 w-5" /> },
      { label: 'Students', path: '/school/students', icon: <GraduationCap className="h-5 w-5" /> },
      { label: 'Subjects', path: '/school/subjects', icon: <Briefcase className="h-5 w-5" /> },
      { label: 'Reports', path: '/school/reports', icon: <FileText className="h-5 w-5" /> },
      { label: 'Announcements', path: '/school/announcements', icon: <Bell className="h-5 w-5" /> },
      { label: 'Events', path: '/school/events', icon: <CalendarDays className="h-5 w-5" /> },
      { label: 'Attendance Report', path: '/school/event-planner', icon: <Calendar className="h-5 w-5" /> },
      { label: 'Fees', path: '/school/fees', icon: <DollarSign className="h-5 w-5" /> },
      { label: 'Parent Portal', path: '/school/parent-portal', icon: <Globe className="h-5 w-5" /> },
      { label: 'Settings', path: '/school/settings', icon: <Settings className="h-5 w-5" /> },
    ],
    PRINCIPAL: [
      { label: 'Dashboard', path: '/school/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
      { label: 'Classes', path: '/school/classes', icon: <BookOpen className="h-5 w-5" /> },
      { label: 'Teachers', path: '/school/teachers', icon: <Users className="h-5 w-5" /> },
      { label: 'Students', path: '/school/students', icon: <GraduationCap className="h-5 w-5" /> },
      { label: 'Reports', path: '/school/reports', icon: <FileText className="h-5 w-5" /> },
      { label: 'Announcements', path: '/school/announcements', icon: <Bell className="h-5 w-5" /> },
      { label: 'Attendance Report', path: '/school/event-planner', icon: <Calendar className="h-5 w-5" /> },
    ],
    TEACHER: [
      { label: 'Dashboard', path: '/teacher/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
      { label: 'My Classes', path: '/teacher/classes', icon: <BookOpen className="h-5 w-5" /> },
      { label: 'Assignments', path: '/teacher/assignments', icon: <ClipboardList className="h-5 w-5" /> },
      { label: 'Score Entry', path: '/teacher/scores', icon: <Award className="h-5 w-5" /> },
      { label: 'Grade Book', path: '/teacher/gradebook', icon: <BarChart3 className="h-5 w-5" /> },
      { label: 'Attendance', path: '/teacher/attendance', icon: <CalendarDays className="h-5 w-5" /> },
      { label: 'Behavior', path: '/teacher/behavior', icon: <Shield className="h-5 w-5" /> },
      { label: 'Reports', path: '/teacher/reports', icon: <FileText className="h-5 w-5" /> },
      { label: 'Students', path: '/teacher/students', icon: <Users className="h-5 w-5" /> },
      { label: 'Profile', path: '/teacher/profile', icon: <User className="h-5 w-5" /> },
      { label: 'Help', path: '/teacher/help', icon: <HelpCircle className="h-5 w-5" /> },
    ],
    STUDENT: [
      { label: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
      { label: 'Assignments', path: '/student/assignments', icon: <ClipboardList className="h-5 w-5" /> },
      { label: 'Reports', path: '/student/reports', icon: <FileText className="h-5 w-5" /> },
      { label: 'Grades', path: '/student/grades', icon: <Award className="h-5 w-5" /> },
      { label: 'Attendance', path: '/student/attendance', icon: <CalendarDays className="h-5 w-5" /> },
      { label: 'Schedule', path: '/student/schedule', icon: <Clock className="h-5 w-5" /> },
      { label: 'Announcements', path: '/student/announcements', icon: <Bell className="h-5 w-5" /> },
      { label: 'Profile', path: '/student/profile', icon: <User className="h-5 w-5" /> },
    ],
  };
  return base[role] || [];
};

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const navItems = getNavItems(user.role);

  const handleLogout = async () => {
    await authService.logout();
    logout();
    navigate('/login');
  };

  const roleLabel: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    SCHOOL_ADMIN: 'School Admin',
    PRINCIPAL: 'Principal',
    TEACHER: 'Teacher',
    STUDENT: 'Student',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
          <div className="shrink-0">
            <img 
              src="/EliteTech logo with sleek design.png" 
              alt="School Report SaaS" 
              className="h-8 w-auto object-contain"
            />
          </div>
          {!collapsed && <span className="font-bold text-sm truncate">School Report</span>}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-sidebar-accent text-orange-400 border-l-[3px] border-orange-500 pl-[9px] shadow-sm'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3 space-y-2">
          {!collapsed && (
            <div className="px-3 py-2">
              <p className="text-xs font-medium truncate">{user?.first_name || ''} {user?.last_name || ''}</p>
              <p className="text-xs text-sidebar-foreground/50">{user?.role ? roleLabel[user.role] : ''}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 items-center justify-center rounded-full bg-card border border-border shadow-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className={`h-3 w-3 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 sm:h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-card/50 backdrop-blur-sm">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted">
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden text-sm font-semibold text-foreground truncate mx-2">
            {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              {user?.first_name?.[0] || 'U'}{user?.last_name?.[0] || 'U'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
