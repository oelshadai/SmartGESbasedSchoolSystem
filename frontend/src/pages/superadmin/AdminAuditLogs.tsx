import { useState, useEffect } from 'react';
import { Shield, Eye, AlertTriangle, Activity, FileText, Search, RefreshCw, Loader2, CheckCircle, XCircle, Clock, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import secureApiClient from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';

interface AuditOverview {
  total_audit_logs: number; logs_today: number; logs_this_week: number;
  open_security_events: number; critical_security_events: number;
  failed_logins_week: number; blocked_attempts_week: number; high_risk_activities: number;
}

const riskStyle = (level: string) => {
  if (level === 'LOW') return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (level === 'MEDIUM') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  if (level === 'HIGH') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
};

export default function AdminAuditLogs() {
  const { toast } = useToast();
  const [overview, setOverview] = useState<AuditOverview | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({ action_type: '', risk_level: '', date_from: '', date_to: '', search: '' });

  useEffect(() => { fetchDashboardData(); }, []);
  useEffect(() => {
    if (activeTab === 'audit-logs') fetchAuditLogs();
    else if (activeTab === 'security-events') fetchSecurityEvents();
    else if (activeTab === 'login-attempts') fetchLoginAttempts();
  }, [activeTab, filters]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await secureApiClient.get('/auth/superadmin/monitoring/audit-dashboard/');
      setOverview(data.overview);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const fetchAuditLogs = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const data = await secureApiClient.get(`/auth/superadmin/monitoring/audit-logs/?${params}`);
      setAuditLogs(data.audit_logs);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const fetchSecurityEvents = async () => {
    try {
      const data = await secureApiClient.get('/auth/superadmin/monitoring/security-events/');
      setSecurityEvents(data.security_events);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const fetchLoginAttempts = async () => {
    try {
      const data = await secureApiClient.get('/auth/superadmin/monitoring/login-attempts/');
      setLoginAttempts(data.login_attempts);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const handleSecurityAction = async (eventId: number, action: string) => {
    try {
      await secureApiClient.post('/auth/superadmin/monitoring/security-events/', { action, event_id: eventId });
      toast({ title: 'Success', description: `Event ${action}d` });
      fetchSecurityEvents();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center w-full py-24 gap-3 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="relative">
        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
        <div className="relative w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-red-400" />
        </div>
      </div>
      <p className="text-slate-400 text-sm">Loading audit dashboard…</p>
    </div>
  );

  const panel = "relative rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm p-5 overflow-hidden";

  return (
    <div className="flex flex-col w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-full relative">
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      <div className="hidden sm:block absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Audit & Security</h1>
            <p className="text-slate-400 text-sm mt-0.5">Comprehensive audit logging and security monitoring</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDashboardData} className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white self-start sm:self-auto">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 bg-slate-800/50 border border-slate-700/50 p-1 rounded-xl">
            {[
              { value: 'overview', label: 'Overview' },
              { value: 'audit-logs', label: 'Audit Logs' },
              { value: 'security-events', label: 'Security' },
              { value: 'login-attempts', label: 'Login' },
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}
                className="text-xs sm:text-sm py-2 rounded-lg data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 transition-all">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-5 mt-5">
            {overview && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Logs', value: overview.total_audit_logs.toLocaleString(), Icon: Database, gradient: 'from-blue-500 to-cyan-400', border: 'border-blue-500/20', bg: 'bg-blue-500/10', iconColor: 'text-blue-400' },
                    { label: 'Logs Today', value: String(overview.logs_today), Icon: Activity, gradient: 'from-green-500 to-emerald-400', border: 'border-green-500/20', bg: 'bg-green-500/10', iconColor: 'text-green-400' },
                    { label: 'Security Events', value: String(overview.open_security_events), Icon: Shield, gradient: overview.open_security_events > 0 ? 'from-red-500 to-orange-400' : 'from-green-500 to-emerald-400', border: overview.open_security_events > 0 ? 'border-red-500/20' : 'border-green-500/20', bg: overview.open_security_events > 0 ? 'bg-red-500/10' : 'bg-green-500/10', iconColor: overview.open_security_events > 0 ? 'text-red-400' : 'text-green-400' },
                    { label: 'Failed Logins', value: String(overview.failed_logins_week), Icon: XCircle, gradient: overview.failed_logins_week > 50 ? 'from-red-500 to-orange-400' : 'from-amber-500 to-yellow-400', border: overview.failed_logins_week > 50 ? 'border-red-500/20' : 'border-amber-500/20', bg: overview.failed_logins_week > 50 ? 'bg-red-500/10' : 'bg-amber-500/10', iconColor: overview.failed_logins_week > 50 ? 'text-red-400' : 'text-amber-400' },
                  ].map(card => (
                    <div key={card.label} className={`relative group rounded-2xl border ${card.border} bg-slate-900/60 backdrop-blur-sm p-4 shadow-xl hover:scale-[1.02] transition-all overflow-hidden`}>
                      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                      <div className={`absolute -top-5 -right-5 w-16 h-16 rounded-full ${card.bg} blur-2xl opacity-60`} />
                      <div className="relative">
                        <div className={`inline-flex p-2 rounded-xl ${card.bg} border ${card.border} mb-3`}>
                          <card.Icon className={`h-4 w-4 ${card.iconColor}`} />
                        </div>
                        <p className="text-2xl font-bold text-white leading-none mb-1">{card.value}</p>
                        <p className="text-xs text-slate-500">{card.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {(overview.critical_security_events > 0 || overview.high_risk_activities > 20 || overview.failed_logins_week > 50) && (
                  <div className="relative rounded-2xl border border-red-500/20 bg-red-500/5 p-4 overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-400 opacity-60" />
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-red-300 mb-2">Security Alerts</h3>
                        <div className="space-y-1 text-sm text-red-400/80">
                          {overview.critical_security_events > 0 && <p>• {overview.critical_security_events} critical security events require immediate attention</p>}
                          {overview.high_risk_activities > 20 && <p>• {overview.high_risk_activities} high-risk activities detected this week</p>}
                          {overview.failed_logins_week > 50 && <p>• {overview.failed_logins_week} failed login attempts this week (potential brute force)</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={panel}>
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-50" />
                    <h3 className="font-semibold text-white mb-4">Weekly Activity</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Audit Logs', value: overview.logs_this_week, color: 'text-blue-400' },
                        { label: 'High Risk Activities', value: overview.high_risk_activities, color: 'text-orange-400' },
                        { label: 'Blocked Attempts', value: overview.blocked_attempts_week, color: 'text-red-400' },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between items-center py-2 border-b border-slate-800/60 last:border-0">
                          <span className="text-sm text-slate-400">{row.label}</span>
                          <span className={`font-bold text-sm ${row.color}`}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={panel}>
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-400 opacity-50" />
                    <h3 className="font-semibold text-white mb-4">Security Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                        <span className="text-sm text-slate-400">Open Security Events</span>
                        <Badge className={`text-xs border ${overview.open_security_events === 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                          {overview.open_security_events === 0 ? 'All Clear' : `${overview.open_security_events} Open`}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-slate-400">Critical Events</span>
                        <Badge className={`text-xs border ${overview.critical_security_events === 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                          {overview.critical_security_events}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit-logs" className="space-y-4 mt-5">
            <div className={panel}>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input placeholder="Search logs..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
                </div>
                <Select value={filters.action_type} onValueChange={v => setFilters(f => ({ ...f, action_type: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Action Type" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="">All Actions</SelectItem>
                    {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.risk_level} onValueChange={v => setFilters(f => ({ ...f, risk_level: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Risk Level" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="">All Levels</SelectItem>
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
                <Input type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
            <div className={panel}>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-50" />
              <h3 className="font-semibold text-white mb-4">Audit Logs</h3>
              <div className="space-y-3">
                {auditLogs.map(log => (
                  <div key={log.id} className="rounded-xl border border-slate-700/40 bg-slate-800/30 p-4 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">{log.action_type}</Badge>
                          <Badge className={`text-xs border ${riskStyle(log.risk_level)}`}>{log.risk_level}</Badge>
                          {!log.success && <XCircle className="h-4 w-4 text-red-400" />}
                        </div>
                        <p className="font-medium text-white text-sm">{log.action_description}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {log.user_email}{log.school_name && ` · ${log.school_name}`} · {log.ip_address} · {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-500 flex-shrink-0">
                        <p>{log.request_method} {log.request_path}</p>
                        {log.has_changes && (
                          <Badge className="mt-1 text-xs bg-slate-700/50 text-slate-400 border-slate-600">
                            <FileText className="h-3 w-3 mr-1" />Changes
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && <div className="text-center py-8 text-slate-500">No audit logs found.</div>}
              </div>
            </div>
          </TabsContent>

          {/* Security Events Tab */}
          <TabsContent value="security-events" className="space-y-4 mt-5">
            <div className={panel}>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-400 opacity-50" />
              <h3 className="font-semibold text-white mb-4">Security Events</h3>
              <div className="space-y-3">
                {securityEvents.map(event => (
                  <div key={event.id} className="rounded-xl border border-slate-700/40 bg-slate-800/30 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={`text-xs border ${riskStyle(event.severity)}`}>{event.severity}</Badge>
                          <Badge className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">{event.event_type}</Badge>
                          <Badge className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">{event.status}</Badge>
                        </div>
                        <h4 className="font-semibold text-white text-sm">{event.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">{event.description}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          IP: {event.source_ip}{event.user_email && ` · ${event.user_email}`} · {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                      {event.status === 'OPEN' && (
                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" variant="outline" onClick={() => handleSecurityAction(event.id, 'investigate')} className="h-8 text-xs bg-slate-800/50 border-slate-700/50 text-slate-300 hover:text-white">
                            <Eye className="h-3.5 w-3.5 mr-1" /> Investigate
                          </Button>
                          <Button size="sm" onClick={() => handleSecurityAction(event.id, 'resolve')} className="h-8 text-xs bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {securityEvents.length === 0 && <div className="text-center py-8 text-slate-500">No security events found.</div>}
              </div>
            </div>
          </TabsContent>

          {/* Login Attempts Tab */}
          <TabsContent value="login-attempts" className="space-y-4 mt-5">
            <div className={panel}>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-violet-400 opacity-50" />
              <h3 className="font-semibold text-white mb-4">Recent Login Attempts</h3>
              <div className="space-y-2">
                {loginAttempts.map(attempt => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-700/40 bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {attempt.success
                        ? <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                        : <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />}
                      <div>
                        <div className="font-medium text-white text-sm">{attempt.email}</div>
                        <div className="text-xs text-slate-500">
                          {attempt.ip_address}{attempt.country && ` · ${attempt.country}`}{attempt.city && `, ${attempt.city}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">{new Date(attempt.created_at).toLocaleString()}</div>
                      <div className="flex gap-1 mt-1 justify-end">
                        {attempt.blocked && <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/30">Blocked</Badge>}
                        {attempt.risk_score > 70 && <Badge className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">High Risk</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
                {loginAttempts.length === 0 && <div className="text-center py-8 text-slate-500">No login attempts found.</div>}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
