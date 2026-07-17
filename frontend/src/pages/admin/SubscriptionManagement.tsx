import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, CreditCard } from 'lucide-react';

const mockSubscriptions = [
  { id: 1, school: 'Elite Academy', plan: 'Premium', amount: '$99/mo', startDate: '2024-09-01', endDate: '2025-09-01', status: 'active' },
  { id: 2, school: 'Bright Future School', plan: 'Basic', amount: '$49/mo', startDate: '2024-10-15', endDate: '2025-10-15', status: 'active' },
  { id: 3, school: 'Golden Star Academy', plan: 'Free Trial', amount: '$0', startDate: '2025-02-01', endDate: '2025-03-01', status: 'trial' },
  { id: 4, school: 'Excellence College', plan: 'Premium', amount: '$99/mo', startDate: '2024-06-01', endDate: '2025-06-01', status: 'active' },
  { id: 5, school: 'Pioneer School', plan: 'Basic', amount: '$49/mo', startDate: '2024-08-01', endDate: '2025-08-01', status: 'expired' },
];

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  trial: 'bg-warning/10 text-warning border-warning/20',
  expired: 'bg-destructive/10 text-destructive border-destructive/20',
};

const columns = [
  { key: 'school', label: 'School', render: (s: typeof mockSubscriptions[0]) => <span className="font-medium text-foreground">{s.school}</span> },
  { key: 'plan', label: 'Plan', render: (s: typeof mockSubscriptions[0]) => <Badge variant="outline">{s.plan}</Badge> },
  { key: 'amount', label: 'Amount', render: (s: typeof mockSubscriptions[0]) => <span className="font-medium text-foreground">{s.amount}</span> },
  { key: 'startDate', label: 'Start Date', render: (s: typeof mockSubscriptions[0]) => <span className="text-muted-foreground">{s.startDate}</span> },
  { key: 'endDate', label: 'End Date', render: (s: typeof mockSubscriptions[0]) => <span className="text-muted-foreground">{s.endDate}</span> },
  { key: 'status', label: 'Status', render: (s: typeof mockSubscriptions[0]) => <Badge variant="outline" className={statusColors[s.status]}>{s.status}</Badge> },
  { key: 'actions', label: 'Actions', render: () => (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8"><CreditCard className="h-4 w-4" /></Button>
    </div>
  )},
];

const SubscriptionManagement = () => (
  <div className="space-y-6 animate-fade-in">
    <PageHeader title="Subscription Management" description="Manage school subscriptions and billing" actionLabel="Add Plan" />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="relative group rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-lg hover:scale-[1.02] transition-all duration-200 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-60 group-hover:opacity-100 transition-opacity" />
        <div className="absolute -top-5 -right-5 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl opacity-60" />
        <div className="relative">
          <p className="text-sm text-muted-foreground">Monthly Revenue</p>
          <p className="text-2xl font-bold text-foreground mt-1">$2,450</p>
          <p className="text-xs text-muted-foreground mt-1">22 active subscriptions</p>
        </div>
      </div>
      <div className="relative group rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-lg hover:scale-[1.02] transition-all duration-200 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 opacity-60 group-hover:opacity-100 transition-opacity" />
        <div className="absolute -top-5 -right-5 w-16 h-16 bg-amber-500/10 rounded-full blur-xl opacity-60" />
        <div className="relative">
          <p className="text-sm text-muted-foreground">Trial Schools</p>
          <p className="text-2xl font-bold text-foreground mt-1">3</p>
          <p className="text-xs text-muted-foreground mt-1">Expiring soon</p>
        </div>
      </div>
      <div className="relative group rounded-2xl border border-red-500/20 bg-red-500/5 p-4 shadow-lg hover:scale-[1.02] transition-all duration-200 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-rose-400 opacity-60 group-hover:opacity-100 transition-opacity" />
        <div className="absolute -top-5 -right-5 w-16 h-16 bg-red-500/10 rounded-full blur-xl opacity-60" />
        <div className="relative">
          <p className="text-sm text-muted-foreground">Churn Rate</p>
          <p className="text-2xl font-bold text-foreground mt-1">2.1%</p>
          <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
        </div>
      </div>
    </div>
    <DataTable columns={columns} data={mockSubscriptions} searchKey="school" searchPlaceholder="Search subscriptions..." />
  </div>
);

export default SubscriptionManagement;
