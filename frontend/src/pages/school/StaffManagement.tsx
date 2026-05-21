import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '@/lib/api';

interface Staff {
  id: number;
  staff_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hire_date: string;
  status: string;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
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
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const staffData = await api.get('/schools/financial/staff/');
      setStaff(staffData);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/schools/financial/staff/${editId}/`, formData);
      } else {
        await api.post('/schools/financial/staff/', formData);
      }
      fetchStaff();
      resetForm();
    } catch (error) {
      console.error('Failed to save staff:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await api.delete(`/schools/financial/staff/${id}/`);
      fetchStaff();
    } catch (error) {
      console.error('Failed to delete staff:', error);
    }
  };

  const handleEdit = (item: Staff) => {
    setFormData({
      staff_id: item.staff_id,
      first_name: item.first_name,
      last_name: item.last_name,
      email: item.email,
      phone: item.phone,
      position: item.position,
      department: item.department,
      hire_date: item.hire_date,
      status: item.status
    });
    setEditId(item.id);
    setShowForm(true);
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
        <h1 className="text-3xl font-bold">Staff Management</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editId ? 'Edit Staff' : 'Add New Staff'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Staff ID"
                value={formData.staff_id}
                onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                required
              />
              <Input
                placeholder="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
              <Input
                placeholder="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                placeholder="Position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                required
              />
              <Input
                placeholder="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
              <Input
                type="date"
                placeholder="Hire Date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                required
              />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="TERMINATED">Terminated</option>
              </select>
              <div className="col-span-2 flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Staff List ({staff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Staff ID</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Position</th>
                  <th className="text-left p-2">Department</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{item.staff_id}</td>
                    <td className="p-2">{item.first_name} {item.last_name}</td>
                    <td className="p-2">{item.position}</td>
                    <td className="p-2">{item.department}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
