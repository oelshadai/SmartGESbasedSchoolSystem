import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, GraduationCap, School, CreditCard, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { secureApiClient } from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';

const ROLE_COLORS: Record<string, string> = {
  SCHOOL_ADMIN: 'bg-blue-500/20 text-blue-400',
  PRINCIPAL: 'bg-purple-500/20 text-purple-400',
  TEACHER: 'bg-green-500/20 text-green-400',
  STUDENT: 'bg-yellow-500/20 text-yellow-400',
  PARENT: 'bg-orange-500/20 text-orange-400',
};

export default function AdminSchoolDetail() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [showSubDialog, setShowSubDialog] = useState(false);
  const [newPlanId, setNewPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [creatingSubscription, setCreatingSubscription] = useState(false);

  useEffect(() => { fetchDetail(); fetchPlans(); }, [schoolId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await secureApiClient.get(`/auth/superadmin/schools/${schoolId}/`);
      setSchool(res);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await secureApiClient.get('/auth/superadmin/plans/');
      setPlans(res.plans || []);
    } catch { /* ignore */ }
  };

  const handleCreateSubscription = async () => {
    if (!newPlanId) return;
    setCreatingSubscription(true);
    try {
      await secureApiClient.post('/auth/superadmin/subscriptions/create/', {
        school_id: Number(schoolId),
        plan_id: Number(newPlanId),
        start_date: startDate,
      });
      toast({ title: 'Success', description: 'Subscription created' });
      setShowSubDialog(false);
      fetchDetail();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setCreatingSubscription(false);
    }
  };

  const handleExtend = async (subId: number, days: number) => {
    try {
      await secureApiClient.post(`/auth/superadmin/subscriptions/${subId}/extend/`, { days });
      toast({ title: 'Extended', description: `Subscription extended by ${days} days` });
      fetchDetail();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleStatusChange = async (subId: number, newStatus: string) => {
    try {
      await secureApiClient.patch(`/auth/superadmin/subscriptions/${subId}/`, { status: newStatus });
      toast({ title: 'Updated', description: `Subscription ${newStatus.toLowerCase()}` });
      fetchDetail();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const toggleUserActive = async (userId: number, current: boolean) => {
    try {
      await secureApiClient.patch(`/auth/superadmin/users/${userId}/`, { is_active: !current });
      setSchool((s: any) => ({
        ...s,
        users: s.users.map((u: any) => u.id === userId ? { ...u, is_active: !current } : u)
      }));
      toast({ title: 'Updated' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!school) return <p className="text-muted-foreground">School not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/schools')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{school.name}</h1>
          <p className="text-sm text-muted-foreground">{school.location} · {school.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Students', value: school.student_count, icon: GraduationCap },
          { label: 'Teachers', value: school.teacher_count, icon: Users },
          { label: 'Admins', value: school.admin_count, icon: School },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
            <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Active Subscription */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4" /> Active Subscription</h2>
          <Button size="sm" onClick={() => setShowSubDialog(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New Subscription
          </Button>
        </div>
        {school.active_subscription ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 items-center">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{school.active_subscription.plan}</Badge>
              <span className="text-sm text-muted-foreground">{school.active_subscription.plan_type}</span>
              <span className="text-sm">Expires: <strong>{school.active_subscription.end_date}</strong></span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleExtend(school.active_subscription.id, 30)}>+30 days</Button>
              <Button size="sm" variant="outline" onClick={() => handleExtend(school.active_subscription.id, 90)}>+90 days</Button>
              <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleStatusChange(school.active_subscription.id, 'SUSPENDED')}>Suspend</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active subscription.</p>
        )}
      </div>

      {/* Subscription History */}
      {school.subscription_history?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Subscription History</h2>
          <div className="space-y-2">
            {school.subscription_history.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                <span>{s.plan}</span>
                <span className="text-muted-foreground">{s.start_date} → {s.end_date}</span>
                <Badge className={`text-xs ${s.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>{s.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-4">User Accounts ({school.users?.length || 0})</h2>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {school.users?.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
              <div>
                <span className="font-medium">{u.first_name} {u.last_name}</span>
                <span className="text-muted-foreground ml-2">{u.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${ROLE_COLORS[u.role] || 'bg-slate-500/20 text-slate-400'}`}>{u.role}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className={u.is_active ? 'text-red-500 h-7' : 'text-green-500 h-7'}
                  onClick={() => toggleUserActive(u.id, u.is_active)}
                >
                  {u.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Subscription Dialog */}
      <Dialog open={showSubDialog} onOpenChange={setShowSubDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Subscription for {school.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium block mb-1">Plan</label>
              <Select value={newPlanId} onValueChange={setNewPlanId}>
                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name} — GH₵{p.price} ({p.duration_days} days)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Start Date</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateSubscription} disabled={creatingSubscription || !newPlanId}>
              {creatingSubscription ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
