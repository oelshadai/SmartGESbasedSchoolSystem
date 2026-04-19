import { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { secureApiClient } from '@/lib/secureApiClient';
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

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">{total} total users across all schools</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="pl-10" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Roles</SelectItem>
            {ROLES.map(r => <SelectItem key={r} value={r}>{r.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">School</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Last Login</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium whitespace-nowrap">{u.first_name} {u.last_name}</td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3">
                      <Badge className={`text-xs border ${ROLE_COLORS[u.role] || 'bg-slate-500/20 text-slate-400'}`}>{u.role}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.school_name || '—'}</td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="p-3">
                      {u.is_active
                        ? <span className="flex items-center gap-1 text-green-500 text-xs"><CheckCircle className="h-3.5 w-3.5" /> Active</span>
                        : <span className="flex items-center gap-1 text-red-500 text-xs"><XCircle className="h-3.5 w-3.5" /> Inactive</span>}
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-7 text-xs ${u.is_active ? 'text-red-500 hover:text-red-400' : 'text-green-500 hover:text-green-400'}`}
                        onClick={() => toggleActive(u)}
                        disabled={u.role === 'SUPER_ADMIN'}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <p className="text-center text-muted-foreground py-10">No users found.</p>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden p-3 space-y-3">
            {users.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No users found.</p>
            ) : (
              users.map(u => (
                <div key={u.id} className="border rounded-xl p-3 space-y-2 bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{u.first_name} {u.last_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    {u.is_active
                      ? <span className="flex items-center gap-1 text-green-500 text-xs flex-shrink-0"><CheckCircle className="h-3.5 w-3.5" /> Active</span>
                      : <span className="flex items-center gap-1 text-red-500 text-xs flex-shrink-0"><XCircle className="h-3.5 w-3.5" /> Inactive</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs border ${ROLE_COLORS[u.role] || 'bg-slate-500/20 text-slate-400'}`}>{u.role}</Badge>
                    {u.school_name && <span className="text-xs text-muted-foreground">{u.school_name}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {u.last_login ? `Last login: ${new Date(u.last_login).toLocaleDateString()}` : 'Never logged in'}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-7 text-xs ${u.is_active ? 'text-red-500 hover:text-red-400' : 'text-green-500 hover:text-green-400'}`}
                      onClick={() => toggleActive(u)}
                      disabled={u.role === 'SUPER_ADMIN'}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
