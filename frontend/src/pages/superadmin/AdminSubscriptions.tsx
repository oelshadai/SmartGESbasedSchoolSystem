import { useState, useEffect } from 'react';
import { CreditCard, Plus, Loader2, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { secureApiClient } from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';

const statusColor = (s: string) => {
  if (s === 'ACTIVE') return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (s === 'EXPIRED') return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (s === 'SUSPENDED') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
};

export default function AdminSubscriptions() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Create subscription dialog
  const [showCreate, setShowCreate] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [form, setForm] = useState({ school_id: '', plan_id: '', start_date: new Date().toISOString().split('T')[0] });
  const [creating, setCreating] = useState(false);

  // Plan management dialog
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState({ name: '', plan_type: 'TERM', price: '', duration_days: '90', max_students: '', max_teachers: '' });
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => { fetchData(); }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/auth/superadmin/subscriptions/?status=${statusFilter}` : '/auth/superadmin/subscriptions/';
      const res = await secureApiClient.get(url);
      setData(res);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    const res = await secureApiClient.get('/auth/superadmin/schools/');
    setSchools(res.schools || []);
  };

  const handleExtend = async (subId: number, days: number) => {
    try {
      await secureApiClient.post(`/auth/superadmin/subscriptions/${subId}/extend/`, { days });
      toast({ title: 'Extended', description: `+${days} days` });
      fetchData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleStatusChange = async (subId: number, status: string) => {
    try {
      await secureApiClient.patch(`/auth/superadmin/subscriptions/${subId}/`, { status });
      toast({ title: 'Updated' });
      fetchData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      await secureApiClient.post('/auth/superadmin/subscriptions/create/', {
        school_id: Number(form.school_id),
        plan_id: Number(form.plan_id),
        start_date: form.start_date,
      });
      toast({ title: 'Created', description: 'Subscription created' });
      setShowCreate(false);
      fetchData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleSavePlan = async () => {
    setSavingPlan(true);
    try {
      if (editPlan) {
        await secureApiClient.patch(`/auth/superadmin/plans/${editPlan.id}/`, planForm);
        toast({ title: 'Plan updated' });
      } else {
        await secureApiClient.post('/auth/superadmin/plans/', planForm);
        toast({ title: 'Plan created' });
      }
      setShowPlanDialog(false);
      fetchData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSavingPlan(false);
    }
  };

  const openNewPlan = () => {
    setEditPlan(null);
    setPlanForm({ name: '', plan_type: 'TERM', price: '', duration_days: '90', max_students: '', max_teachers: '' });
    setShowPlanDialog(true);
  };

  const openEditPlan = (plan: any) => {
    setEditPlan(plan);
    setPlanForm({
      name: plan.name,
      plan_type: plan.plan_type,
      price: String(plan.price),
      duration_days: String(plan.duration_days),
      max_students: plan.max_students ? String(plan.max_students) : '',
      max_teachers: plan.max_teachers ? String(plan.max_teachers) : '',
    });
    setShowPlanDialog(true);
  };

  const filtered = (data?.subscriptions || []).filter((s: any) =>
    s.school_name.toLowerCase().includes(search.toLowerCase()) ||
    s.plan_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">
            {data?.active_count ?? '—'} active · {data?.expired_count ?? '—'} expired
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openNewPlan}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New Plan
          </Button>
          <Button size="sm" onClick={() => { setShowCreate(true); fetchSchools(); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Assign Subscription
          </Button>
        </div>
      </div>

      {/* Revenue stats */}
      {data?.revenue && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-2xl font-bold">GH₵{data.revenue.total.toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">This Month</p>
            <p className="text-2xl font-bold">GH₵{data.revenue.this_month.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Plans */}
      {data?.plans && data.plans.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-3">Subscription Plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.plans.map((plan: any) => (
              <div key={plan.id} className="border border-border rounded-lg p-3 hover:border-primary/40 transition-colors cursor-pointer" onClick={() => openEditPlan(plan)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{plan.name}</span>
                  <Badge className="text-xs bg-primary/20 text-primary">{plan.plan_type}</Badge>
                </div>
                <p className="text-lg font-bold">GH₵{plan.price}</p>
                <p className="text-xs text-muted-foreground">{plan.duration_days} days · {plan.max_students ? `Up to ${plan.max_students} students` : 'Unlimited students'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter + search */}
      <div className="flex gap-3 flex-wrap">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search school or plan..." className="max-w-xs" />
        {['', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'].map(s => (
          <Button key={s || 'all'} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => setStatusFilter(s)}>
            {s || 'All'}
          </Button>
        ))}
      </div>

      {/* Subscriptions list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((sub: any) => (
            <div key={sub.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-semibold">{sub.school_name}</p>
                  <p className="text-sm text-muted-foreground">{sub.plan_name} — GH₵{sub.price}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sub.start_date} → {sub.end_date}
                    {sub.status === 'ACTIVE' && ` · ${sub.days_remaining} days left`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-xs border ${statusColor(sub.status)}`}>{sub.status}</Badge>
                  {sub.status === 'ACTIVE' && (
                    <>
                      <Button size="sm" variant="outline" className="h-7" onClick={() => handleExtend(sub.id, 30)}>+30d</Button>
                      <Button size="sm" variant="outline" className="h-7" onClick={() => handleExtend(sub.id, 90)}>+90d</Button>
                      <Button size="sm" variant="outline" className="h-7 text-red-500" onClick={() => handleStatusChange(sub.id, 'SUSPENDED')}>Suspend</Button>
                    </>
                  )}
                  {(sub.status === 'EXPIRED' || sub.status === 'SUSPENDED' || sub.status === 'CANCELLED') && (
                    <Button size="sm" variant="outline" className="h-7 text-green-500" onClick={() => handleStatusChange(sub.id, 'ACTIVE')}>Reactivate</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No subscriptions found.</p>}
        </div>
      )}

      {/* Assign Subscription Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Subscription</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium block mb-1">School</label>
              <Select value={form.school_id} onValueChange={v => setForm(f => ({ ...f, school_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
                <SelectContent>
                  {schools.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Plan</label>
              <Select value={form.plan_id} onValueChange={v => setForm(f => ({ ...f, plan_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>
                  {(data?.plans || []).map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name} — GH₵{p.price}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Start Date</label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !form.school_id || !form.plan_id}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editPlan ? 'Edit Plan' : 'New Plan'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium block mb-1">Name</label>
              <Input value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Basic" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">Type</label>
                <Select value={planForm.plan_type} onValueChange={v => setPlanForm(f => ({ ...f, plan_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TERM">Per Term</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                    <SelectItem value="PER_STUDENT">Per Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Price (GH₵)</label>
                <Input type="number" value={planForm.price} onChange={e => setPlanForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Duration (days)</label>
                <Input type="number" value={planForm.duration_days} onChange={e => setPlanForm(f => ({ ...f, duration_days: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Max Students</label>
                <Input type="number" value={planForm.max_students} onChange={e => setPlanForm(f => ({ ...f, max_students: e.target.value }))} placeholder="Leave blank for unlimited" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>Cancel</Button>
            <Button onClick={handleSavePlan} disabled={savingPlan || !planForm.name || !planForm.price}>
              {savingPlan ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
