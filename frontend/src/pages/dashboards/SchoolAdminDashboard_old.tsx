import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '@/components/shared/StatCard';
import { Users, GraduationCap, BookOpen, FileText, Loader2, UserCheck, UserX, AlertTriangle, TrendingUp, Bell, X, MessageSquare, DollarSign, Wallet, CreditCard, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { secureApiClient } from '@/lib/secureApiClient';
import { useAuthStore } from '@/stores/authStore';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    monthly_income: number;
    monthly_expenses: number;
  };
  fee_stats: {
    total_fees_expected: number;
    total_fees_collected: number;
    total_fees_pending: number;
    collection_rate: number;
  };
  payroll_stats: {
    total_payroll: number;
    pending_payroll: number;
    paid_this_month: number;
  };
  sms_stats: {
    balance: number;
    enabled: boolean;
    sent_today: number;
    sent_this_month: number;
  };
  class_stats: Array<{
    id: number;
    name: string;
    level: string;
    student_count: number;
    class_teacher: string;
    attendance_rate: number;
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
        
        const [profileRes, studentsRes, teachersRes, classesRes, smsRes, financialRes, staffRes, payrollRes] = await Promise.all([
          secureApiClient.get('/auth/profile/').catch(() => null),
          secureApiClient.get('/students/').catch(() => ({ results: [], count: 0 })),
          secureApiClient.get('/teachers/').catch(() => ({ results: [], count: 0 })),
          secureApiClient.get('/schools/classes/').catch(() => ({ results: [], count: 0 })),
          secureApiClient.get('/schools/sms-settings/').catch(() => null),
          secureApiClient.get('/schools/financial/dashboard/').catch(() => null),
          secureApiClient.get('/schools/financial/staff/').catch(() => ({ results: [], count: 0 })),
          secureApiClient.get('/schools/financial/payroll/').catch(() => ({ results: [], count: 0 }))
        ]);

        const smsStats = smsRes ? {
          balance: smsRes.sms_balance ?? 0,
          enabled: smsRes.sms_enabled ?? false,
          sent_today: 0,
          sent_this_month: 0
        } : { balance: 0, enabled: false, sent_today: 0, sent_this_month: 0 };

        const financialStats = financialRes ? {
          total_income: financialRes.total_income ?? 0,
          total_expenses: financialRes.total_expenses ?? 0,
          net_balance: financialRes.net_balance ?? 0,
          pending_expenses: financialRes.pending_approvals ?? 0,
          monthly_income: financialRes.monthly_summary?.income ?? 0,
          monthly_expenses: financialRes.monthly_summary?.expenses ?? 0
        } : {
          total_income: 0, total_expenses: 0, net_balance: 0, pending_expenses: 0,
          monthly_income: 0, monthly_expenses: 0
        };

        const feeStats = {
          total_fees_expected: 50000,
          total_fees_collected: 35000,
          total_fees_pending: 15000,
          collection_rate: 70
        };

        const staffData = Array.isArray(staffRes) ? staffRes : staffRes.results || [];
        const payrollData = Array.isArray(payrollRes) ? payrollRes : payrollRes.results || [];
        const pendingPayroll = payrollData.filter((p: any) => p.status === 'DRAFT' || p.status === 'APPROVED');
        const paidThisMonth = payrollData.filter((p: any) => {
          const now = new Date();
          return p.status === 'PAID' && p.month === now.getMonth() + 1 && p.year === now.getFullYear();
        });

        const payrollStats = {
          total_payroll: payrollData.reduce((sum: number, p: any) => sum + parseFloat(p.net_salary || 0), 0),
          pending_payroll: pendingPayroll.reduce((sum: number, p: any) => sum + parseFloat(p.net_salary || 0), 0),
          paid_this_month: paidThisMonth.reduce((sum: number, p: any) => sum + parseFloat(p.net_salary || 0), 0)
        };
        
        const students = Array.isArray(studentsRes) ? studentsRes : studentsRes.results || [];
        const teachers = Array.isArray(teachersRes) ? teachersRes : teachersRes.results || [];
        const classes = Array.isArray(classesRes) ? classesRes : classesRes.results || [];
        
        const attendance = [];
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
            total_staff: staffRes.count || staffData.length
          },
          attendance_stats: {
            total_present_today: presentToday,
            total_absent_today: absentToday,
            attendance_rate: attendanceRate,
            classes_with_low_attendance: classes.filter((c: any) => (c.attendance_rate || 0) < 75).length
          },
          financial_stats: financialStats,
          fee_stats: feeStats,
          payroll_stats: payrollStats,
          sms_stats: smsStats,
          class_stats: classes.slice(0, 5).map((cls: any) => ({
            id: cls.id,
            name: cls.name || cls.class_name,
            level: cls.level || cls.grade,
            student_count: cls.student_count || cls.students?.length || 0,
            class_teacher: cls.class_teacher?.name || cls.teacher?.name || 'Not Assigned',
            attendance_rate: cls.attendance_rate || 0
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
          school_stats: { total_students: 0, total_teachers: 0, total_classes: 0, total_staff: 0 },
          attendance_stats: { total_present_today: 0, total_absent_today: 0, attendance_rate: 0, classes_with_low_attendance: 0 },
          financial_stats: { total_income: 0, total_expenses: 0, net_balance: 0, pending_expenses: 0, monthly_income: 0, monthly_expenses: 0 },
          fee_stats: { total_fees_expected: 0, total_fees_collected: 0, total_fees_pending: 0, collection_rate: 0 },
          payroll_stats: { total_payroll: 0, pending_payroll: 0, paid_this_month: 0 },
          sms_stats: { balance: 0, enabled: false, sent_today: 0, sent_this_month: 0 },
          class_stats: []
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

  const schoolStats = [
    { label: 'Students', value: data.school_stats.total_students.toString(), icon: <GraduationCap className="h-5 w-5" />, color: 'text-blue-600' },
    { label: 'Teachers', value: data.school_stats.total_teachers.toString(), icon: <Users className="h-5 w-5" />, color: 'text-purple-600' },
    { label: 'Staff', value: data.school_stats.total_staff.toString(), icon: <Users className="h-5 w-5" />, color: 'text-indigo-600' },
    { label: 'Classes', value: data.school_stats.total_classes.toString(), icon: <BookOpen className="h-5 w-5" />, color: 'text-green-600' },
  ];

  const attendanceStats = [
    { label: 'Present Today', value: data.attendance_stats.total_present_today.toString(), icon: <UserCheck className="h-5 w-5" />, color: 'text-green-600' },
    { label: 'Absent Today', value: data.attendance_stats.total_absent_today.toString(), icon: <UserX className="h-5 w-5" />, color: 'text-red-600' },
    { label: 'Attendance Rate', value: `${data.attendance_stats.attendance_rate}%`, icon: <TrendingUp className="h-5 w-5" />, color: 'text-blue-600' },
    { label: 'Low Attendance', value: data.attendance_stats.classes_with_low_attendance.toString(), icon: <AlertTriangle className="h-5 w-5" />, color: 'text-orange-600' }
  ];

  const financialStats = [
    { label: 'Total Income', value: `GH₵${data.financial_stats.total_income.toLocaleString()}`, icon: <TrendingUp className="h-5 w-5" />, color: 'text-green-600' },
    { label: 'Total Expenses', value: `GH₵${data.financial_stats.total_expenses.toLocaleString()}`, icon: <DollarSign className="h-5 w-5" />, color: 'text-red-600' },
    { label: 'Net Balance', value: `GH₵${data.financial_stats.net_balance.toLocaleString()}`, icon: <Wallet className="h-5 w-5" />, color: data.financial_stats.net_balance >= 0 ? 'text-green-600' : 'text-red-600' },
    { label: 'Pending Expenses', value: data.financial_stats.pending_expenses.toString(), icon: <AlertTriangle className="h-5 w-5" />, color: 'text-orange-600' },
  ];

  const feeStats = [
    { label: 'Fees Expected', value: `GH₵${data.fee_stats.total_fees_expected.toLocaleString()}`, icon: <CreditCard className="h-5 w-5" />, color: 'text-blue-600' },
    { label: 'Fees Collected', value: `GH₵${data.fee_stats.total_fees_collected.toLocaleString()}`, icon: <TrendingUp className="h-5 w-5" />, color: 'text-green-600' },
    { label: 'Fees Pending', value: `GH₵${data.fee_stats.total_fees_pending.toLocaleString()}`, icon: <AlertTriangle className="h-5 w-5" />, color: 'text-orange-600' },
    { label: 'Collection Rate', value: `${data.fee_stats.collection_rate.toFixed(1)}%`, icon: <TrendingUp className="h-5 w-5" />, color: 'text-purple-600' },
  ];

  const payrollStats = [
    { label: 'Total Payroll', value: `GH₵${data.payroll_stats.total_payroll.toLocaleString()}`, icon: <DollarSign className="h-5 w-5" />, color: 'text-blue-600' },
    { label: 'Pending Payroll', value: `GH₵${data.payroll_stats.pending_payroll.toLocaleString()}`, icon: <Calendar className="h-5 w-5" />, color: 'text-orange-600' },
    { label: 'Paid This Month', value: `GH₵${data.payroll_stats.paid_this_month.toLocaleString()}`, icon: <TrendingUp className="h-5 w-5" />, color: 'text-green-600' },
    { label: 'SMS Credits', value: data.sms_stats.balance.toString(), icon: <MessageSquare className="h-5 w-5" />, color: data.sms_stats.balance < 20 ? 'text-red-600' : 'text-emerald-600' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">{data?.admin?.school || 'School Dashboard'}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Complete Overview - {new Date().toLocaleDateString()}</p>
          {error && <p className="text-orange-600 text-sm mt-1">⚠️ {error}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowNotifications(!showNotifications)} className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">{unreadCount}</Badge>}
        </Button>
      </div>

      <div>
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3">School Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {schoolStats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </div>

      <div>
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3">Attendance Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {attendanceStats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </div>

      <div>
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3">Financial Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {financialStats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </div>

      <div>
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3">Fee Collection</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {feeStats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </div>

      <div>
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3">Payroll & Communication</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {payrollStats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Financial Overview</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={[
                { month: 'Jan', income: data.financial_stats.monthly_income * 0.8, expenses: data.financial_stats.monthly_expenses * 0.7 },
                { month: 'Feb', income: data.financial_stats.monthly_income * 0.9, expenses: data.financial_stats.monthly_expenses * 0.8 },
                { month: 'Mar', income: data.financial_stats.monthly_income * 1.1, expenses: data.financial_stats.monthly_expenses * 0.9 },
                { month: 'Apr', income: data.financial_stats.monthly_income, expenses: data.financial_stats.monthly_expenses }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Income" />
                <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Fee Collection Status</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Collected', value: data.fee_stats.total_fees_collected, color: '#10b981' },
                    { name: 'Pending', value: data.fee_stats.total_fees_pending, color: '#f59e0b' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[{ color: '#10b981' }, { color: '#f59e0b' }].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Attendance Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[
                { name: 'Present', count: data.attendance_stats.total_present_today },
                { name: 'Absent', count: data.attendance_stats.total_absent_today }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {[{ fill: '#10b981' }, { fill: '#ef4444' }].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Class Performance</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.class_stats.map(c => ({ name: c.name, students: c.student_count, attendance: c.attendance_rate }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#3b82f6" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={2} name="Students" dot={{ fill: '#3b82f6', r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2} name="Attendance %" dot={{ fill: '#10b981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Class Overview</span>
            <Badge variant="outline" className="text-xs">{data.class_stats.length} classes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
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
                      <Progress value={classItem.attendance_rate} className="w-20 h-2" />
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
    </div>
  );
};

export default SchoolAdminDashboard;
