import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, Users, GraduationCap, ChevronRight, Search, Loader2, CheckCircle, XCircle, CreditCard, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import secureApiClient from '@/lib/secureApiClient';
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

const subStatusStyle = (status: string) => {
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
    <div className="flex flex-col w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-full relative">
      {/* Background */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      <div className="hidden sm:block absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Schools</h1>
            <p className="text-slate-400 text-sm mt-0.5">{schools.length} registered schools on the platform</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSchools}
            className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search schools by name or location..."
            className="pl-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
              <div className="relative w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
              </div>
            </div>
            <p className="text-slate-400 text-sm">Loading schools…</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(school => (
              <div
                key={school.id}
                className="group relative rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm p-5 hover:border-blue-500/30 hover:bg-slate-800/60 transition-all duration-200 overflow-hidden"
              >
                {/* Top accent */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${school.is_active ? 'from-blue-500 to-cyan-400' : 'from-slate-600 to-slate-500'} opacity-60 group-hover:opacity-100 transition-opacity`} />

                <div className="flex flex-col gap-4">
                  {/* Name + subscription */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${school.is_active ? 'bg-blue-500/15 border border-blue-500/20' : 'bg-slate-700/40 border border-slate-600/30'}`}>
                        <School className={`h-5 w-5 ${school.is_active ? 'text-blue-400' : 'text-slate-500'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors truncate">{school.name}</h3>
                          {school.is_active
                            ? <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                            : <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{school.location || 'No location'} · {school.email || 'No email'}</p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Registered {school.created_at ? new Date(school.created_at).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <Badge className={`text-xs border ${subStatusStyle(school.subscription.status)}`}>
                        <CreditCard className="h-3 w-3 mr-1" />
                        {school.subscription.plan || 'No Plan'}
                      </Badge>
                      <p className={`text-xs mt-1 ${school.subscription.status === 'ACTIVE' ? 'text-green-400' : 'text-red-400'}`}>
                        {school.subscription.status}
                      </p>
                      {school.subscription.end_date && (
                        <p className="text-xs text-slate-600 mt-0.5">
                          Until {new Date(school.subscription.end_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats + Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/60">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 text-purple-400" />
                        <span className="text-slate-300">{school.student_count}</span> students
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-slate-300">{school.teacher_count}</span> teachers
                      </span>
                      <span className="flex items-center gap-1.5">
                        <School className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="text-slate-300">{school.admin_count}</span> admins
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(school)}
                        className={`h-8 text-xs px-3 border ${school.is_active
                          ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                          : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'}`}
                      >
                        {school.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/schools/${school.id}`)}
                        className="h-8 text-xs px-3 bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                      >
                        Details <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <School className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500">No schools found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
