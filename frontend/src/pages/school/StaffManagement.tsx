import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Award, Search, Loader2 } from 'lucide-react';
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
    staff_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    hire_date: '',
    status: 'ACTIVE'
  });
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchAllStaff();
  }, []);

  const fetchAllStaff = async () => {
    setLoading(true);
    try {
      // Fetch both Staff and Teachers in parallel
      const [staffResponse, teachersResponse] = await Promise.all([
        secureApiClient.get<any>('/schools/financial/staff/').catch(() => ({ results: [] })),
        secureApiClient.get<any>('/schools/teachers/').catch(() => ({ results: [] }))
      ]);

      const staffData = Array.isArray(staffResponse) ? staffResponse : staffResponse?.results || [];
      const teachersData = Array.isArray(teachersResponse) ? teachersResponse : teachersResponse?.results || [];

      // Normalize staff data
      const normalizedStaff = staffData.map((item: any) => ({
        id: item.id,
        staff_id: item.staff_id,
        first_name: item.first_name,
        last_name: item.last_name,
        email: item.email,
        phone: item.phone,
        position: item.position,
        department: item.department,
        hire_date: item.hire_date,
        status: item.status,
        type: 'staff' as const
      }));

      // Normalize teacher data
      const normalizedTeachers = teachersData.map((item: any) => ({
        id: item.id,
        employee_id: item.employee_id,
        first_name: item.first_name,
        last_name: item.last_name,
        email: item.email,
        phone_number: item.phone_number,
        qualification: item.qualification,
        hire_date: item.hire_date,
        is_active: item.is_active,
        type: 'teacher' as const
      }));

      // Combine and sort
      const combined = [...normalizedStaff, ...normalizedTeachers].sort((a, b) => {
        const nameA = `${a.last_name} ${a.first_name}`;
        const nameB = `${b.last_name} ${b.first_name}`;
        return nameA.localeCompare(nameB);
      });

      setStaff(combined);
    } catch (error: any) {
      console.error('Failed to fetch staff:', error);
      toast({ title: 'Error loading staff', description: error.message || 'Please try again', variant: 'destructive' });
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await secureApiClient.put(`/schools/financial/staff/${editId}/`, formData);
        toast({ title: 'Success', description: 'Staff member updated successfully' });
      } else {
        await secureApiClient.post('/schools/financial/staff/', formData);
        toast({ title: 'Success', description: 'Staff member added successfully' });
      }
      fetchAllStaff();
      resetForm();
    } catch (error: any) {
      console.error('Failed to save staff:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save staff', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number, type: 'staff' | 'teacher') => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      const endpoint = type === 'staff' ? `/schools/financial/staff/${id}/` : `/schools/teachers/${id}/`;
      await secureApiClient.delete(endpoint);
      toast({ title: 'Success', description: 'Staff member deleted successfully' });
      fetchAllStaff();
    } catch (error: any) {
      console.error('Failed to delete staff:', error);
      toast({ title: 'Error', description: error.message || 'Failed to delete staff', variant: 'destructive' });
    }
  };

  const handleEdit = (item: Staff) => {
    if (item.type === 'staff') {
      setFormData({
        staff_id: item.staff_id || '',
        first_name: item.first_name,
        last_name: item.last_name,
        email: item.email,
        phone: item.phone || '',
        position: item.position || '',
        department: item.department || '',
        hire_date: item.hire_date,
        status: item.status || 'ACTIVE'
      });
      setEditId(item.id);
      setShowForm(true);
    } else {
      alert('Teacher editing is not available from this view. Please use the Teachers Management section.');
    }
  };

  const resetForm = () => {
    setFormData({
      staff_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      hire_date: '',
      status: 'ACTIVE'
    });
    setEditId(null);
    setShowForm(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="theme-page-title text-foreground">Staff Management</h1>
        <Button onClick={() => setShowForm(!showForm)} className="theme-button bg-foreground/10 border-foreground/20 text-foreground hover:bg-foreground/15">
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {showForm && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">{editId ? 'Edit Staff' : 'Add New Staff'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Staff ID"
                value={formData.staff_id}
                onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                className="text-foreground placeholder:text-foreground/50"
                required
              />
              <Input
                placeholder="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="text-foreground placeholder:text-foreground/50"
                required
              />
              <Input
                placeholder="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="text-foreground placeholder:text-foreground/50"
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="text-foreground placeholder:text-foreground/50"
              />
              <Input
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="text-foreground placeholder:text-foreground/50"
              />
              <Input
                placeholder="Position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="text-foreground placeholder:text-foreground/50"
                required
              />
              <Input
                placeholder="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="text-foreground placeholder:text-foreground/50"
              />
              <Input
                type="date"
                placeholder="Hire Date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                className="text-foreground placeholder:text-foreground/50"
                required
              />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-foreground/50"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="TERMINATED">Terminated</option>
              </select>
              <div className="col-span-2 flex gap-2">
                <Button type="submit" className="bg-foreground/10 border-foreground/20 text-foreground hover:bg-foreground/15">Save</Button>
                <Button type="button" variant="outline" onClick={resetForm} className="bg-foreground/5 border-foreground/20 text-foreground hover:bg-foreground/10">Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter Section */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/60" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-foreground placeholder:text-foreground/50"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={typeFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setTypeFilter('all')}
                className={typeFilter === 'all' ? 'bg-foreground text-background' : 'bg-foreground/5 border-foreground/20 text-foreground hover:bg-foreground/10'}
              >
                All ({staff.length})
              </Button>
              <Button
                variant={typeFilter === 'staff' ? 'default' : 'outline'}
                onClick={() => setTypeFilter('staff')}
                className={typeFilter === 'staff' ? 'bg-purple-600 text-white' : 'bg-purple-100/20 border-purple-200/50 text-purple-700 hover:bg-purple-100/30'}
              >
                Staff ({staff.filter(s => s.type === 'staff').length})
              </Button>
              <Button
                variant={typeFilter === 'teacher' ? 'default' : 'outline'}
                onClick={() => setTypeFilter('teacher')}
                className={typeFilter === 'teacher' ? 'bg-blue-600 text-white' : 'bg-blue-100/20 border-blue-200/50 text-blue-700 hover:bg-blue-100/30'}
              >
                Teachers ({staff.filter(s => s.type === 'teacher').length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Staff & Teachers
            {loading && <Loader2 className="h-4 w-4 animate-spin ml-2 inline-block text-foreground/60" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-foreground/60" />
            </div>
          ) : staff.length === 0 ? (
            <p className="text-center text-foreground/60 py-8">No staff members found. Add one to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-foreground font-semibold text-left p-3 text-sm">ID</th>
                    <th className="text-foreground font-semibold text-left p-3 text-sm">Name</th>
                    <th className="text-foreground font-semibold text-left p-3 text-sm">Type</th>
                    <th className="text-foreground font-semibold text-left p-3 text-sm">Position/Qualification</th>
                    <th className="text-foreground font-semibold text-left p-3 text-sm">Email</th>
                    <th className="text-foreground font-semibold text-left p-3 text-sm">Status</th>
                    <th className="text-foreground font-semibold text-left p-3 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff
                    .filter(item => {
                      const matchesSearch = 
                        item.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.staff_id || item.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesType = typeFilter === 'all' || item.type === typeFilter;
                      return matchesSearch && matchesType;
                    })
                    .map((item) => (
                      <tr key={`${item.type}-${item.id}`} className="border-b border-border hover:bg-foreground/5 transition-colors">
                        <td className="text-foreground/80 p-3 text-sm font-medium">{item.staff_id || item.employee_id || '-'}</td>
                        <td className="text-foreground p-3 font-medium">{item.first_name} {item.last_name}</td>
                        <td className="p-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${
                            item.type === 'teacher' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' 
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                          }`}>
                            {item.type === 'teacher' && <Award className="h-3 w-3" />}
                            {item.type === 'teacher' ? 'Teacher' : 'Staff'}
                          </span>
                        </td>
                        <td className="text-foreground/80 p-3 text-sm">
                          {item.type === 'staff' ? (item.position || '-') : (item.qualification || '-')}
                        </td>
                        <td className="text-foreground/80 p-3 text-sm">{item.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.type === 'teacher' 
                              ? (item.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300')
                              : (item.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-foreground/50')
                          }`}>
                            {item.type === 'teacher' ? (item.is_active ? 'Active' : 'Inactive') : item.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            {item.type === 'staff' && (
                              <Button size="sm" variant="outline" onClick={() => handleEdit(item)} className="bg-foreground/5 border-foreground/20 text-foreground hover:bg-foreground/10">
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleDelete(item.id, item.type)} 
                              className="bg-red-600/10 border-red-600/30 text-red-600 hover:bg-red-600/20"
                            >
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
    </div>
  );
}
