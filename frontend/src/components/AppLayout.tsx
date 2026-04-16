import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore, getRoleDashboardPath } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { secureApiClient } from '@/lib/secureApiClient';
import {
  GraduationCap, LayoutDashboard, Users, BookOpen, ClipboardList,
  FileText, Settings, LogOut, ChevronLeft, Menu, School, BarChart3,
  CalendarDays, Award, CreditCard, Shield, MessageSquare, Bell,
  HelpCircle, User, Clock, Briefcase, DollarSign, Globe, Calendar,
  X, CheckCheck, ClipboardCheck, Megaphone, ShieldCheck
} from 'lucide-react';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  activity_type?: string;
  read: boolean;
  created_at: string;
}

const NOTIF_ICON: Record<string, React.ReactNode> = {
  assignment: <ClipboardCheck className="h-4 w-4 text-orange-400" />,
  announcement: <Megaphone className="h-4 w-4 text-blue-400" />,
  report: <FileText className="h-4 w-4 text-green-400" />,
};

const getNotifIcon = (n: AppNotification) => {
  const t = (n.activity_type || n.type || '').toLowerCase();
  if (t.includes('assignment')) return NOTIF_ICON.assignment;
  if (t.includes('report')) return NOTIF_ICON.report;
  return NOTIF_ICON.announcement;
};

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

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
      { label: 'Staff Permissions', path: '/school/staff-permissions', icon: <ShieldCheck className="h-5 w-5" /> },
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
      { label: 'Fee Collection', path: '/teacher/fees', icon: <DollarSign className="h-5 w-5" /> },
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
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenIds = useRef<Set<number>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await secureApiClient.get<AppNotification[]>('/notifications/notifications/');
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      const unread = list.filter(n => !n.read).length;
      setUnreadCount(unread);

      // Browser push for new unread notifications
      const newUnread = list.filter(n => !n.read && !seenIds.current.has(n.id));
      if (newUnread.length > 0 && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
        if (Notification.permission === 'granted') {
          newUnread.forEach(n => {
            new Notification(n.title, {
              body: n.message,
              icon: '/EliteTech logo with 3D cube design.png',
              badge: '/EliteTech logo with 3D cube design.png',
              tag: `notif-${n.id}`,
            });
          });
        }
      }
      newUnread.forEach(n => seenIds.current.add(n.id));
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  // Close notification panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try {
      await secureApiClient.post('/notifications/notifications/mark-all-read/', {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

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
              src="/EliteTech logo with 3D cube design.png" 
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
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="relative p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center px-[3px] animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Panel */}
              {notifOpen && (
                <div className="absolute right-0 top-10 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-orange-400" />
                      <span className="font-semibold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full font-medium">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-muted-foreground hover:text-orange-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark all read
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-[70vh] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                        <Bell className="h-8 w-8 mb-2 opacity-30" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.slice(0, 30).map(n => (
                        <div
                          key={n.id}
                          className={`flex gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/40 transition-colors ${!n.read ? 'bg-orange-500/5' : ''}`}
                        >
                          <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            {getNotifIcon(n)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-medium leading-tight ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {n.title}
                              </p>
                              {!n.read && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-500 mt-1" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[11px] text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar */}
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
