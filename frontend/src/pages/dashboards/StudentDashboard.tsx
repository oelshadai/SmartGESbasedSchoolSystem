import { useState, useEffect } from 'react';
import {
  BookOpen, ClipboardList, CheckCircle2, Clock,
  AlertCircle, Loader2, TrendingUp, Users, Star,
  GraduationCap, Phone, Mail, Calendar, User, Bell, Pin,
  UserCheck, UserX, Timer, X, FileText, BookOpenCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { secureApiClient } from '@/lib/secureApiClient';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface Assignment {
  id: number;
  assignment_title: string;
  assignment_type: string;
  assignment_due_date: string | null;
  assignment_max_score: number;
  subject_name: string | null;
  status: string;
  score: number | null;
  teacher_feedback: string;
  submitted_at: string | null;
  graded_at: string | null;
  attempts_count: number;
}

interface Classmate {
  id: number;
  name: string;
  student_id: string;
  email: string | null;
}

interface StudentDashboardData {
  student: {
    id: number;
    name: string;
    first_name: string;
    last_name: string;
    other_names: string;
    student_id: string;
    email: string | null;
    class: string;
    class_id: number | null;
    gender: string;
    date_of_birth: string | null;
    school: string | null;
    school_id: number | null;
    photo: string | null;
    guardian_name: string;
    guardian_phone: string;
    guardian_email: string | null;
    admission_date: string | null;
    is_active: boolean;
    role: string;
  };
  assignments: Assignment[];
  classmates: Classmate[];
  stats: {
    total_assignments: number;
    completed: number;
    pending: number;
    graded: number;
  };
}

interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  total: number;
  rate: number;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  audience: string;
  is_pinned: boolean;
  author_name: string;
  created_at: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  activity_type: string;
  read: boolean;
  created_at: string;
  assignment_id?: number;
}

const STATUS_BADGE: Record<string, string> = {
  SUBMITTED:   'bg-blue-100 text-blue-700',
  GRADED:      'bg-emerald-100 text-emerald-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  NOT_STARTED: 'bg-gray-100 text-gray-600',
  EXPIRED:     'bg-red-100 text-red-700',
  LOCKED:      'bg-orange-100 text-orange-700',
};

const TYPE_LABEL: Record<string, string> = {
  HOMEWORK: 'Homework',
  PROJECT:  'Project',
  EXERCISE: 'Exercise',
  QUIZ:     'Quiz',
  EXAM:     'Exam',
};

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

const StudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const [dashRes, attRes, annRes, notifRes] = await Promise.all([
          secureApiClient.get<StudentDashboardData>('/students/auth/dashboard/'),
          secureApiClient.get<{ summary: AttendanceSummary }>('/students/my-attendance/').catch(() => null),
          secureApiClient.get<Announcement[]>('/announcements/').catch(() => [] as Announcement[]),
          secureApiClient.get<Notification[]>('/notifications/').catch(() => [] as Notification[]),
        ]);
        setData(dashRes);
        if (attRes?.summary) setAttendance(attRes.summary);
        const annList = Array.isArray(annRes) ? annRes : (annRes as any)?.results ?? [];
        setAnnouncements(annList);
        const notifList = Array.isArray(notifRes) ? notifRes : (notifRes as any)?.results ?? [];
        setNotifications(notifList);
      } catch (err: any) {
        if (err?.response?.status === 401) { logout(); navigate('/login'); return; }
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [isAuthenticated, navigate, logout]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6 animate-fade-in p-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold text-destructive">Dashboard Error</h3>
          </div>
          <p className="text-destructive text-sm mb-4">{error || 'Failed to load dashboard data'}</p>
          <div className="flex gap-3">
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">Retry</Button>
            <Button onClick={() => { logout(); navigate('/login'); }} variant="destructive" size="sm">Re-login</Button>
          </div>
        </div>
      </div>
    );
  }

  const { student, stats, assignments, classmates } = data;
  const recentAssignments = assignments.slice(0, 6);

  // Filter recent unread notifications for alerts
  const recentAlerts = notifications
    .filter(n => !n.read && !dismissedAlerts.has(n.id))
    .filter(n => n.activity_type === 'assignment_created' || n.type === 'assignment' || n.title.toLowerCase().includes('terminal') || n.title.toLowerCase().includes('report'))
    .slice(0, 3);

  const dismissAlert = (alertId: number) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const assignmentCards = [
    { label: 'Total',     value: stats.total_assignments, icon: <ClipboardList className="h-5 w-5" />, sub: 'assignments',   color: 'text-blue-500',    bg: 'bg-blue-500/10' },
    { label: 'Pending',   value: stats.pending,           icon: <Clock className="h-5 w-5" />,         sub: 'to complete',   color: 'text-yellow-500',  bg: 'bg-yellow-500/10' },
    { label: 'Submitted', value: stats.completed,         icon: <CheckCircle2 className="h-5 w-5" />,  sub: 'submitted',     color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Graded',    value: stats.graded,            icon: <Star className="h-5 w-5" />,          sub: 'with feedback', color: 'text-purple-500',  bg: 'bg-purple-500/10' },
  ];

  const attendanceCards = [
    { label: 'Present', value: attendance?.present ?? '—', icon: <UserCheck className="h-5 w-5" />, sub: `${attendance?.rate ?? 0}% rate`,  color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Absent',  value: attendance?.absent  ?? '—', icon: <UserX className="h-5 w-5" />,     sub: 'days absent',                      color: 'text-red-500',     bg: 'bg-red-500/10' },
    { label: 'Late',    value: attendance?.late    ?? '—', icon: <Timer className="h-5 w-5" />,      sub: 'days late',                        color: 'text-orange-500',  bg: 'bg-orange-500/10' },
    { label: 'Total',   value: attendance?.total   ?? '—', icon: <Calendar className="h-5 w-5" />,   sub: 'days recorded (90d)',               color: 'text-blue-500',    bg: 'bg-blue-500/10' },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in">

      {/* Alert notifications */}
      {recentAlerts.length > 0 && (
        <div className="space-y-2">
          {recentAlerts.map((alert) => (
            <div key={alert.id} className={`rounded-lg border p-4 flex items-start gap-3 ${
              alert.activity_type === 'assignment_created' || alert.type === 'assignment'
                ? 'bg-blue-950/50 border-blue-700 text-blue-200'
                : 'bg-green-950/50 border-green-700 text-green-200'
            }`}>
              <div className="shrink-0 mt-0.5">
                {alert.activity_type === 'assignment_created' || alert.type === 'assignment' ? (
                  <BookOpenCheck className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{alert.title}</p>
                <p className="text-sm opacity-90 mt-1">{alert.message}</p>
                <p className="text-xs opacity-70 mt-2">{formatDate(alert.created_at)}</p>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Welcome header */}
      <div className="flex items-center gap-3 sm:gap-4">
        {student.photo ? (
          <img src={student.photo} alt={student.name} className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover border-2 border-primary/20" />
        ) : (
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">Welcome, {student.first_name}!</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{student.school} · {student.class}</p>
        </div>
      </div>

      {/* Assignment stat cards */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Assignments</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {assignmentCards.map((s) => (
            <div key={s.label} className={`relative group rounded-2xl border ${s.bg.replace('/10', '/20').replace('bg-', 'border-')} ${s.bg.replace('bg-', 'bg-').replace('/10', '/5')} backdrop-blur-sm p-4 shadow-lg hover:scale-[1.02] transition-all duration-200 overflow-hidden`}>
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${s.bg.replace('bg-', 'bg-gradient-to-r from-').replace('/10', '')} opacity-70`} />
              <div className={`absolute -top-5 -right-5 w-16 h-16 ${s.bg} rounded-full blur-xl opacity-60`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                  <div className={`p-1.5 rounded-lg ${s.bg} border ${s.bg.replace('bg-', 'border-').replace('/10', '/30')} ${s.color}`}>{s.icon}</div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance stat cards */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Attendance (Last 90 Days)</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {attendanceCards.map((s) => (
            <div key={s.label} className={`relative group rounded-2xl border ${s.bg.replace('/10', '/20').replace('bg-', 'border-')} ${s.bg.replace('bg-', 'bg-').replace('/10', '/5')} backdrop-blur-sm p-4 shadow-lg hover:scale-[1.02] transition-all duration-200 overflow-hidden`}>
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${s.bg.replace('bg-', 'bg-gradient-to-r from-').replace('/10', '')} opacity-70`} />
              <div className={`absolute -top-5 -right-5 w-16 h-16 ${s.bg} rounded-full blur-xl opacity-60`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                  <div className={`p-1.5 rounded-lg ${s.bg} border ${s.bg.replace('bg-', 'border-').replace('/10', '/30')} ${s.color}`}>{s.icon}</div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">

        {/* Recent assignments — 2 cols */}
        <div className="md:col-span-2 animated-border">
          <div className="animated-border-content p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Recent Assignments
              </h3>
              <span className="text-xs text-muted-foreground">{assignments.length} total</span>
            </div>
            {recentAssignments.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <ClipboardList className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No assignments yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAssignments.map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{a.assignment_title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {a.subject_name && <span className="text-xs text-muted-foreground">{a.subject_name}</span>}
                        <span className="text-xs text-muted-foreground/60">·</span>
                        <span className="text-xs text-muted-foreground">{TYPE_LABEL[a.assignment_type] ?? a.assignment_type}</span>
                        {a.assignment_due_date && (
                          <>
                            <span className="text-xs text-muted-foreground/60">·</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Due {formatDate(a.assignment_due_date)}
                            </span>
                          </>
                        )}
                      </div>
                      {a.score !== null && (
                        <p className="text-xs text-emerald-600 mt-0.5 font-medium">
                          Score: {a.score} / {a.assignment_max_score}
                        </p>
                      )}
                    </div>
                    <Badge className={`text-[10px] border-0 shrink-0 ${STATUS_BADGE[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {a.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Classmates */}
        <div className="animated-border">
          <div className="animated-border-content p-4 sm:p-5">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-primary" /> Classmates
              <span className="ml-auto text-xs text-muted-foreground font-normal">{classmates.length}</span>
            </h3>
            {classmates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No classmates found</p>
            ) : (
              <div className="space-y-2">
                {classmates.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.student_id}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="animated-border">
        <div className="animated-border-content p-4 sm:p-5">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-primary" /> Announcements
            <span className="ml-auto text-xs text-muted-foreground font-normal">{announcements.length} total</span>
          </h3>
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <Bell className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No announcements yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {announcements.map((ann) => (
                <div key={ann.id} className={`rounded-xl p-4 border transition-colors ${
                  ann.is_pinned ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-foreground leading-tight">{ann.title}</p>
                    {ann.is_pinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{ann.content}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-muted-foreground">{ann.author_name}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(ann.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Student profile */}
      <div className="animated-border">
        <div className="animated-border-content p-4 sm:p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" /> My Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 text-sm">
            {[
              { label: 'Full Name',      value: student.name,                                                                              icon: <User className="h-3.5 w-3.5" /> },
              { label: 'Student ID',     value: student.student_id,                                                                        icon: <GraduationCap className="h-3.5 w-3.5" /> },
              { label: 'Class',          value: student.class,                                                                             icon: <BookOpen className="h-3.5 w-3.5" /> },
              { label: 'School',         value: student.school,                                                                            icon: <TrendingUp className="h-3.5 w-3.5" /> },
              { label: 'Email',          value: student.email,                                                                             icon: <Mail className="h-3.5 w-3.5" /> },
              { label: 'Date of Birth',  value: formatDate(student.date_of_birth),                                                         icon: <Calendar className="h-3.5 w-3.5" /> },
              { label: 'Gender',         value: student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : student.gender,      icon: <User className="h-3.5 w-3.5" /> },
              { label: 'Admission Date', value: formatDate(student.admission_date),                                                        icon: <Calendar className="h-3.5 w-3.5" /> },
              { label: 'Status',         value: student.is_active ? 'Active' : 'Inactive',                                                icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
              { label: 'Guardian',       value: student.guardian_name,                                                                     icon: <User className="h-3.5 w-3.5" /> },
              { label: 'Guardian Phone', value: student.guardian_phone,                                                                    icon: <Phone className="h-3.5 w-3.5" /> },
              { label: 'Guardian Email', value: student.guardian_email,                                                                    icon: <Mail className="h-3.5 w-3.5" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center gap-2 py-2 border-b border-border/50">
                <span className="text-muted-foreground shrink-0">{icon}</span>
                <span className="text-muted-foreground shrink-0 text-xs sm:text-sm">{label}:</span>
                <span className="text-foreground font-medium truncate text-xs sm:text-sm">{value || 'N/A'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default StudentDashboard;
