import { useState, useEffect } from 'react';
import { TrendingUp, School, Users, GraduationCap, CreditCard, AlertTriangle, Loader2 } from 'lucide-react';
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

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!data) return null;

  const { overview, schools_by_month, revenue_by_month, subscriptions_by_plan, expiring_soon } = data;

  const overviewCards = [
    { label: 'Total Schools', value: overview.total_schools, icon: School, color: 'text-blue-400' },
    { label: 'Active Schools', value: overview.active_schools, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Total Students', value: overview.total_students, icon: GraduationCap, color: 'text-purple-400' },
    { label: 'Total Teachers', value: overview.total_teachers, icon: Users, color: 'text-orange-400' },
    { label: 'Total Users', value: overview.total_users, icon: Users, color: 'text-cyan-400' },
    { label: 'Active Subs', value: overview.active_subscriptions, icon: CreditCard, color: 'text-green-400' },
    { label: 'Expired Subs', value: overview.expired_subscriptions, icon: CreditCard, color: 'text-red-400' },
    { label: 'Total Revenue', value: `GH₵${overview.total_revenue.toLocaleString()}`, icon: TrendingUp, color: 'text-yellow-400' },
  ];

  // Simple bar chart renderer
  const BarChart = ({ items, valueKey, labelKey, color }: { items: any[]; valueKey: string; labelKey: string; color: string }) => {
    if (!items?.length) return <p className="text-muted-foreground text-sm">No data available.</p>;
    const max = Math.max(...items.map(i => Number(i[valueKey])), 1);
    return (
      <div className="flex items-end gap-2 h-32">
        {items.slice(-12).map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-xs text-muted-foreground">{item[valueKey]}</span>
            <div
              className={`w-full rounded-t ${color}`}
              style={{ height: `${Math.max((Number(item[valueKey]) / max) * 96, 4)}px` }}
            />
            <span className="text-[10px] text-muted-foreground truncate w-full text-center">
              {String(item[labelKey]).slice(5)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Platform-wide usage and revenue metrics</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {overviewCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <Icon className={`h-4 w-4 mb-2 ${color}`} />
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* School registrations over time */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4">New Schools / Month</h2>
          <BarChart items={schools_by_month} valueKey="count" labelKey="month" color="bg-blue-500" />
        </div>

        {/* Revenue over time */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Revenue / Month (GH₵)</h2>
          <BarChart items={revenue_by_month} valueKey="total" labelKey="month" color="bg-green-500" />
        </div>
      </div>

      {/* Subscriptions by plan */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-4">Active Subscriptions by Plan</h2>
        {subscriptions_by_plan?.length ? (
          <div className="space-y-2">
            {subscriptions_by_plan.map((item: any) => {
              const max = Math.max(...subscriptions_by_plan.map((x: any) => x.count), 1);
              const pct = (item.count / max) * 100;
              return (
                <div key={item.plan} className="flex items-center gap-3">
                  <span className="text-sm w-32 truncate">{item.plan}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No active subscriptions.</p>
        )}
      </div>

      {/* Expiring soon */}
      {expiring_soon?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Expiring Within 30 Days
          </h2>
          <div className="space-y-2">
            {expiring_soon.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                <div>
                  <span className="font-medium">{s.school}</span>
                  <span className="text-muted-foreground ml-2">{s.plan}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{s.end_date}</span>
                  <Badge className={s.days_remaining <= 7 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}>
                    {s.days_remaining}d left
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
