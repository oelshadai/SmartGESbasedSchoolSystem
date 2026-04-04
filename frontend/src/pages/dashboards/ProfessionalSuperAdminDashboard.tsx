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
      value: data.system_stats.total_schools.toString(), 
      icon: School, 
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      change: '+12%',
      trend: 'up'
    },
    { 
      label: 'Total Teachers', 
      value: data.system_stats.total_teachers.toString(), 
      icon: Users, 
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      change: '+8%',
      trend: 'up'
    },
    { 
      label: 'Total Students', 
      value: data.system_stats.total_students.toString(), 
      icon: GraduationCap, 
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      change: '+15%',
      trend: 'up'
    },
    { 
      label: 'Total Admins', 
      value: data.system_stats.total_admins.toString(), 
      icon: Shield, 
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      change: '+5%',
      trend: 'up'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 hover:border-slate-700/50 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                      <TrendingUp className="h-3 w-3" />
                      {stat.change}
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                    <p className="text-slate-400 text-sm">{stat.label}</p>
                  </div>
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

              <div className="space-y-4">
                {[
                  { label: 'Total Assignments', value: data.system_stats.total_assignments, icon: Calendar },
                  { label: 'Schools', value: data.system_stats.total_schools, icon: School },
                  { label: 'Teachers', value: data.system_stats.total_teachers, icon: Users },
                  { label: 'Students', value: data.system_stats.total_students, icon: GraduationCap },
                  { label: 'School Admins', value: data.system_stats.total_admins, icon: Shield }
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-800/50 last:border-0">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-300">{item.label}</span>
                      </div>
                      <span className="font-semibold text-white">{item.value}</span>
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