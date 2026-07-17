import { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle, XCircle, Mail, ShieldOff, ShieldCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import secureApiClient from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
  SCHOOL_ADMIN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PRINCIPAL: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  TEACHER: 'bg-green-500/20 text-green-400 border-green-500/30',
  STUDENT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  PARENT: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'];
const ADMIN_ROLES = ['SCHOOL_ADMIN', 'PRINCIPAL'];

export default function AdminUsers() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [cascading, setCascading] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await secureApiClient.get(`/auth/superadmin/users/?${params}`);
      setUsers(res.users || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (user: any) => {
    try {
      await secureApiClient.patch(`/auth/superadmin/users/${user.id}/`, { is_active: !user.is_active });
      setUsers(u => u.map(x => x.id === user.id ? { ...x, is_active: !x.is_active } : x));
      toast({ title: 'Updated', description: `User ${!user.is_active ? 'activated' : 'deactivated'}` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const cascadeDisable = async (user: any) => {
    const confirmed = window.confirm(
      user.is_active
        ? `Disable "${user.school_name || 'this school'}" — this will deactivate ALL users under this school. Continue?`
        : `Re-enable all accounts under "${user.school_name || 'this school'}"?`
    );
    if (!confirmed) return;
    setCascading(user.id);
    try {
      const endpoint = user.is_active
        ? `/auth/superadmin/admins/${user.id}/disable/`
        : `/auth/superadmin/admins/${user.id}/enable/`;
      const res = await secureApiClient.post(endpoint, {});
      toast({
        title: user.is_active ? 'School Disabled' : 'School Enabled',
        description: `${res.affected_users} accounts were ${user.is_active ? 'disabled' : 'enabled'} in ${res.school}.`,
      });
      fetchUsers();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setCascading(null);
    }
  };

  const ActionButtons = ({ u }: { u: any }) => (
    <div className="flex items-center gap-1 flex-wrap">
      <Button
        size="sm" variant="ghost"
        className={`h-7 text-xs px-2 ${u.is_active ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : 'text-green-400 hover:text-green-300 hover:bg-green-500/10'}`}
        onClick={() => toggleActive(u)}
        disabled={u.role === 'SUPER_ADMIN'}
      >
        <span className="hidden sm:inline">{u.is_active ? 'Deactivate' : 'Activate'}</span>
        <span className="sm:hidden">{u.is_active ? '✕' : '✓'}</span>
      </Button>
      {ADMIN_ROLES.includes(u.role) && (
        <>
          <Button
            size="sm" variant="ghost"
            className={`h-7 text-xs px-2 ${u.is_active ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10' : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'}`}
            onClick={() => cascadeDisable(u)}
            disabled={cascading === u.id}
          >
            {cascading === u.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <span className="hidden sm:inline">{u.is_active ? 'Disable School' : 'Enable School'}</span>
                <span className="sm:hidden">{u.is_active ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}</span>
              </>
            )}
          </Button>
          <Button
            size="sm" variant="ghost"
            className="h-7 text-xs px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
            onClick={() => navigate('/admin/messages', { state: { preselect: u.id } })}
          >
            <span className="hidden sm:inline">Message</span>
            <span className="sm:hidden"><Mail className="h-3.5 w-3.5" /></span>
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-full relative">
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      <div className="hidden sm:block absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} total users across all schools</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-purple-500/50"
            />
          </div>
          <Select value={roleFilter || 'all'} onValueChange={v => setRoleFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-44 bg-slate-800/50 border-slate-700/50 text-slate-300">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Roles</SelectItem>
              {ROLES.map(r => <SelectItem key={r} value={r}>{r.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl" />
              <div className="relative w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-purple-400" />
              </div>
            </div>
            <p className="text-slate-400 text-sm">Loading users…</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-400 opacity-50" />
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800/60 bg-slate-800/30">
                    <th className="text-left p-3 font-semibold text-slate-400 text-xs uppercase tracking-wider">Name</th>
                    <th className="text-left p-3 font-semibold text-slate-400 text-xs uppercase tracking-wider">Email</th>
                    <th className="text-left p-3 font-semibold text-slate-400 text-xs uppercase tracking-wider">Role</th>
                    <th className="text-left p-3 font-semibold text-slate-400 text-xs uppercase tracking-wider">School</th>
                    <th className="text-left p-3 font-semibold text-slate-400 text-xs uppercase tracking-wider">Last Login</th>
                    <th className="text-left p-3 font-semibold text-slate-400 text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left p-3 font-semibold text-slate-400 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-slate-800/40 last:border-0 hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-medium text-white whitespace-nowrap">{u.first_name} {u.last_name}</td>
                      <td className="p-3 text-slate-400">{u.email}</td>
                      <td className="p-3">
                        <Badge className={`text-xs border ${ROLE_COLORS[u.role] || 'bg-slate-500/20 text-slate-400'}`}>{u.role}</Badge>
                      </td>
                      <td className="p-3 text-slate-400">{u.school_name || '—'}</td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="p-3">
                        {u.is_active
                          ? <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle className="h-3.5 w-3.5" /> Active</span>
                          : <span className="flex items-center gap-1 text-red-400 text-xs"><XCircle className="h-3.5 w-3.5" /> Inactive</span>}
                      </td>
                      <td className="p-3"><ActionButtons u={u} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500">No users found.</p>
                </div>
              )}
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500">No users found.</p>
                </div>
              ) : users.map(u => (
                <div key={u.id} className="group relative rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm p-4 space-y-3 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-400 opacity-40 group-hover:opacity-80 transition-opacity" />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{u.first_name} {u.last_name}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                    {u.is_active
                      ? <span className="flex items-center gap-1 text-green-400 text-xs flex-shrink-0"><CheckCircle className="h-3.5 w-3.5" /> Active</span>
                      : <span className="flex items-center gap-1 text-red-400 text-xs flex-shrink-0"><XCircle className="h-3.5 w-3.5" /> Inactive</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs border ${ROLE_COLORS[u.role] || 'bg-slate-500/20 text-slate-400'}`}>{u.role}</Badge>
                    {u.school_name && <span className="text-xs text-slate-500">{u.school_name}</span>}
                  </div>
                  <p className="text-xs text-slate-600">
                    {u.last_login ? `Last login: ${new Date(u.last_login).toLocaleDateString()}` : 'Never logged in'}
                  </p>
                  <ActionButtons u={u} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
