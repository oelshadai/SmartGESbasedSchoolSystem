import { useState, useEffect } from 'react';
import { 
  School, Users, GraduationCap, DollarSign, Loader2, 
  Activity, Shield, Database, Globe,
  ChevronRight, BarChart3, PieChart, Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { secureApiClient } from '@/lib/secureApiClient';

interface SystemStats {
  total_schools: number;
  total_students: number;
  total_teachers: number;
  total_admins: number;
  total_assignments: number;
}

interface RecentSchool {
  id: number;
  name: string;
  location?: string;
  enrollment_count: number;
  admin_count: number;
  teacher_count: number;
  status: 'active' | 'inactive' | 'pending';
}

interface SuperAdminDashboardData {
  superadmin: {
    id: number;
    user_id: number;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  system_stats: SystemStats;
  recent_schools: RecentSchool[];
}

const ProfessionalSuperAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SuperAdminDashboardData | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await secureApiClient.get<SuperAdminDashboardData>('/auth/superadmin-dashboard/');
        setData(response);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load dashboard:', err);
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-12 sm:py-20">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-xl opacity-50" />
            <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-cyan-400" />
              <p className="text-foreground/60 text-lg">Loading dashboard...</p>
              <p className="text-foreground/70 text-sm mt-2">Fetching system analytics</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-red-400">Dashboard Error</h3>
            </div>
            <p className="text-red-300">Error loading dashboard: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      label: 'Total Schools', 
      value: data.system_stats.total_schools,
      icon: School, 
      gradient: 'from-blue-500 to-cyan-400',
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/10',
      glow: 'shadow-blue-500/10',
      iconColor: 'text-blue-400',
    },
    { 
      label: 'Total Teachers', 
      value: data.system_stats.total_teachers,
      icon: Users, 
      gradient: 'from-purple-500 to-violet-400',
      border: 'border-purple-500/20',
      bg: 'bg-purple-500/10',
      glow: 'shadow-purple-500/10',
      iconColor: 'text-purple-400',
    },
    { 
      label: 'Total Students', 
      value: data.system_stats.total_students,
      icon: GraduationCap, 
      gradient: 'from-emerald-500 to-green-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/10',
      glow: 'shadow-emerald-500/10',
      iconColor: 'text-emerald-400',
    },
    { 
      label: 'School Admins', 
      value: data.system_stats.total_admins,
      icon: Shield, 
      gradient: 'from-orange-500 to-amber-400',
      border: 'border-orange-500/20',
      bg: 'bg-orange-500/10',
      glow: 'shadow-orange-500/10',
      iconColor: 'text-orange-400',
    },
  ];

  return (
    <div className="teacher-dashboard-page w-full p-4 sm:p-6 overflow-y-auto">
      <div className="space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="teacher-dashboard-title text-xl sm:text-2xl font-bold tracking-wide">
              Super Admin Dashboard
            </h1>
            <p className="text-sm text-foreground/70 mt-1">
              Platform overview · {data.superadmin.name}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 sm:px-4 sm:py-2 shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs sm:text-sm text-foreground/70">System Online</span>
              </div>
            </div>
            <Button className="hidden sm:flex bg-primary text-primary-foreground">
              <Activity className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="teacher-dashboard-stats grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="teacher-dashboard-stat-card rounded-xl border border-slate-200 bg-slate-100 p-2.5 sm:p-4 flex flex-col gap-1 shadow-md">
                {/* Top accent line */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient} opacity-70 group-hover:opacity-100 transition-opacity`} />
                {/* Background glow bubble */}
                <div className={`absolute -top-8 -right-8 w-24 h-24 ${stat.bg} rounded-full blur-2xl opacity-70 group-hover:opacity-100 transition-opacity`} />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">{stat.label}</span>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-foreground leading-none">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Schools Overview */}
          <div className="lg:col-span-2">
            <div className="teacher-dashboard-panel rounded-xl border border-slate-200 bg-slate-100 shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <School className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Schools Overview</h3>
                    <p className="text-foreground/70 text-sm">Manage and monitor all schools</p>
                  </div>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {data.recent_schools.length} schools
                </Badge>
              </div>

              <div className="space-y-4">
                {data.recent_schools.length > 0 ? (
                  data.recent_schools.map((school) => (
                    <div key={school.id} className="group rounded-lg border border-border bg-muted/30 p-3 hover:bg-muted/60 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                            <School className="h-6 w-6 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {school.name}
                            </h4>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-x-3 text-xs sm:text-sm text-foreground/70 mt-1">
                              <span>{school.enrollment_count} students</span>
                              <span className="hidden sm:inline">•</span>
                              <span>{school.teacher_count} teachers</span>
                              <span className="hidden sm:inline">•</span>
                              <span>{school.admin_count} admin(s)</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            className={
                              school.status === 'active' 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            }
                          >
                            {school.status}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-foreground/70 group-hover:text-foreground/60 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <School className="h-12 w-12 text-foreground mx-auto mb-4" />
                    <p className="text-foreground/70">No schools found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* System Statistics */}
          <div className="space-y-6">
            <div className="teacher-dashboard-panel rounded-xl border border-slate-200 bg-slate-100 shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">System Stats</h3>
                  <p className="text-foreground/70 text-sm">Platform metrics</p>
                </div>
              </div>

              <div className="space-y-1">
                {[
                  { label: 'Total Assignments', value: data.system_stats.total_assignments, icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  { label: 'Schools', value: data.system_stats.total_schools, icon: School, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { label: 'Teachers', value: data.system_stats.total_teachers, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                  { label: 'Students', value: data.system_stats.total_students, icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { label: 'School Admins', value: data.system_stats.total_admins, icon: Shield, color: 'text-orange-400', bg: 'bg-orange-500/10' }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/60 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${item.bg}`}>
                          <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                        </div>
                        <span className="text-sm text-foreground/70 group-hover:text-foreground/60 transition-colors">{item.label}</span>
                      </div>
                      <span className="font-bold text-foreground text-sm">{item.value.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Admin Profile */}
            <div className="teacher-dashboard-panel rounded-xl border border-slate-200 bg-slate-100 shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Shield className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Admin Profile</h3>
                  <p className="text-foreground/70 text-sm">Your account details</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-foreground/70 text-sm">Name</span>
                  <span className="text-foreground font-medium">{data.superadmin.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-slate-800/50">
                  <span className="text-foreground/70 text-sm">Email</span>
                  <span className="text-foreground font-medium">{data.superadmin.email}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-slate-800/50">
                  <span className="text-foreground/70 text-sm">Role</span>
                  <Badge className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    {data.superadmin.role}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="teacher-dashboard-panel rounded-xl border border-slate-200 bg-slate-100 shadow-md p-6">
          <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Manage Schools', icon: School, color: 'from-blue-500 to-cyan-500' },
              { label: 'User Management', icon: Users, color: 'from-purple-500 to-pink-500' },
              { label: 'System Analytics', icon: PieChart, color: 'from-green-500 to-emerald-500' },
              { label: 'Platform Settings', icon: Database, color: 'from-orange-500 to-red-500' }
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto p-4 bg-muted/30 border-border hover:bg-muted/60 text-left justify-start group"
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} bg-opacity-20 mr-3`}>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-foreground group-hover:text-primary transition-colors">
                    {action.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalSuperAdminDashboard;