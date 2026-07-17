import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, XCircle, Clock, Server, Database, HardDrive, Cpu, MemoryStick, RefreshCw, Loader2, Bell, Eye, EyeOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import secureApiClient from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';

interface SystemHealth { overall_status: string; database_status: string; api_status: string; storage_status: string; uptime_percentage: number; avg_response_time: number; error_rate: number; active_users: number; last_updated: string; }
interface SystemMetrics { cpu_usage: number; memory_usage: number; disk_usage: number; active_users: number; timestamp: string; }
interface Alert { id: number; type: string; severity: string; title: string; status: string; created_at: string; }

const statusBadge = (status: string) => {
  if (status === 'HEALTHY') return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (status === 'WARNING') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  if (status === 'CRITICAL') return 'bg-red-500/20 text-red-400 border-red-500/30';
  return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
};

const statusIcon = (status: string) => {
  if (status === 'HEALTHY') return <CheckCircle className="h-4 w-4" />;
  if (status === 'WARNING') return <AlertTriangle className="h-4 w-4" />;
  return <XCircle className="h-4 w-4" />;
};

const severityBadge = (s: string) => {
  if (s === 'LOW') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (s === 'MEDIUM') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  if (s === 'HIGH') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
};

const metricBarColor = (v: number) => v > 80 ? 'bg-red-500' : v > 60 ? 'bg-amber-500' : 'bg-green-500';

export default function AdminSystemHealth() {
  const { toast } = useToast();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchHealthData();
    const interval = autoRefresh ? setInterval(fetchHealthData, 30000) : null;
    return () => { if (interval) clearInterval(interval); };
  }, [autoRefresh]);

  const fetchHealthData = async () => {
    if (!loading) setRefreshing(true);
    try {
      const data = await secureApiClient.get('/auth/superadmin/monitoring/health/');
      setHealth(data.system_health);
      setMetrics(data.current_metrics);
      setAlerts(data.recent_alerts || []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); setRefreshing(false); }
  };

  const triggerHealthCheck = async () => {
    setRefreshing(true);
    try {
      const response = await secureApiClient.post('/auth/superadmin/monitoring/health-check/');
      toast({ title: 'Success', description: response.message });
      fetchHealthData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setRefreshing(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center w-full py-24 gap-3 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="relative">
        <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl" />
        <div className="relative w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-cyan-400" />
        </div>
      </div>
      <p className="text-slate-400 text-sm">Loading system health…</p>
    </div>
  );

  if (!health || !metrics) return null;

  const overallGradient = health.overall_status === 'HEALTHY' ? 'from-green-500 to-emerald-400' : health.overall_status === 'WARNING' ? 'from-amber-500 to-yellow-400' : 'from-red-500 to-orange-400';

  return (
    <div className="flex flex-col w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-full relative">
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      <div className="hidden sm:block absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">System Health</h1>
            <p className="text-slate-400 text-sm mt-0.5">Real-time monitoring and performance metrics</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline" size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`bg-slate-800/50 border-slate-700/50 text-slate-300 hover:text-white ${autoRefresh ? 'border-green-500/40 text-green-400' : ''}`}
            >
              {autoRefresh ? <Eye className="h-4 w-4 sm:mr-2" /> : <EyeOff className="h-4 w-4 sm:mr-2" />}
              <span className="hidden sm:inline">Auto Refresh</span>
            </Button>
            <Button variant="outline" size="sm" onClick={fetchHealthData} disabled={refreshing} className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:text-white">
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button size="sm" onClick={triggerHealthCheck} disabled={refreshing} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white">
              <Zap className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Health Check</span>
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <div className="relative rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm p-5 overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${overallGradient} opacity-80`} />
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/20">
                <Activity className="h-5 w-5 text-cyan-400" />
              </div>
              <h2 className="font-semibold text-white">System Status</h2>
            </div>
            <Badge className={`border ${statusBadge(health.overall_status)} flex items-center gap-1`}>
              {statusIcon(health.overall_status)}
              <span>{health.overall_status}</span>
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Uptime', value: `${health.uptime_percentage.toFixed(1)}%` },
              { label: 'Avg Response', value: `${health.avg_response_time.toFixed(0)}ms` },
              { label: 'Error Rate', value: `${health.error_rate.toFixed(1)}%` },
              { label: 'Active Users', value: String(health.active_users) },
            ].map(stat => (
              <div key={stat.label} className="text-center p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Component Health */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Database', status: health.database_status, Icon: Database, iconColor: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', sub: `Last: ${new Date(health.last_updated).toLocaleTimeString()}` },
            { label: 'API Services', status: health.api_status, Icon: Server, iconColor: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', sub: `${health.avg_response_time.toFixed(0)}ms avg` },
            { label: 'Storage', status: health.storage_status, Icon: HardDrive, iconColor: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', sub: `${metrics.disk_usage.toFixed(1)}% used` },
          ].map(comp => (
            <div key={comp.label} className="relative rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm p-4 overflow-hidden">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${comp.bg} border ${comp.border}`}>
                  <comp.Icon className={`h-4 w-4 ${comp.iconColor}`} />
                </div>
                <span className="font-medium text-white text-sm">{comp.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge className={`border text-xs ${statusBadge(comp.status)} flex items-center gap-1`}>
                  {statusIcon(comp.status)}<span>{comp.status}</span>
                </Badge>
                <span className="text-xs text-slate-500">{comp.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Real-time Metrics */}
        <div className="relative rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm p-5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-400 opacity-50" />
          <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" /> Real-time Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'CPU Usage', value: metrics.cpu_usage, Icon: Cpu, iconColor: 'text-blue-400' },
              { label: 'Memory Usage', value: metrics.memory_usage, Icon: MemoryStick, iconColor: 'text-purple-400' },
              { label: 'Disk Usage', value: metrics.disk_usage, Icon: HardDrive, iconColor: 'text-cyan-400' },
            ].map(m => (
              <div key={m.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <m.Icon className={`h-4 w-4 ${m.iconColor}`} />
                    <span className="text-sm font-medium text-slate-300">{m.label}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{m.value.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 border border-slate-700/50 overflow-hidden">
                  <div className={`h-full rounded-full ${metricBarColor(m.value)} transition-all duration-500`} style={{ width: `${m.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="relative rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm p-5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-400 opacity-50" />
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" /> Recent Alerts
              <Badge className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">{alerts.length}</Badge>
            </h2>
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                  <div className={`p-1.5 rounded-lg border ${severityBadge(alert.severity)}`}>
                    {alert.severity === 'CRITICAL' ? <XCircle className="h-3 w-3" /> : alert.severity === 'HIGH' ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm text-white">{alert.title}</span>
                      <Badge className={`text-xs border ${severityBadge(alert.severity)}`}>{alert.severity}</Badge>
                    </div>
                    <div className="text-xs text-slate-500">{alert.type} · {new Date(alert.created_at).toLocaleString()}</div>
                  </div>
                  <Badge className="text-xs bg-slate-700/50 text-slate-400 border-slate-600">{alert.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-xs text-slate-600">
          Last updated: {new Date(health.last_updated).toLocaleString()}
          {autoRefresh && <span className="ml-2">· Auto-refreshing every 30s</span>}
        </div>
      </div>
    </div>
  );
}
