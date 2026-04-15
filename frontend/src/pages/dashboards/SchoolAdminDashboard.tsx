import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '@/components/shared/StatCard';
import { Users, GraduationCap, BookOpen, FileText, Loader2, UserCheck, UserX, AlertTriangle, TrendingUp, Bell, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { secureApiClient } from '@/lib/secureApiClient';
import { useAuthStore } from '@/stores/authStore';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'attendance' | 'assignment' | 'fee' | 'general' | 'warning' | 'success';
  activity_type: string;
  class_name: string;
  teacher_name: string;
  read: boolean;
  created_at: string;
}

interface AdminDashboardData {
  admin: {
    id: number;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    school: string;
    school_id: number;
    role: string;
  };
  school_stats: {
    total_students: number;
    total_teachers: number;
    total_classes: number;
    total_assignments: number;
  };
  attendance_stats: {
    total_present_today: number;
    total_absent_today: number;
    attendance_rate: number;
    classes_with_low_attendance: number;
  };
  class_stats: Array<{
    id: number;
    name: string;
    level: string;
    student_count: number;
    class_teacher: string;
    attendance_rate: number;
  }>;
  recent_students: Array<{
    id: number;
    name: string;
    student_id: string;
    class: string;
  }>;
  recent_teachers: Array<{
    id: number;
    name: string;
    employee_id: string;
    qualification: string;
  }>;
}

const SchoolAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        
        // Fetch profile and dashboard data from API
        const [profileRes, studentsRes, teachersRes, classesRes, assignmentsRes] = await Promise.all([
          secureApiClient.get('/auth/profile/').catch(() => null),
          secureApiClient.get('/students/').catch(() => ({ results: [], count: 0 })),
          secureApiClient.get('/teachers/').catch(() => ({ results: [], count: 0 })),
          secureApiClient.get('/schools/classes/').catch(() => ({ results: [], count: 0 })),
          secureApiClient.get('/assignments/').catch(() => ({ results: [], count: 0 }))
        ]);
        
        const students = Array.isArray(studentsRes) ? studentsRes : studentsRes.results || [];
        const teachers = Array.isArray(teachersRes) ? teachersRes : teachersRes.results || [];
        const classes = Array.isArray(classesRes) ? classesRes : classesRes.results || [];
        const assignments = Array.isArray(assignmentsRes) ? assignmentsRes : assignmentsRes.results || [];
        
        // Skip attendance data for now
        const attendance = [];
        
        // Calculate attendance stats
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendance.filter((a: any) => a.date === today || a.attendance_date === today);
        const presentToday = todayAttendance.filter((a: any) => a.status === 'present' || a.present === true).length;
        const absentToday = todayAttendance.filter((a: any) => a.status === 'absent' || a.present === false).length;
        const attendanceRate = todayAttendance.length > 0 ? Math.round((presentToday / todayAttendance.length) * 100) : 0;
        
        // Use API profile data, fall back to auth store
        const storeUser = useAuthStore.getState().user;
        const userRes = profileRes || storeUser;
        
        setData({
          admin: {
            id: userRes?.id || 1,
            name: userRes ? `${userRes.first_name || ''} ${userRes.last_name || ''}`.trim() || userRes.email : 'Admin User',
            first_name: userRes?.first_name || 'Admin',
            last_name: userRes?.last_name || 'User',
            email: userRes?.email || 'admin@school.com',
            phone_number: userRes?.phone_number || '',
            school: userRes?.school?.name || (typeof userRes?.school === 'string' ? userRes.school : 'School Management System'),
            school_id: userRes?.school?.id || 1,
            role: userRes?.role || 'Administrator'
          },
          school_stats: {
            total_students: studentsRes.count || students.length,
            total_teachers: teachersRes.count || teachers.length,
            total_classes: classesRes.count || classes.length,
            total_assignments: assignmentsRes.count || assignments.length
          },
          attendance_stats: {
            total_present_today: presentToday,
            total_absent_today: absentToday,
            attendance_rate: attendanceRate,
            classes_with_low_attendance: classes.filter((c: any) => (c.attendance_rate || 0) < 75).length
          },
          class_stats: classes.slice(0, 5).map((cls: any) => ({
            id: cls.id,
            name: cls.name || cls.class_name,
            level: cls.level || cls.grade,
            student_count: cls.student_count || cls.students?.length || 0,
            class_teacher: cls.class_teacher?.name || cls.teacher?.name || 'Not Assigned',
            attendance_rate: cls.attendance_rate || 0
          })),
          recent_students: students.slice(0, 5).map((student: any) => ({
            id: student.id,
            name: student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
            student_id: student.student_id || student.admission_number || student.id?.toString(),
            class: student.class_name || student.class?.name || student.current_class
          })),
          recent_teachers: teachers.slice(0, 5).map((teacher: any) => ({
            id: teacher.id,
            name: teacher.name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim(),
            employee_id: teacher.employee_id || teacher.staff_id || teacher.id?.toString(),
            qualification: teacher.qualification || teacher.subject || teacher.department
          }))
        });
        
        setError(null);
      } catch (err: any) {
        console.error('Failed to load dashboard:', err);
        setError('Some dashboard data may be unavailable');
        
        // Use admin dashboard data if available, otherwise fallback
        setData({
          admin: {
            id: 1,
            name: 'Admin User',
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@school.com',
            phone_number: '',
            school: 'School Management System',
            school_id: 1,
            role: 'Administrator'
          },
          school_stats: {
            total_students: 0,
            total_teachers: 0,
            total_classes: 0,
            total_assignments: 0
          },
          attendance_stats: {
            total_present_today: 0,
            total_absent_today: 0,
            attendance_rate: 0,
            classes_with_low_attendance: 0
          },
          class_stats: [],
          recent_students: [],
          recent_teachers: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const markNotificationRead = async (id: number) => {
    try {
      await secureApiClient.post(`/notifications/notifications/${id}/mark_read/`);
      setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'attendance': return <UserCheck className="h-4 w-4" />;
      case 'assignment': return <FileText className="h-4 w-4" />;
      case 'fee': return <TrendingUp className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'attendance': return 'text-blue-600';
      case 'assignment': return 'text-green-600';
      case 'fee': return 'text-orange-600';
      case 'warning': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

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

  if (error && !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">Error loading dashboard: {error}</p>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      label: 'Teachers', 
      value: data.school_stats.total_teachers.toString(), 
      icon: <Users className="h-5 w-5" />, 
      color: 'text-secondary' 
    },
    { 
      label: 'Students', 
      value: data.school_stats.total_students.toString(), 
      icon: <GraduationCap className="h-5 w-5" />, 
      color: 'text-info' 
    },
    { 
      label: 'Classes', 
      value: data.school_stats.total_classes.toString(), 
      icon: <BookOpen className="h-5 w-5" />, 
      color: 'text-success' 
    },
    { 
      label: 'Assignments', 
      value: data.school_stats.total_assignments.toString(), 
      icon: <FileText className="h-5 w-5" />, 
      color: 'text-accent' 
    },
  ];

  const attendanceStats = [
    {
      label: 'Present Today',
      value: data.attendance_stats.total_present_today.toString(),
      icon: <UserCheck className="h-5 w-5" />,
      color: 'text-green-600'
    },
    {
      label: 'Absent Today', 
      value: data.attendance_stats.total_absent_today.toString(),
      icon: <UserX className="h-5 w-5" />,
      color: 'text-red-600'
    },
    {
      label: 'Attendance Rate',
      value: `${data.attendance_stats.attendance_rate}%`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-blue-600'
    },
    {
      label: 'Low Attendance Classes',
      value: data.attendance_stats.classes_with_low_attendance.toString(),
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">{data?.admin?.school || 'School Dashboard'}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Last updated: {new Date().toLocaleDateString()}</p>
          {error && (
            <p className="text-orange-600 text-sm mt-1">⚠️ {error}</p>
          )}
        </div>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </Button>
          
          {showNotifications && (
            <Card className="absolute right-0 top-12 w-80 z-50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Notifications</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-80">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => markNotificationRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={getNotificationColor(notification.type)}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {notification.class_name && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.class_name}
                                </Badge>
                              )}
                              {notification.teacher_name && (
                                <span className="text-xs text-gray-500">
                                  {notification.teacher_name}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No notifications
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Attendance Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {attendanceStats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Class Overview</span>
              <Badge variant="outline" className="text-xs">{data.class_stats.length} classes</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.class_stats.length > 0 ? (
                data.class_stats.map((classItem) => (
                  <div key={classItem.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-foreground">{classItem.name}</h4>
                        <p className="text-sm text-muted-foreground">{classItem.class_teacher}</p>
                      </div>
                      <Badge variant={classItem.attendance_rate >= 80 ? "default" : "destructive"}>
                        {classItem.attendance_rate}% attendance
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{classItem.student_count} students</span>
                      <Progress 
                        value={classItem.attendance_rate} 
                        className="w-20 h-2" 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No classes found</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="relative group rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-lg overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Recent Students</h3>
            <Badge variant="outline" className="text-xs">{data.recent_students.length} total</Badge>
          </div>
          <div className="space-y-3">
            {data.recent_students.length > 0 ? (
              data.recent_students.map((student) => (
                <div key={student.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.student_id} · {student.class}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No students found</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative group rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 shadow-lg overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-violet-400 opacity-60 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Recent Teachers</h3>
            <Badge variant="outline" className="text-xs">{data.recent_teachers.length} total</Badge>
          </div>
          <div className="space-y-3">
            {data.recent_teachers.length > 0 ? (
              data.recent_teachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{teacher.name}</p>
                    <p className="text-xs text-muted-foreground">{teacher.employee_id} · {teacher.qualification}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No teachers found</p>
            )}
          </div>
        </div>
        <div className="relative group rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 shadow-lg overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-400 opacity-60 group-hover:opacity-100 transition-opacity" />
          <h3 className="font-semibold text-foreground mb-4">Admin Profile</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="text-foreground">{data.admin.name}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Email:</span>
              <span className="text-foreground">{data.admin.email}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">School:</span>
              <span className="text-foreground">{data.admin.school}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Role:</span>
              <Badge variant="outline">{data.admin.role}</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolAdminDashboard;
