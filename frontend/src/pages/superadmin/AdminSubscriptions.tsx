import { useState, useEffect } from 'react';
import { CreditCard, Plus, Loader2, Check, DollarSign, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import secureApiClient from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';

const statusStyle = (s: string) => {
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
  const [showCreate, setShowCreate] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [form, setForm] = useState({ school_id: '', plan_id: '', start_date: new Date().toISOString().split('T')[0] });
  const [creating, setCreating] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState({ name: '', plan_type: 'MONTHLY', price: '', duration_days: '30', max_students: '', max_teachers: '' });
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => { fetchData(); }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/auth/superadmin/subscriptions/?status=${statusFilter}` : '/auth/superadmin/subscriptions/';
      setData(await secureApiClient.get(url));
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async (subId: number, days: number) => {
    try {
      await secureApiClient.post(`/auth/superadmin/subscriptions/${subId}/extend/`, { days });
      toast({ title: 'Extended', description: `+${days} days added` });
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

  const handleDelete = async (subId: number) => {
    if (!window.confirm('Delete this subscription? Active school access will be revoked if no other active subscription exists.')) return;
    try {
      await secureApiClient.delete(`/auth/superadmin/subscriptions/${subId}/delete/`);
      toast({ title: 'Deleted', description: 'Subscription removed' });
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
      toast({ title: 'Created', description: 'Subscription assigned' });
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

  const openEditPlan = (plan: any) => {
    setEditPlan(plan);
    setPlanForm({ name: plan.name, plan_type: plan.plan_type, price: String(plan.price), duration_days: String(plan.duration_days), max_students: plan.max_students ? String(plan.max_students) : '', max_teachers: plan.max_teachers ? String(plan.max_teachers) : '' });
    setShowPlanDialog(true);
  };

  const filtered = (data?.subscriptions || []).filter((s: any) =>
    s.school_name.toLowerCase().includes(search.toLowerCase()) ||
    s.plan_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-full relative">
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      <div className="hidden sm:block absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Subscriptions</h1>
            <p className="text-slate-400 text-sm mt-0.5">{data?.active_count ?? '—'} active · {data?.expired_count ?? '—'} expired</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => { setEditPlan(null); setPlanForm({ name: '', plan_type: 'MONTHLY', price: '', duration_days: '30', max_students: '', max_teachers: '' }); setShowPlanDialog(true); }}
              className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> New Plan
            </Button>
            <Button
              size="sm"
              onClick={async () => { setShowCreate(true); const res = await secureApiClient.get('/auth/superadmin/schools/'); setSchools(res.schools || []); }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Assign Subscription
            </Button>
          </div>
        </div>

        {/* Revenue cards */}
        {data?.revenue && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Total Revenue', value: `GH₵${data.revenue.total.toLocaleString()}`, gradient: 'from-emerald-500 to-teal-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', Icon: DollarSign, iconColor: 'text-emerald-400' },
              { label: 'This Month', value: `GH₵${data.revenue.this_month.toLocaleString()}`, gradient: 'from-blue-500 to-cyan-400', border: 'border-blue-500/20', bg: 'bg-blue-500/10', Icon: CreditCard, iconColor: 'text-blue-400' },
            ].map(card => (
              <div key={card.label} className={`relative group rounded-2xl border ${card.border} bg-slate-900/60 backdrop-blur-sm p-5 shadow-xl hover:scale-[1.02] transition-all duration-200 overflow-hidden`}>
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${card.bg} blur-2xl opacity-60`} />
                <div className="relative flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${card.bg} border ${card.border}`}>
                    <card.Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">{card.label}</p>
                    <p className="text-2xl font-bold text-white">{card.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Plans */}
        {data?.plans?.length > 0 && (
          <div className="relative rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm p-5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-violet-400 opacity-50" />
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-400" /> Subscription Plans
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {data.plans.map((plan: any) => (
                <div key={plan.id} onClick={() => openEditPlan(plan)} className="border border-slate-700/50 rounded-xl p-3 hover:border-purple-500/40 hover:bg-slate-800/50 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-white">{plan.name}</span>
                    <Badge className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">{plan.plan_type}</Badge>
                  </div>
                  <p className="text-lg font-bold text-white">GH₵{plan.price}</p>
                  <p className="text-xs text-slate-500">{plan.duration_days} days · {plan.max_students ? `Up to ${plan.max_students} students` : 'Unlimited'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-3">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search school or plan..." className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50" />
          <div className="flex gap-1.5 flex-wrap">
            {['', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'].map(s => (
              <Button
                key={s || 'all'} size="sm"
                onClick={() => setStatusFilter(s)}
                variant={statusFilter === s ? 'default' : 'outline'}
                className={`text-xs px-3 h-8 ${statusFilter === s ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
              >
                {s || 'All'}
              </Button>
            ))}
          </div>
        </div>

        {/* Subscriptions list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
              <div className="relative w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
              </div>
            </div>
            <p className="text-slate-400 text-sm">Loading subscriptions…</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((sub: any) => (
              <div key={sub.id} className="group relative rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm p-4 hover:border-emerald-500/20 transition-all overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${sub.status === 'ACTIVE' ? 'from-emerald-500 to-teal-400' : 'from-slate-600 to-slate-500'} opacity-50 group-hover:opacity-100 transition-opacity`} />
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{sub.school_name}</p>
                      <p className="text-sm text-slate-400">{sub.plan_name} — GH₵{sub.price}</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {sub.start_date} → {sub.end_date}
                        {sub.status === 'ACTIVE' && <span className="text-emerald-500"> · {sub.days_remaining}d left</span>}
                      </p>
                    </div>
                    <Badge className={`text-xs border flex-shrink-0 ${statusStyle(sub.status)}`}>{sub.status}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-800/60">
                    {sub.status === 'ACTIVE' && (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2 bg-slate-800/50 border-slate-700/50 text-slate-300 hover:text-white" onClick={() => handleExtend(sub.id, 30)}>+30d</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2 bg-slate-800/50 border-slate-700/50 text-slate-300 hover:text-white" onClick={() => handleExtend(sub.id, 90)}>+90d</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" onClick={() => handleStatusChange(sub.id, 'SUSPENDED')}>Suspend</Button>
                      </>
                    )}
                    {['EXPIRED', 'SUSPENDED', 'CANCELLED'].includes(sub.status) && (
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2 bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20" onClick={() => handleStatusChange(sub.id, 'ACTIVE')}>Reactivate</Button>
                    )}
                    <Button size="sm" variant="outline" title="Delete subscription" aria-label="Delete subscription" className="h-7 px-2 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" onClick={() => handleDelete(sub.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <CreditCard className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500">No subscriptions found.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader><DialogTitle className="text-white">Assign Subscription</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1">School</label>
              <Select value={form.school_id} onValueChange={v => setForm(f => ({ ...f, school_id: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select school" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{schools.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1">Plan</label>
              <Select value={form.plan_id} onValueChange={v => setForm(f => ({ ...f, plan_id: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{(data?.plans || []).map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name} — GH₵{p.price}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1">Start Date</label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !form.school_id || !form.plan_id} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader><DialogTitle className="text-white">{editPlan ? 'Edit Plan' : 'New Plan'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1">Name</label>
              <Input value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Basic" className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">Type</label>
                <Select value={planForm.plan_type} onValueChange={v => setPlanForm(f => ({ ...f, plan_type: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="FREE">Free Trial</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">Price (GH₵)</label>
                <Input type="number" value={planForm.price} onChange={e => setPlanForm(f => ({ ...f, price: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">Duration (days)</label>
                <Input type="number" value={planForm.duration_days} onChange={e => setPlanForm(f => ({ ...f, duration_days: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">Max Students</label>
                <Input type="number" value={planForm.max_students} onChange={e => setPlanForm(f => ({ ...f, max_students: e.target.value }))} placeholder="Unlimited" className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleSavePlan} disabled={savingPlan || !planForm.name || !planForm.price} className="bg-gradient-to-r from-purple-600 to-violet-600 text-white">
              {savingPlan ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-1" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
