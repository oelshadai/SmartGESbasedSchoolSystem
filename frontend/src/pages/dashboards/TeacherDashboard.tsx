import { useState, useEffect } from 'react';
import StatCard from '@/components/shared/StatCard';
import { ClipboardList, Users, Award, Loader2, UserCheck, Bell, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { secureApiClient } from '@/lib/secureApiClient';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import QuickLogin from '@/components/QuickLogin';

interface TeacherDashboardData {
  teacher: {
    id: number;
    user_id: number;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    employee_id: string;
    phone_number: string;
    school: string;
    school_id: number;
    qualification: string;
    experience_years: number;
    hire_date: string;
    is_class_teacher: boolean;
    is_active: boolean;
    role: string;
  };
  assigned_classes: Array<{
    id: number;
    name: string;
    level: string;
    students_count: number;
  }>;
  teaching_subjects: Array<{
    id: number;
    subject: string;
    class: string;
  }>;
  stats: {
    total_assignments: number;
    total_classes: number;
    total_subjects: number;
    attendance_taken_today: number;
  };
  announcements: Array<{
    id: number;
    title: string;
    content: string;
    created_at: string;
    priority: string;
  }>;
}

const TeacherDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuthStore();

  // Check authentication first
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch dashboard data with proper error handling
        const [dashboardResponse, statsResponse] = await Promise.allSettled([
          secureApiClient.get<TeacherDashboardData>('/auth/teacher-dashboard/'),
          secureApiClient.get('/teachers/dashboard_stats/')
        ]);
        
        // Handle dashboard response
        if (dashboardResponse.status === 'fulfilled') {
          let updatedData = dashboardResponse.value;
          
          // Handle stats response if successful
          if (statsResponse.status === 'fulfilled') {
            updatedData = {
              ...dashboardResponse.value,
              stats: {
                total_assignments: statsResponse.value.assignments?.total || dashboardResponse.value.stats?.total_assignments || 0,
                total_classes: statsResponse.value.classes?.total_classes || dashboardResponse.value.stats?.total_classes || 0,
                total_subjects: statsResponse.value.classes?.as_subject_teacher || dashboardResponse.value.stats?.total_subjects || 0,
                attendance_taken_today: statsResponse.value.attendance?.present_today || dashboardResponse.value.stats?.attendance_taken_today || 0
              }
            };
          }
          
          setData(updatedData);
          setError(null);
        } else {
          // Dashboard request failed - handle 401 specifically
          const errorResponse = dashboardResponse.reason;
          if (errorResponse?.response?.status === 401) {
            console.error('Authentication failed - redirecting to login');
            logout();
            navigate('/login');
            return;
          }
          
          console.error('Dashboard request failed:', errorResponse);
          setError(errorResponse?.message || 'Failed to load dashboard');
        }
        
      } catch (err: any) {
        console.error('Failed to load dashboard:', err);
        
        // Handle 401 errors
        if (err?.response?.status === 401) {
          console.error('Authentication failed - redirecting to login');
          logout();
          navigate('/login');
          return;
        }
        
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate, logout, isAuthenticated]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold text-destructive">Dashboard Error</h3>
          </div>
          <p className="text-destructive mb-3">{error || 'Failed to load dashboard data'}</p>
          <div className="flex gap-3">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm"
            >
              Retry
            </Button>
            <Button 
              onClick={() => {
                logout();
                navigate('/login');
              }} 
              variant="destructive" 
              size="sm"
            >
              Re-login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Ensure data exists and has required properties
  const safeData = {
    teacher: {
      id: data?.teacher?.id || 0,
      user_id: data?.teacher?.user_id || 0,
      name: data?.teacher?.name || 'Unknown Teacher',
      first_name: data?.teacher?.first_name || '',
      last_name: data?.teacher?.last_name || '',
      email: data?.teacher?.email || '',
      employee_id: data?.teacher?.employee_id || '',
      phone_number: data?.teacher?.phone_number || '',
      school: data?.teacher?.school || 'Unknown School',
      school_id: data?.teacher?.school_id || 0,
      qualification: data?.teacher?.qualification || '',
      experience_years: data?.teacher?.experience_years || 0,
      hire_date: data?.teacher?.hire_date || '',
      is_class_teacher: data?.teacher?.is_class_teacher || false,
      is_active: data?.teacher?.is_active || false,
      role: data?.teacher?.role || 'TEACHER'
    },
    assigned_classes: data?.assigned_classes || [],
    teaching_subjects: data?.teaching_subjects || [],
    stats: {
      total_assignments: data?.stats?.total_assignments || 0,
      total_classes: data?.stats?.total_classes || 0,
      total_subjects: data?.stats?.total_subjects || 0,
      attendance_taken_today: data?.stats?.attendance_taken_today || 0
    },
    announcements: data?.announcements || []
  };

  const stats = [
    { 
      label: 'Assignments', 
      value: safeData.stats.total_assignments.toString(), 
      icon: <ClipboardList className="h-5 w-5" />, 
      color: 'text-secondary',
      sub: 'total created',
    },
    { 
      label: 'Classes', 
      value: safeData.stats.total_classes.toString(), 
      icon: <Users className="h-5 w-5" />, 
      color: 'text-info',
      sub: 'assigned to you',
    },
    { 
      label: 'Subjects', 
      value: safeData.stats.total_subjects.toString(), 
      icon: <Award className="h-5 w-5" />, 
      color: 'text-success',
      sub: 'teaching',
    },
    { 
      label: 'Attendance Today', 
      value: safeData.stats.attendance_taken_today.toString(), 
      icon: <UserCheck className="h-5 w-5" />, 
      color: 'text-accent',
      sub: 'records taken',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome, {safeData.teacher.first_name || 'Teacher'}! Manage your classes and assignments</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} trend={s.sub} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animated-border">
          <div className="animated-border-content p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Assigned Classes</h3>
              <Badge variant="outline" className="text-xs">{safeData.assigned_classes.length} classes</Badge>
            </div>
            <div className="space-y-3">
              {safeData.assigned_classes.length > 0 ? (
                safeData.assigned_classes.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{cls.name}</p>
                      <p className="text-xs text-muted-foreground">{cls.level} · {cls.students_count} students</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No classes assigned</p>
              )}
            </div>
          </div>
        </div>

        <div className="animated-border">
          <div className="animated-border-content p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">School Announcements</h3>
              <Bell className="h-4 w-4 text-blue-500" />
            </div>
            <div className="space-y-3">
              {safeData.announcements.length > 0 ? (
                safeData.announcements.map((announcement) => (
                  <div key={announcement.id} className="animated-border-subtle">
                    <div className="animated-border-subtle-content p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-foreground">{announcement.title}</h4>
                        <Badge variant={announcement.priority === 'high' ? 'destructive' : 'outline'} className="text-xs">
                          {announcement.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{announcement.content}</p>
                      <p className="text-xs text-gray-400">{new Date(announcement.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No announcements</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animated-border">
          <div className="animated-border-content p-6">
            <h3 className="font-semibold text-foreground mb-4">Teaching Subjects</h3>
            <div className="space-y-3">
              {safeData.teaching_subjects.length > 0 ? (
                safeData.teaching_subjects.map((subj) => (
                  <div key={subj.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{subj.subject}</p>
                      <p className="text-xs text-muted-foreground">{subj.class}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No subjects assigned</p>
              )}
            </div>
          </div>
        </div>
        <div className="animated-border pulse-glow">
          <div className="animated-border-content p-6">
            <h3 className="font-semibold text-foreground mb-4">Teacher Profile</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="text-foreground">{safeData.teacher.name}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Email:</span>
                <span className="text-foreground">{safeData.teacher.email}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Employee ID:</span>
                <span className="text-foreground">{safeData.teacher.employee_id}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">School:</span>
                <span className="text-foreground">{safeData.teacher.school}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Qualification:</span>
                <span className="text-foreground">{safeData.teacher.qualification || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Experience:</span>
                <span className="text-foreground">{safeData.teacher.experience_years} years</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Hire Date:</span>
                <span className="text-foreground">{safeData.teacher.hire_date ? new Date(safeData.teacher.hire_date).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
