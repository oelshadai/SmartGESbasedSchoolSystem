import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, Users, GraduationCap, ChevronRight, Search, Loader2, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { secureApiClient } from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';

interface SchoolItem {
  id: number;
  name: string;
  location: string;
  email: string;
  created_at: string;
  is_active: boolean;
  student_count: number;
  teacher_count: number;
  admin_count: number;
  subscription: { plan: string | null; status: string; end_date: string | null };
}

const statusColor = (status: string) => {
  if (status === 'ACTIVE') return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (status === 'EXPIRED') return 'bg-red-500/20 text-red-400 border-red-500/30';
  return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
};

export default function AdminSchools() {
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => { fetchSchools(); }, []);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await secureApiClient.get('/auth/superadmin/schools/');
      setSchools(res.schools || []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (school: SchoolItem) => {
    try {
      await secureApiClient.patch(`/auth/superadmin/schools/${school.id}/`, { is_active: !school.is_active });
      setSchools(s => s.map(x => x.id === school.id ? { ...x, is_active: !x.is_active } : x));
      toast({ title: 'Updated', description: `School ${!school.is_active ? 'activated' : 'deactivated'}` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const filtered = schools.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Schools</h1>
          <p className="text-muted-foreground text-sm">{schools.length} registered schools</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search schools..."
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(school => (
            <div key={school.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{school.name}</h3>
                    {school.is_active
                      ? <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      : <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{school.location || 'No location'} · {school.email || 'No email'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registered {school.created_at ? new Date(school.created_at).toLocaleDateString() : '—'}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
                  <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{school.student_count}</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{school.teacher_count}</span>
                  <span className="flex items-center gap-1"><School className="h-3.5 w-3.5" />{school.admin_count} admin{school.admin_count !== 1 ? 's' : ''}</span>
                </div>

                {/* Subscription badge */}
                <div className="flex-shrink-0">
                  <Badge className={`text-xs border ${statusColor(school.subscription.status)}`}>
                    <CreditCard className="h-3 w-3 mr-1" />
                    {school.subscription.plan || 'No Plan'} · {school.subscription.status}
                  </Badge>
                  {school.subscription.end_date && (
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      Until {new Date(school.subscription.end_date).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(school)}
                    className={school.is_active ? 'text-red-500 border-red-500/30 hover:bg-red-500/10' : 'text-green-500 border-green-500/30 hover:bg-green-500/10'}
                  >
                    {school.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/schools/${school.id}`)}
                  >
                    Details <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No schools found.</p>
          )}
        </div>
      )}
    </div>
  );
}
