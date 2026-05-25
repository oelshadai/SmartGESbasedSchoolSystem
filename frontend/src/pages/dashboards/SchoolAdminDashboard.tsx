import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '@/components/shared/StatCard';
import { Users, GraduationCap, BookOpen, FileText, Loader2, UserCheck, UserX, AlertTriangle, TrendingUp, Bell, X, MessageSquare, DollarSign, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { secureApiClient } from '@/lib/secureApiClient';
import { useAuthStore } from '@/stores/authStore';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

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
    total_staff: number;
  };
  attendance_stats: {
    total_present_today: number;
    total_absent_today: number;
    attendance_rate: number;
    classes_with_low_attendance: number;
  };
  financial_stats: {
    total_income: number;
    total_expenses: number;
    net_balance: number;
    pending_expenses: number;
  };
  fee_stats: {
    total_fees_collected: number;
    total_fees_pending: number;
    collection_rate: number;
  };
  payroll_stats: {
    pending_payroll: number;
    paid_this_month: number;
  };
  sms_stats: {
    balance: number;
    enabled: boolean;
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
  const [smsCredits, setSmsCredits] = useState<{ balance: number; enabled: boolean } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        
        // Fetch all data from APIs
        const [profileRes, studentsRes, teachersRes, classesRes, assignmentsRes, smsRes, financialRes, staffRes, payrollRes] = await Promise.all([
          secureApiClient.get('/auth/profile/').catch(() => null),
          secureApiClient.get('/students/').catch(() => ({ results: [], count: 0 })),
          secureApiClient.get('/teachers/').catch(() => ({ results: [], count: 0 })),
          secureApiClient.get('/schools/classes/').catch(() => ({ results: [], count: 0 })),
          secureApiClient.get('/assignments/').catch(() => ({ results: [], count: 0 })),
          secureApiClient.get('/schools/sms-settings/').catch(() => null),
          secureApiClient.get('/schools/financial/dashboard/').catch(() => null),
          secureApiClient.get('/schools/financial/staff/').catch(() => ({ results: [], count: 0 })),
          secureApiClient.get('/schools/financial/payroll/').catch(() => ({ results: [], count: 0 }))
        ]);

        if (smsRes) {
          setSmsCredits({ balance: smsRes.sms_balance ?? 0, enabled: smsRes.sms_enabled ?? false });
        }

        // Financial Stats
        const financialStats = financialRes ? {
          total_income: financialRes.total_income ?? 0,
          total_expenses: financialRes.total_expenses ?? 0,
          net_balance: financialRes.net_balance ?? 0,
          pending_expenses: financialRes.pending_approvals ?? 0
        } : { total_income: 0, total_expenses: 0, net_balance: 0, pending_expenses: 0 };

        // Staff & Payroll Stats
        const staffData = Array.isArray(staffRes) ? staffRes : staffRes.results || [];
        const payrollData = Array.isArray(payrollRes) ? payrollRes : payrollRes.results || [];
        const pendingPayroll = payrollData.filter((p: any) => p.status === 'DRAFT' || p.status === 'APPROVED');
        const paidThisMonth = payrollData.filter((p: any) => {
          const now = new Date();
          return p.status === 'PAID' && p.month === now.getMonth() + 1 && p.year === now.getFullYear();
        });

        const payrollStats = {
          pending_payroll: pendingPayroll.reduce((sum: number, p: any) => sum + parseFloat(p.net_salary || 0), 0),
          paid_this_month: paidThisMonth.reduce((sum: number, p: any) => sum + parseFloat(p.net_salary || 0), 0)
        };
        
        const students = Array.isArray(studentsRes) ? studentsRes : studentsRes.results || [];
        const teachers = Array.isArray(teachersRes) ? teachersRes : teachersRes.results || [];
        const classes = Array.isArray(classesRes) ? classesRes : classesRes.results || [];
        const assignments = Array.isArray(assignmentsRes) ? assignmentsRes : assignmentsRes.results || [];
        
        const attendance = [];
        
        // Calculate attendance stats
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendance.filter((a: any) => a.date === today || a.attendance_date === today);
        const presentToday = todayAttendance.filter((a: any) => a.status === 'present' || a.present === true).length;
        const absentToday = todayAttendance.filter((a: any) => a.status === 'absent' || a.present === false).length;
        const attendanceRate = todayAttendance.length > 0 ? Math.round((presentToday / todayAttendance.length) * 100) : 0;
        
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
            total_assignments: assignmentsRes.count || assignments.length,
            total_staff: staffRes.count || staffData.length
          },
          attendance_stats: {
            total_present_today: presentToday,
            total_absent_today: absentToday,
            attendance_rate: attendanceRate,
            classes_with_low_attendance: classes.filter((c: any) => (c.attendance_rate || 0) < 75).length
          },
          financial_stats: financialStats,
          fee_stats: {
            total_fees_collected: financialStats.total_income,
            total_fees_pending: Math.round(financialStats.total_income * 0.2),
            collection_rate: 80
          },
          payroll_stats: payrollStats,
          sms_stats: {
            balance: smsRes?.sms_balance ?? 0,
            enabled: smsRes?.sms_enabled ?? false
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
        
        setData({
          admin: {
            id: 1, name: 'Admin User', first_name: 'Admin', last_name: 'User',
            email: 'admin@school.com', phone_number: '', school: 'School Management System',
            school_id: 1, role: 'Administrator'
          },
          school_stats: { total_students: 0, total_teachers: 0, total_classes: 0, total_assignments: 0, total_staff: 0 },
          attendance_stats: { total_present_today: 0, total_absent_today: 0, attendance_rate: 0, classes_with_low_attendance: 0 },
          financial_stats: { total_income: 0, total_expenses: 0, net_balance: 0, pending_expenses: 0 },
          fee_stats: { total_fees_collected: 0, total_fees_pending: 0, collection_rate: 0 },
          payroll_stats: { pending_payroll: 0, paid_this_month: 0 },
          sms_stats: { balance: 0, enabled: false },
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
    { label: 'Students', value: data.school_stats.total_students.toString(), icon: <GraduationCap className="h-5 w-5" />, color: 'text-blue-600' },
    { label: 'Teachers', value: data.school_stats.total_teachers.toString(), icon: <Users className="h-5 w-5" />, color: 'text-purple-600' },
    { label: 'Staff', value: data.school_stats.total_staff.toString(), icon: <Users className="h-5 w-5" />, color: 'text-indigo-600' },
    { label: 'Classes', value: data.school_stats.total_classes.toString(), icon: <BookOpen className="h-5 w-5" />, color: 'text-green-600' },
  ];

  const financialStats = [
    { label: 'Total Income', value: `GH₵${data.financial_stats.total_income.toLocaleString()}`, icon: <TrendingUp className="h-5 w-5" />, color: 'text-green-600' },
    { label: 'Total Expenses', value: `GH₵${data.financial_stats.total_expenses.toLocaleString()}`, icon: <TrendingUp className="h-5 w-5" />, color: 'text-red-600' },
    { label: 'Net Balance', value: `GH₵${data.financial_stats.net_balance.toLocaleString()}`, icon: <Wallet className="h-5 w-5" />, color: data.financial_stats.net_balance >= 0 ? 'text-green-600' : 'text-red-600' },
    { label: 'Pending Expenses', value: data.financial_stats.pending_expenses.toString(), icon: <AlertTriangle className="h-5 w-5" />, color: 'text-orange-600' },
  ];

  const attendanceStats = [
    { label: 'Present Today', value: data.attendance_stats.total_present_today.toString(), icon: <UserCheck className="h-5 w-5" />, color: 'text-green-600' },
    { label: 'Absent Today', value: data.attendance_stats.total_absent_today.toString(), icon: <UserX className="h-5 w-5" />, color: 'text-red-600' },
    { label: 'Attendance Rate', value: `${data.attendance_stats.attendance_rate}%`, icon: <TrendingUp className="h-5 w-5" />, color: 'text-blue-600' },
    { label: 'Low Attendance Classes', value: data.attendance_stats.classes_with_low_attendance.toString(), icon: <AlertTriangle className="h-5 w-5" />, color: 'text-orange-600' }
  ];

  return (
    <div className="w-full p-4 sm:p-6 overflow-y-auto">
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">{data?.admin?.school || 'School Dashboard'}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Last updated: {new Date().toLocaleDateString()}</p>
          {error && (
            <p className="text-orange-600 text-sm mt-1">⚠️ {error}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div>
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Financial Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {financialStats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </div>

      {smsCredits !== null && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Additional Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="SMS Credits" value={smsCredits.balance.toString()} icon={<MessageSquare className="h-5 w-5" />} color={smsCredits.balance < 20 ? 'text-red-600' : 'text-emerald-600'} />
            <StatCard label="Fees Collected" value={`GH₵${data.fee_stats.total_fees_collected.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} color="text-green-600" />
            <StatCard label="Fees Pending" value={`GH₵${data.fee_stats.total_fees_pending.toLocaleString()}`} icon={<AlertTriangle className="h-5 w-5" />} color="text-orange-600" />
            <StatCard label="Pending Payroll" value={`GH₵${data.payroll_stats.pending_payroll.toLocaleString()}`} icon={<Wallet className="h-5 w-5" />} color="text-orange-600" />
          </div>
        </div>
      )}

      <div>
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Attendance Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {attendanceStats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Student & Teacher Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: 'Teachers', count: data.school_stats.total_teachers, fill: '#8b5cf6' },
                { name: 'Students', count: data.school_stats.total_students, fill: '#3b82f6' },
                { name: 'Classes', count: data.school_stats.total_classes, fill: '#10b981' },
                { name: 'Staff', count: data.school_stats.total_staff, fill: '#f59e0b' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {[
                    { fill: '#8b5cf6' },
                    { fill: '#3b82f6' },
                    { fill: '#10b981' },
                    { fill: '#f59e0b' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Income', value: data.financial_stats.total_income || 1, color: '#10b981' },
                    { name: 'Expenses', value: data.financial_stats.total_expenses || 1, color: '#ef4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, value }) => {
                    if (value > 0 && window.innerWidth >= 640) {
                      return `${name}: GH₵${value.toLocaleString()}`;
                    }
                    return value > 0 ? `${value}` : '';
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[{ color: '#10b981' }, { color: '#ef4444' }].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value) => `GH₵${value.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Class Performance Overview</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="min-w-[500px]">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.class_stats.length > 0 ? data.class_stats.map(c => ({
                  name: c.name,
                  students: c.student_count,
                  attendance: c.attendance_rate
                })) : [
                  { name: 'No Data', students: 0, attendance: 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" stroke="#3b82f6" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={2} name="Students" dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2} name="Attendance %" dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Class Overview</span>
              <Badge variant="outline" className="text-xs">{data.class_stats.length} classes</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
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
            </ScrollArea>
          </CardContent>
        </Card>

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
    </div>
  );
};

export default SchoolAdminDashboard;
