import { 
  BarChart3, Users, School, TrendingUp, Activity, Globe,
  Cpu, HardDrive, Zap, Server, Clock, AlertCircle,
  Trophy, Target, Gauge
} from 'lucide-react';

const metrics = [
  { 
    label: 'Total Logins (30d)', 
    value: '8,234', 
    icon: Activity, 
    color: 'from-blue-500 to-cyan-500', 
    border: 'border-blue-500/20',
    glow: 'shadow-blue-500/10',
    bg: 'bg-blue-500/20',
    gradient: 'from-blue-500 to-cyan-500',
    trend: '+12%',
    trendUp: true
  },
  { 
    label: 'Active Users', 
    value: '1,456', 
    icon: Users, 
    color: 'from-green-500 to-emerald-500',
    border: 'border-green-500/20',
    glow: 'shadow-green-500/10',
    bg: 'bg-green-500/20',
    gradient: 'from-green-500 to-emerald-500',
    trend: '+8%',
    trendUp: true
  },
  { 
    label: 'Assignments Created', 
    value: '342', 
    icon: BarChart3, 
    color: 'from-purple-500 to-pink-500',
    border: 'border-purple-500/20',
    glow: 'shadow-purple-500/10',
    bg: 'bg-purple-500/20',
    gradient: 'from-purple-500 to-pink-500',
    trend: '+23%',
    trendUp: true
  },
  { 
    label: 'Reports Generated', 
    value: '89', 
    icon: TrendingUp, 
    color: 'from-orange-500 to-red-500',
    border: 'border-orange-500/20',
    glow: 'shadow-orange-500/10',
    bg: 'bg-orange-500/20',
    gradient: 'from-orange-500 to-red-500',
    trend: '+5%',
    trendUp: true
  },
];

const topSchools = [
  { name: 'Elite Academy', score: 92, students: 245, color: 'from-yellow-500 to-orange-500' },
  { name: 'Excellence College', score: 88, students: 310, color: 'from-gray-400 to-gray-500' },
  { name: 'Bright Future School', score: 85, students: 180, color: 'from-amber-600 to-amber-700' },
  { name: 'Heritage International', score: 82, students: 198, color: 'from-blue-500 to-blue-600' },
  { name: 'Golden Star Academy', score: 78, students: 120, color: 'from-green-500 to-green-600' },
];

const usageByRole = [
  { role: 'Students', percentage: 62, count: '2,383', color: 'from-blue-500 to-cyan-500' },
  { role: 'Teachers', percentage: 25, count: '186', color: 'from-green-500 to-emerald-500' },
  { role: 'School Admins', percentage: 10, count: '24', color: 'from-purple-500 to-pink-500' },
  { role: 'Super Admins', percentage: 3, count: '3', color: 'from-orange-500 to-red-500' },
];

const SystemAnalytics = () => (
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
          <h1 className="text-4xl font-bold text-white mb-2">System Analytics</h1>
          <p className="text-slate-400 text-lg">Platform-wide analytics and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-800/50 px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-slate-300">Real-time Data</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className={`relative group rounded-2xl border ${metric.border} bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl ${metric.glow} hover:scale-[1.02] transition-all duration-300 overflow-hidden`}>
              {/* Top accent line */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${metric.gradient} opacity-70 group-hover:opacity-100 transition-opacity`} />
              {/* Background glow bubble */}
              <div className={`absolute -top-8 -right-8 w-24 h-24 ${metric.bg} rounded-full blur-2xl opacity-70 group-hover:opacity-100 transition-opacity`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${metric.bg} border ${metric.border}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    metric.trendUp ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <TrendingUp className={`h-3 w-3 ${metric.trendUp ? '' : 'rotate-180'}`} />
                    {metric.trend}
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white mb-1">{metric.value}</p>
                  <p className="text-slate-400 text-sm">{metric.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Schools */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Trophy className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Top Performing Schools</h3>
              <p className="text-slate-400 text-sm">Based on overall performance metrics</p>
            </div>
          </div>
          <div className="space-y-4">
            {topSchools.map((school, i) => (
              <div key={school.name} className="group">
                <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${school.color} flex items-center justify-center text-white font-bold text-sm`}>
                    #{i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-white group-hover:text-blue-400 transition-colors">
                        {school.name}
                      </span>
                      <div className="text-right">
                        <span className="text-white font-bold">{school.score}%</span>
                        <p className="text-xs text-slate-400">{school.students} students</p>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${school.color} rounded-full transition-all duration-500`} 
                        style={{ width: `${school.score}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Usage by Role */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Usage by Role</h3>
              <p className="text-slate-400 text-sm">User distribution across platform</p>
            </div>
          </div>
          <div className="space-y-4">
            {usageByRole.map((item) => (
              <div key={item.role} className="p-3 rounded-xl bg-slate-800/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-white">{item.role}</span>
                  <div className="text-right">
                    <span className="text-white font-bold">{item.count}</span>
                    <span className="text-slate-400 text-sm ml-1">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`} 
                    style={{ width: `${item.percentage}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Growth */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Target className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Platform Growth</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'New Schools (30d)', value: '+3', trend: '+50%' },
              { label: 'New Users (30d)', value: '+168', trend: '+12%' },
              { label: 'Retention Rate', value: '94%', trend: '+2%' }
            ].map((m) => (
              <div key={m.label} className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0">
                <span className="text-slate-300 text-sm">{m.label}</span>
                <div className="text-right">
                  <span className="font-semibold text-white">{m.value}</span>
                  <span className="text-green-400 text-xs ml-2">{m.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Server Performance */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Server className="h-5 w-5 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Server Performance</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'CPU Usage', value: '34%', icon: Cpu, status: 'good' },
              { label: 'Memory', value: '62%', icon: Zap, status: 'warning' },
              { label: 'Storage', value: '45%', icon: HardDrive, status: 'good' }
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-300 text-sm">{m.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{m.value}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      m.status === 'good' ? 'bg-green-400' : 
                      m.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                    }`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* API Statistics */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Gauge className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">API Statistics</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Total Requests (24h)', value: '45.2K', icon: Activity },
              { label: 'Avg Latency', value: '120ms', icon: Clock },
              { label: 'Error Rate', value: '0.02%', icon: AlertCircle }
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-300 text-sm">{m.label}</span>
                  </div>
                  <span className="font-semibold text-white">{m.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SystemAnalytics;
