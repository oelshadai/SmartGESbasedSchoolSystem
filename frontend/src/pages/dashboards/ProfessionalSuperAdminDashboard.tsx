import { useState, useEffect } from 'react';
import { 
  School, Users, GraduationCap, DollarSign, Loader2, 
  TrendingUp, Activity, Shield, Database, Globe,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-xl opacity-50" />
            <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-cyan-400" />
              <p className="text-slate-300 text-lg">Loading dashboard...</p>
              <p className="text-slate-500 text-sm mt-2">Fetching system analytics</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
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
      change: '+12%',
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
      change: '+8%',
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
      change: '+15%',
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
      change: '+5%',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Super Admin Dashboard
            </h1>
            <p className="text-slate-400 text-lg">
              Platform overview and management · {data.superadmin.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-800/50 px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-slate-300">System Online</span>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
              <Activity className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`relative group rounded-2xl border ${stat.border} bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl ${stat.glow} hover:scale-[1.02] transition-all duration-300 overflow-hidden`}>
                {/* Top accent line */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient} opacity-70 group-hover:opacity-100 transition-opacity`} />
                {/* Background glow bubble */}
                <div className={`absolute -top-8 -right-8 w-24 h-24 ${stat.bg} rounded-full blur-2xl opacity-70 group-hover:opacity-100 transition-opacity`} />

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2.5 rounded-xl ${stat.bg} border ${stat.border}`}>
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                      <TrendingUp className="h-3 w-3" />
                      {stat.change}
                    </div>
                  </div>
                  <p className={`text-4xl font-bold bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent mb-1 leading-none`}>
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Schools Overview */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <School className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Schools Overview</h3>
                    <p className="text-slate-400 text-sm">Manage and monitor all schools</p>
                  </div>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {data.recent_schools.length} schools
                </Badge>
              </div>

              <div className="space-y-4">
                {data.recent_schools.length > 0 ? (
                  data.recent_schools.map((school) => (
                    <div key={school.id} className="group bg-slate-800/30 rounded-xl p-4 hover:bg-slate-800/50 transition-all duration-200 border border-slate-700/30 hover:border-slate-600/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                            <School className="h-6 w-6 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                              {school.name}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                              <span>{school.enrollment_count} students</span>
                              <span>•</span>
                              <span>{school.teacher_count} teachers</span>
                              <span>•</span>
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
                          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <School className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No schools found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* System Statistics */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">System Stats</h3>
                  <p className="text-slate-400 text-sm">Platform metrics</p>
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
                    <div key={item.label} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-800/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${item.bg}`}>
                          <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                        </div>
                        <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">{item.label}</span>
                      </div>
                      <span className="font-bold text-white text-sm">{item.value.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Admin Profile */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Shield className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Admin Profile</h3>
                  <p className="text-slate-400 text-sm">Your account details</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400 text-sm">Name</span>
                  <span className="text-white font-medium">{data.superadmin.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-slate-800/50">
                  <span className="text-slate-400 text-sm">Email</span>
                  <span className="text-white font-medium">{data.superadmin.email}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-slate-800/50">
                  <span className="text-slate-400 text-sm">Role</span>
                  <Badge className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    {data.superadmin.role}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
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
                  className="h-auto p-4 bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600/50 text-left justify-start group"
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} bg-opacity-20 mr-3`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-slate-300 group-hover:text-white transition-colors">
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