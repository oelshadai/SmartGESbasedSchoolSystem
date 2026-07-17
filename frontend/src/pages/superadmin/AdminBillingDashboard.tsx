import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, AlertTriangle, TrendingUp, TrendingDown, RefreshCw, Play, Users, Clock, XCircle, CheckCircle, FileText, Loader2, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import secureApiClient from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';

interface BillingMetrics {
  revenue: { total: number; this_month: number; last_month: number; growth_rate: number };
  billing: { active_cycles: number; due_today: number; overdue_invoices: number; recent_failures: number; suspended_schools: number };
  alerts: { high_failure_rate: boolean; many_overdue: boolean; processing_needed: boolean };
}

export default function AdminBillingDashboard() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { fetchMetrics(); }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      setMetrics(await secureApiClient.get('/auth/superadmin/billing/dashboard/'));
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleAction = async (action: string) => {
    setProcessing(action);
    try {
      const response = await secureApiClient.post('/auth/superadmin/billing/dashboard/', { action });
      toast({ title: 'Success', description: response.message });
      if (response.results) {
        toast({ title: 'Results', description: `Processed: ${response.results.processed || 0}, Failed: ${response.results.failed || 0}` });
      }
      fetchMetrics();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setProcessing(null); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center w-full py-24 gap-3 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="relative">
        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
        <div className="relative w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-green-400" />
        </div>
      </div>
      <p className="text-slate-400 text-sm">Loading billing dashboard…</p>
    </div>
  );

  if (!metrics) return null;

  const fmt = (n: number) => `GH₵${n.toLocaleString()}`;
  const fmtPct = (r: number) => `${r > 0 ? '+' : ''}${r.toFixed(1)}%`;

  const revenueCards = [
    { label: 'Total Revenue', value: fmt(metrics.revenue.total), gradient: 'from-green-500 to-emerald-400', border: 'border-green-500/20', bg: 'bg-green-500/10', Icon: DollarSign, iconColor: 'text-green-400', extra: null },
    { label: 'This Month', value: fmt(metrics.revenue.this_month), gradient: 'from-blue-500 to-cyan-400', border: 'border-blue-500/20', bg: 'bg-blue-500/10', Icon: TrendingUp, iconColor: 'text-blue-400',
      extra: <span className={`flex items-center gap-0.5 text-xs font-semibold ${metrics.revenue.growth_rate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {metrics.revenue.growth_rate >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}{fmtPct(metrics.revenue.growth_rate)}
      </span> },
    { label: 'Active Cycles', value: String(metrics.billing.active_cycles), gradient: 'from-purple-500 to-violet-400', border: 'border-purple-500/20', bg: 'bg-purple-500/10', Icon: CreditCard, iconColor: 'text-purple-400', extra: null },
    { label: 'Suspended Schools', value: String(metrics.billing.suspended_schools), gradient: metrics.billing.suspended_schools > 0 ? 'from-red-500 to-orange-400' : 'from-slate-600 to-slate-500', border: metrics.billing.suspended_schools > 0 ? 'border-red-500/20' : 'border-slate-700/30', bg: metrics.billing.suspended_schools > 0 ? 'bg-red-500/10' : 'bg-slate-700/20', Icon: Users, iconColor: metrics.billing.suspended_schools > 0 ? 'text-red-400' : 'text-slate-500', extra: null },
  ];

  const quickActions = [
    { key: 'process_billing', label: 'Process Billing', sub: `${metrics.billing.due_today} cycles due today`, Icon: Calendar, urgent: metrics.billing.due_today > 0, urgentClass: 'from-blue-600 to-cyan-600' },
    { key: 'retry_failures', label: 'Retry Failures', sub: `${metrics.billing.recent_failures} failed payments`, Icon: RefreshCw, urgent: metrics.billing.recent_failures > 0, urgentClass: 'from-red-600 to-orange-600' },
    { key: 'process_dunning', label: 'Process Dunning', sub: `${metrics.billing.overdue_invoices} overdue invoices`, Icon: Clock, urgent: metrics.billing.overdue_invoices > 0, urgentClass: 'from-amber-600 to-yellow-600' },
  ];

  return (
    <div className="flex flex-col w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-full relative">
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      <div className="hidden sm:block absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Billing Management</h1>
            <p className="text-slate-400 text-sm mt-0.5">Automated billing, payments, and revenue tracking</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={loading} className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white self-start sm:self-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* Alerts */}
        {(metrics.alerts.high_failure_rate || metrics.alerts.many_overdue || metrics.alerts.processing_needed) && (
          <div className="relative rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm p-4 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 opacity-60" />
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-300 mb-2">Attention Required</h3>
                <div className="space-y-1 text-sm text-amber-400/80">
                  {metrics.alerts.processing_needed && <p>• {metrics.billing.due_today} billing cycles are due for processing today</p>}
                  {metrics.alerts.high_failure_rate && <p>• High payment failure rate ({metrics.billing.recent_failures} recent failures)</p>}
                  {metrics.alerts.many_overdue && <p>• {metrics.billing.overdue_invoices} invoices are overdue</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {revenueCards.map(card => (
            <div key={card.label} className={`relative group rounded-2xl border ${card.border} bg-slate-900/60 backdrop-blur-sm p-5 shadow-xl hover:scale-[1.02] transition-all duration-200 overflow-hidden`}>
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
              <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${card.bg} blur-2xl opacity-60`} />
              <div className="relative">
                <div className={`inline-flex p-2 rounded-xl ${card.bg} border ${card.border} mb-3`}>
                  <card.Icon className={`h-4 w-4 ${card.iconColor}`} />
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold text-white leading-none">{card.value}</p>
                  {card.extra}
                </div>
                <p className="text-xs text-slate-500 mt-1">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="relative rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm p-5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-50" />
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Play className="h-4 w-4 text-blue-400" /> Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map(action => (
              <button
                key={action.key}
                onClick={() => handleAction(action.key)}
                disabled={processing === action.key}
                className={`group relative rounded-xl border p-4 flex flex-col items-center gap-2 transition-all duration-200 overflow-hidden ${
                  action.urgent
                    ? `border-transparent bg-gradient-to-br ${action.urgentClass} hover:opacity-90`
                    : 'border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/70 hover:border-slate-600/50'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {processing === action.key
                  ? <Loader2 className="h-6 w-6 animate-spin text-white" />
                  : <action.Icon className={`h-6 w-6 ${action.urgent ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />}
                <div className="text-center">
                  <div className={`font-semibold text-sm ${action.urgent ? 'text-white' : 'text-slate-300 group-hover:text-white'} transition-colors`}>{action.label}</div>
                  <div className={`text-xs mt-0.5 ${action.urgent ? 'text-white/70' : 'text-slate-500'}`}>{action.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Invoice Status */}
          <div className="relative rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm p-5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-400 opacity-50" />
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-green-400" /> Invoice Status</h3>
            <div className="space-y-3">
              {[
                { icon: CheckCircle, color: 'text-green-400', label: 'Paid Invoices', value: 'Active', badgeClass: 'bg-green-500/20 text-green-400 border-green-500/30' },
                { icon: Clock, color: 'text-amber-400', label: 'Overdue Invoices', value: String(metrics.billing.overdue_invoices), badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
                { icon: XCircle, color: 'text-red-400', label: 'Payment Failures', value: String(metrics.billing.recent_failures), badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <row.icon className={`h-4 w-4 ${row.color}`} />
                    <span className="text-sm text-slate-300">{row.label}</span>
                  </div>
                  <Badge className={`text-xs border ${row.badgeClass}`}>{row.value}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Performance */}
          <div className="relative rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm p-5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-violet-400 opacity-50" />
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-purple-400" /> Performance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Revenue Growth</span>
                <div className={`flex items-center gap-1 text-sm font-semibold ${metrics.revenue.growth_rate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {metrics.revenue.growth_rate >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {fmtPct(metrics.revenue.growth_rate)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Collection Rate</span>
                <Badge className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {((metrics.billing.active_cycles - metrics.billing.overdue_invoices) / Math.max(metrics.billing.active_cycles, 1) * 100).toFixed(1)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">System Health</span>
                <Badge className={`text-xs border ${metrics.alerts.high_failure_rate || metrics.alerts.many_overdue ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                  {metrics.alerts.high_failure_rate || metrics.alerts.many_overdue ? 'Needs Attention' : 'Healthy'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
