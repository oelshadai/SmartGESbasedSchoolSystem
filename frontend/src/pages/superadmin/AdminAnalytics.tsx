import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, School, Users, GraduationCap, CreditCard, AlertTriangle, Loader2, DollarSign, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { secureApiClient } from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';

export default function AdminAnalytics() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    secureApiClient.get('/auth/superadmin/analytics/')
      .then(setData)
      .catch((e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <div className="text-center">
        <div className="relative mx-auto w-16 h-16 mb-4">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 border border-slate-700">
            <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
          </div>
        </div>
        <p className="text-slate-400 text-sm">Loading analytics…</p>
      </div>
    </div>
  );
  if (!data) return null;

  const { overview, schools_by_month, revenue_by_month, subscriptions_by_plan, expiring_soon } = data;

  const overviewCards = [
    {
      label: 'Total Schools',
      value: overview.total_schools,
      icon: School,
      gradient: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/20',
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      suffix: '',
    },
    {
      label: 'Active Schools',
      value: overview.active_schools,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-green-400',
      glow: 'shadow-emerald-500/20',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      suffix: '',
    },
    {
      label: 'Total Students',
      value: overview.total_students,
      icon: GraduationCap,
      gradient: 'from-purple-500 to-violet-500',
      glow: 'shadow-purple-500/20',
      border: 'border-purple-500/20',
      bg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      suffix: '',
    },
    {
      label: 'Total Teachers',
      value: overview.total_teachers,
      icon: Users,
      gradient: 'from-orange-500 to-amber-400',
      glow: 'shadow-orange-500/20',
      border: 'border-orange-500/20',
      bg: 'bg-orange-500/10',
      iconColor: 'text-orange-400',
      suffix: '',
    },
    {
      label: 'Total Users',
      value: overview.total_users,
      icon: Activity,
      gradient: 'from-cyan-500 to-sky-400',
      glow: 'shadow-cyan-500/20',
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-400',
      suffix: '',
    },
    {
      label: 'Active Subs',
      value: overview.active_subscriptions,
      icon: CreditCard,
      gradient: 'from-green-500 to-teal-400',
      glow: 'shadow-green-500/20',
      border: 'border-green-500/20',
      bg: 'bg-green-500/10',
      iconColor: 'text-green-400',
      suffix: '',
    },
    {
      label: 'Expired Subs',
      value: overview.expired_subscriptions,
      icon: XCircle,
      gradient: 'from-red-500 to-rose-500',
      glow: 'shadow-red-500/20',
      border: 'border-red-500/20',
      bg: 'bg-red-500/10',
      iconColor: 'text-red-400',
      suffix: '',
    },
    {
      label: 'Total Revenue',
      value: `GH₵${Number(overview.total_revenue).toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-yellow-500 to-amber-400',
      glow: 'shadow-yellow-500/20',
      border: 'border-yellow-500/20',
      bg: 'bg-yellow-500/10',
      iconColor: 'text-yellow-400',
      suffix: '',
    },
  ];

  const planColors = [
    'from-blue-500 to-cyan-400',
    'from-purple-500 to-violet-400',
    'from-emerald-500 to-green-400',
    'from-orange-500 to-amber-400',
    'from-pink-500 to-rose-400',
  ];

  const GradientBar = ({
    items, valueKey, labelKey, gradientFrom, gradientTo,
  }: { items: any[]; valueKey: string; labelKey: string; gradientFrom: string; gradientTo: string }) => {
    if (!items?.length) return <p className="text-slate-500 text-sm py-4 text-center">No data available.</p>;
    const trimmed = items.slice(-10);
    const max = Math.max(...trimmed.map(i => Number(i[valueKey])), 1);
    return (
      <div className="flex items-end gap-1.5 h-36 pt-2">
        {trimmed.map((item, i) => {
          const pct = Math.max((Number(item[valueKey]) / max) * 100, 3);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0 group">
              <span className="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors leading-none">
                {item[valueKey] > 0 ? item[valueKey] : ''}
              </span>
              <div className="w-full relative rounded-t-md overflow-hidden" style={{ height: `${pct}%` }}>
                <div
                  className="absolute inset-0 rounded-t-md opacity-80 group-hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})` }}
                />
                <div className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: gradientTo }} />
              </div>
              <span className="text-[9px] text-slate-600 group-hover:text-slate-400 transition-colors truncate w-full text-center leading-none">
                {String(item[labelKey]).slice(5)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-slate-400 mt-0.5">Platform-wide usage and revenue metrics</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Live data</span>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {overviewCards.map(({ label, value, icon: Icon, gradient, glow, border, bg, iconColor }) => (
          <div
            key={label}
            className={`relative group rounded-2xl border ${border} bg-slate-900/60 backdrop-blur-sm p-4 shadow-xl ${glow} hover:scale-[1.02] transition-all duration-200 overflow-hidden`}
          >
            {/* Top gradient bar */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
            {/* Background glow */}
            <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${bg} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />

            <div className="relative">
              <div className={`inline-flex p-2 rounded-xl ${bg} border ${border} mb-3`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
              <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
              <p className="text-xs text-slate-400 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative rounded-2xl border border-blue-500/15 bg-slate-900/60 backdrop-blur-sm p-5 shadow-xl shadow-blue-500/5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-50" />
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-blue-500/15 border border-blue-500/20">
                <TrendingUp className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white text-sm">New Schools / Month</h2>
                <p className="text-[11px] text-slate-500">Registration trend</p>
              </div>
            </div>
            <GradientBar items={schools_by_month} valueKey="count" labelKey="month" gradientFrom="#3b82f6" gradientTo="#67e8f9" />
          </div>
        </div>

        <div className="relative rounded-2xl border border-emerald-500/15 bg-slate-900/60 backdrop-blur-sm p-5 shadow-xl shadow-emerald-500/5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-green-400 opacity-50" />
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20">
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white text-sm">Revenue / Month</h2>
                <p className="text-[11px] text-slate-500">GH₵ earned per month</p>
              </div>
            </div>
            <GradientBar items={revenue_by_month} valueKey="total" labelKey="month" gradientFrom="#10b981" gradientTo="#6ee7b7" />
          </div>
        </div>
      </div>

      {/* Subscriptions by plan */}
      <div className="relative rounded-2xl border border-purple-500/15 bg-slate-900/60 backdrop-blur-sm p-5 shadow-xl shadow-purple-500/5 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-violet-400 opacity-50" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 rounded-lg bg-purple-500/15 border border-purple-500/20">
              <CreditCard className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Active Subscriptions by Plan</h2>
              <p className="text-[11px] text-slate-500">Distribution across subscription tiers</p>
            </div>
          </div>
          {subscriptions_by_plan?.length ? (
            <div className="space-y-3">
              {subscriptions_by_plan.map((item: any, idx: number) => {
                const max = Math.max(...subscriptions_by_plan.map((x: any) => x.count), 1);
                const pct = (item.count / max) * 100;
                const color = planColors[idx % planColors.length];
                return (
                  <div key={item.plan} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-slate-300 font-medium">{item.plan}</span>
                      <span className="text-sm font-bold text-white">{item.count}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-800 border border-slate-700/50 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 group-hover:opacity-90`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm py-4 text-center">No active subscriptions.</p>
          )}
        </div>
      </div>

      {/* Expiring soon */}
      {expiring_soon?.length > 0 && (
        <div className="relative rounded-2xl border border-yellow-500/20 bg-slate-900/60 backdrop-blur-sm p-5 shadow-xl shadow-yellow-500/5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-amber-400 opacity-60" />
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 rounded-lg bg-yellow-500/15 border border-yellow-500/20">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white text-sm">Expiring Within 30 Days</h2>
                <p className="text-[11px] text-slate-500">{expiring_soon.length} subscription{expiring_soon.length !== 1 ? 's' : ''} need attention</p>
              </div>
            </div>
            <div className="space-y-2">
              {expiring_soon.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-800/50 border border-slate-700/40 hover:border-yellow-500/20 transition-colors">
                  <div>
                    <span className="font-medium text-white text-sm">{s.school}</span>
                    <span className="text-slate-500 text-xs ml-2">{s.plan}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-xs">{s.end_date}</span>
                    <Badge className={
                      s.days_remaining <= 7
                        ? 'bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-semibold'
                        : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 text-xs font-semibold'
                    }>
                      {s.days_remaining}d left
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
