import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Award, Search, Loader2, Users } from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';

interface Staff {
  id: number;
  staff_id?: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  phone_number?: string;
  position?: string;
  qualification?: string;
  department?: string;
  hire_date: string;
  status?: string;
  is_active?: boolean;
  salary?: number;
  salary_id?: number;
  user_id?: number;
  type: 'staff' | 'teacher';
}

export default function StaffManagement() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'staff' | 'teacher'>('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    staff_id: '', first_name: '', last_name: '', email: '',
    phone: '', position: '', department: '', hire_date: '', status: 'ACTIVE',
    basic_salary: '', effective_date: new Date().toISOString().split('T')[0],
    weekly_allowance: '',
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [editType, setEditType] = useState<'staff' | 'teacher' | null>(null);
  const [salaryRecords, setSalaryRecords] = useState<Record<number, { id: number; basic_salary: number; weekly_allowance: number; effective_date: string }>>({});

  useEffect(() => { fetchAllStaff(); }, []);

  const fetchAllStaff = async () => {
    setLoading(true);
    try {
      await secureApiClient.post('/schools/financial/staff/sync-teachers/').catch(() => undefined);
      const [staffResponse, teachersResponse, salariesResponse] = await Promise.all([
        secureApiClient.get<any>('/schools/financial/staff/').catch(() => ({ results: [] })),
        secureApiClient.get<any>('/teachers/').catch(() => ({ results: [] })),
        secureApiClient.get<any>('/schools/financial/salaries/').catch(() => ({ results: [] })),
      ]);
      const staffData = Array.isArray(staffResponse) ? staffResponse : staffResponse?.results || [];
      const teachersData = Array.isArray(teachersResponse) ? teachersResponse : teachersResponse?.results || [];
      const salariesData = Array.isArray(salariesResponse) ? salariesResponse : salariesResponse?.results || [];
      const salaryMap = salariesData.reduce((result: Record<number, { id: number; basic_salary: number; weekly_allowance: number; effective_date: string }>, salary: any) => {
        if (!result[salary.staff]) result[salary.staff] = { id: salary.id, basic_salary: Number(salary.basic_salary), weekly_allowance: Number(salary.weekly_allowance || 0), effective_date: salary.effective_date };
        return result;
      }, {});
      setSalaryRecords(salaryMap);

      const normalizedStaff = staffData.map((item: any) => ({
        id: item.id, staff_id: item.staff_id, first_name: item.first_name, last_name: item.last_name,
        email: item.email, phone: item.phone, position: item.position, department: item.department,
        hire_date: item.hire_date, status: item.status, user_id: item.user, type: 'staff' as const,
        salary: salaryMap[item.id]?.basic_salary, salary_id: salaryMap[item.id]?.id,
      }));
      const normalizedTeachers = teachersData.map((item: any) => ({
        id: item.id, user_id: item.user_id, employee_id: item.employee_id, first_name: item.first_name, last_name: item.last_name,
        email: item.email, phone_number: item.phone_number, qualification: item.qualification,
        hire_date: item.hire_date, is_active: item.is_active, type: 'teacher' as const,
      }));

      const payrollUserIds = new Set(normalizedStaff.map(item => item.user_id).filter(Boolean));
      const unlinkedTeachers = normalizedTeachers.filter(item => !payrollUserIds.has((item as any).user_id));
      setStaff([...normalizedStaff, ...unlinkedTeachers].sort((a, b) =>
        `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
      ));
    } catch (error: any) {
      toast({ title: 'Error loading staff', description: error.message || 'Please try again', variant: 'destructive' });
      setStaff([]);
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { basic_salary, effective_date, weekly_allowance, ...staffData } = formData;
      if (editId) {
        if (editType === 'teacher') {
          await secureApiClient.put(`/teachers/${editId}/`, {
            employee_id: staffData.staff_id,
            qualification: staffData.position,
            hire_date: staffData.hire_date,
            is_active: staffData.status === 'ACTIVE',
          });
          toast({ title: 'Success', description: 'Teacher details updated successfully' });
        } else {
          await secureApiClient.put(`/schools/financial/staff/${editId}/`, staffData);
          const salaryPayload = { staff: editId, basic_salary: basic_salary || '0', weekly_allowance: weekly_allowance || '0', effective_date };
          if (salaryRecords[editId]) {
            await secureApiClient.put(`/schools/financial/salaries/${salaryRecords[editId].id}/`, salaryPayload);
          } else {
            await secureApiClient.post('/schools/financial/salaries/', salaryPayload);
          }
          toast({ title: 'Success', description: 'Staff member and salary updated successfully' });
        }
      } else {
        const created = await secureApiClient.post<any>('/schools/financial/staff/', staffData);
        const createdStaff = created?.data || created;
        if (createdStaff?.id) {
          await secureApiClient.post('/schools/financial/salaries/', {
            staff: createdStaff.id,
            basic_salary: basic_salary || '0',
            weekly_allowance: weekly_allowance || '0',
            effective_date,
          });
        }
        toast({ title: 'Success', description: 'Staff member added successfully' });
      }
      fetchAllStaff();
      resetForm();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save staff', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number, type: 'staff' | 'teacher') => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await secureApiClient.delete(type === 'staff' ? `/schools/financial/staff/${id}/` : `/teachers/${id}/`);
      toast({ title: 'Success', description: 'Staff member deleted successfully' });
      fetchAllStaff();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete staff', variant: 'destructive' });
    }
  };

  const handleEdit = (item: Staff) => {
    setFormData({
      staff_id: item.staff_id || '', first_name: item.first_name, last_name: item.last_name,
      email: item.email, phone: item.phone || item.phone_number || '', position: item.position || item.qualification || '',
      department: item.department || '', hire_date: item.hire_date, status: item.status || 'ACTIVE',
      basic_salary: item.salary?.toString() || '0', effective_date: item.salary_id ? (salaryRecords[item.id]?.effective_date || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
      weekly_allowance: item.salary_id ? (salaryRecords[item.id]?.weekly_allowance?.toString() || '0') : '0',
    });
    setEditId(item.id);
    setEditType(item.type);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ staff_id: '', first_name: '', last_name: '', email: '', phone: '', position: '', department: '', hire_date: '', status: 'ACTIVE', basic_salary: '', effective_date: new Date().toISOString().split('T')[0], weekly_allowance: '' });
    setEditId(null);
    setEditType(null);
    setShowForm(false);
  };

  const filtered = staff.filter((item) => {
    const matchesSearch =
      item.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.staff_id || item.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (typeFilter === 'all' || item.type === typeFilter);
  });

  const getStatusBadge = (item: Staff) => {
    const active = item.type === 'teacher' ? item.is_active : item.status === 'ACTIVE';
    const label = item.type === 'teacher' ? (item.is_active ? 'Active' : 'Inactive') : item.status;
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-foreground/60'}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="financial-page p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="theme-page-title">Staff Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage staff and teaching personnel</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="theme-button w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="theme-card-title">{editId ? 'Edit Staff' : 'Add New Staff'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input placeholder="Staff ID" value={formData.staff_id} onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })} className="theme-input" required />
              <Input placeholder="First Name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="theme-input" required />
              <Input placeholder="Last Name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="theme-input" required />
              <Input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="theme-input" />
              <Input placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="theme-input" />
              <Input placeholder="Position" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="theme-input" required />
              <Input placeholder="Department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="theme-input" />
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Basic Salary (GH₵)</label>
                <Input type="number" min="0" step="0.01" placeholder="Enter salary amount" value={formData.basic_salary} onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })} className="theme-input" required />
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Weekly Allowance (GH₵)</label>
                              <Input type="number" min="0" step="0.01" placeholder="For weekly payroll" value={formData.weekly_allowance} onChange={(e) => setFormData({ ...formData, weekly_allowance: e.target.value })} className="theme-input" required />
                            </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Hire Date</label>
                <Input type="date" value={formData.hire_date} onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })} className="theme-input" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Salary Effective Date</label>
                <Input type="date" value={formData.effective_date} onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })} className="theme-input" required />
              </div>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 theme-input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="TERMINATED">Terminated</option>
              </select>
              <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="theme-button w-full sm:w-auto">Save</Button>
                <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto">Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search + filter */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 theme-input"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'staff', 'teacher'] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={typeFilter === f ? 'default' : 'outline'}
                onClick={() => setTypeFilter(f)}
                className={typeFilter === f ? 'theme-button' : ''}
              >
                {f === 'all' ? `All (${staff.length})` : f === 'staff' ? `Staff (${staff.filter(s => s.type === 'staff').length})` : `Teachers (${staff.filter(s => s.type === 'teacher').length})`}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="theme-card-title flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" />
            Staff & Teachers
            {loading && <Loader2 className="h-4 w-4 animate-spin ml-1 text-muted-foreground" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No staff members found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="theme-table-header text-left p-3 text-sm">ID</th>
                    <th className="theme-table-header text-left p-3 text-sm">Name</th>
                    <th className="theme-table-header text-left p-3 text-sm">Type</th>
                    <th className="theme-table-header text-left p-3 text-sm">Position / Qualification</th>
                    <th className="theme-table-header text-left p-3 text-sm">Basic Salary</th>
                    <th className="theme-table-header text-left p-3 text-sm">Email</th>
                    <th className="theme-table-header text-left p-3 text-sm">Status</th>
                    <th className="theme-table-header text-left p-3 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={`${item.type}-${item.id}`} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-sm font-medium text-muted-foreground">{item.staff_id || item.employee_id || '—'}</td>
                      <td className="p-3 font-medium">{item.first_name} {item.last_name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${item.type === 'teacher' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'}`}>
                          {item.type === 'teacher' && <Award className="h-3 w-3" />}
                          {item.type === 'teacher' ? 'Teacher' : 'Staff'}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{item.type === 'staff' ? (item.position || '—') : (item.qualification || '—')}</td>
                      <td className="p-3 text-sm font-semibold text-foreground">{item.type === 'staff' && item.salary !== undefined ? `GH₵${item.salary.toLocaleString()}` : '—'}</td>
                      <td className="p-3 text-sm text-muted-foreground">{item.email}</td>
                      <td className="p-3">{getStatusBadge(item)}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(item)} title={item.type === 'staff' ? 'Edit staff data and salary' : 'Edit teacher details'}><Edit className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id, item.type)} className="bg-red-600/10 border-red-600/30 text-red-600 hover:bg-red-600/20">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1 flex items-center gap-2">
          Staff & Teachers
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
        </h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No staff members found.</CardContent></Card>
        ) : filtered.map((item) => (
          <Card key={`${item.type}-${item.id}`}>
            <CardContent className="pt-4 pb-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{item.first_name} {item.last_name}</p>
                  <p className="text-xs text-muted-foreground">{item.staff_id || item.employee_id || '—'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${item.type === 'teacher' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'}`}>
                    {item.type === 'teacher' && <Award className="h-3 w-3" />}
                    {item.type === 'teacher' ? 'Teacher' : 'Staff'}
                  </span>
                  {getStatusBadge(item)}
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>{item.type === 'staff' ? item.position : item.qualification}</p>
                <p>{item.email}</p>
                {item.type === 'staff' && <p className="font-semibold text-foreground">Basic salary: {item.salary !== undefined ? `GH₵${item.salary.toLocaleString()}` : 'Not set'}</p>}
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => handleEdit(item)} className="flex-1">
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id, item.type)} className={`bg-red-600/10 border-red-600/30 text-red-600 hover:bg-red-600/20 ${item.type === 'staff' ? '' : 'flex-1'}`}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
