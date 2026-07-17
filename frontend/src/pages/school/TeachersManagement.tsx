import { useEffect, useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, UserPlus, Key, Loader2 } from 'lucide-react';
import secureApiClient from '@/lib/secureApiClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const columns = [
  { key: 'full_name', label: 'Name', render: (t: any) => <span className="font-medium text-foreground">{t.full_name || `${t.first_name} ${t.last_name}`}</span> },
  { key: 'email', label: 'Email', render: (t: any) => <span className="text-foreground text-sm">{t.email}</span> },
  { key: 'phone_number', label: 'Phone', render: (t: any) => <span className="text-foreground/70 text-xs">{t.phone_number || '-'}</span> },
  { key: 'qualification', label: 'Qualification', render: (t: any) => <span className="text-foreground/70 text-xs">{t.qualification || '-'}</span> },
  { key: 'assigned_class', label: 'Class', render: (t: any) => (
    <span className="text-foreground/70 text-xs">
      {t.assigned_class ? (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300">
          {t.assigned_class}
        </Badge>
      ) : (
        <span className="text-gray-400 dark:text-gray-600">Unassigned</span>
      )}
    </span>
  )},
  { key: 'is_active', label: 'Status', render: (t: any) => (
    <Badge variant="outline" className={t.is_active ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300'}>
      {t.is_active ? 'Active' : 'Inactive'}
    </Badge>
  )},
  { key: 'actions', label: 'Actions', render: (t: any, actions: any) => (
    <div className="flex items-center gap-1 flex-wrap justify-start">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7 p-0 hover:bg-foreground/10 text-foreground" 
        title="View Credentials" 
        onClick={() => actions?.handleShowCredentials(t)}
      >
        <Key className="h-3.5 w-3.5" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7 p-0 hover:bg-foreground/10 text-foreground" 
        title="View Teacher" 
        onClick={() => actions?.handleViewTeacher(t)}
      >
        <Eye className="h-3.5 w-3.5" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7 p-0 hover:bg-foreground/10 text-foreground" 
        title="Edit Teacher" 
        onClick={() => actions?.handleEditTeacher(t)}
      >
        <Edit className="h-3.5 w-3.5" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7 p-0 hover:bg-foreground/10 text-foreground" 
        title="Assign Class" 
        onClick={() => actions?.handleAssignClass(t)}
      >
        <UserPlus className="h-3.5 w-3.5" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7 p-0 hover:bg-red-100 text-red-600 dark:hover:bg-red-900/40" 
        title="Delete Teacher" 
        onClick={() => actions?.handleDeleteTeacher(t)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )},
];

const TeachersManagement = () => {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Credentials Dialog State
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [selectedCredentialsTeacher, setSelectedCredentialsTeacher] = useState<any>(null);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // View Teacher Dialog State
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingTeacher, setViewingTeacher] = useState<any>(null);

  // Edit Teacher Dialog State
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    qualification: '',
    experience_years: '',
    emergency_contact: '',
    address: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await secureApiClient.get('/teachers/');
      const list = Array.isArray(response) ? response : response?.results || response?.data || [];
      setTeachers(list);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Add Teacher Modal State
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    hire_date: '',
    qualification: '',
    experience_years: '',
    emergency_contact: '',
    address: '',
    class_id: '',
    specializations: [],
  });
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Assign Class Modal State
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [assigningClass, setAssigningClass] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);

  const handleOpenDialog = () => {
    setForm({ 
      employee_id: '',
      first_name: '', 
      last_name: '', 
      email: '', 
      phone_number: '', 
      password: '',
      hire_date: '',
      qualification: '',
      experience_years: '',
      emergency_contact: '',
      address: '',
      class_id: '',
      specializations: [],
    });
    // Load classes and subjects
    secureApiClient.get('/schools/classes/').then(res => {
      const classList = res?.results || res || [];
      setClasses(classList);
    }).catch(() => setClasses([]));
    secureApiClient.get('/schools/subjects/').then(res => {
      const list = res?.results || res || [];
      setSubjects(Array.isArray(list) ? list : []);
    }).catch(() => setSubjects([]));
    setFormError(null);
    setShowDialog(true);
  };

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateTeacher = async () => {
    setCreating(true);
    setFormError(null);
    
    try {
      if (!form.employee_id || !form.first_name || !form.last_name || !form.email || !form.password || !form.hire_date) {
        setFormError('Please fill all required fields (Employee ID, Name, Email, Password, Hire Date).');
        return;
      }
      
      await secureApiClient.post('/teachers/', {
        employee_id: form.employee_id,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        hire_date: form.hire_date,
        phone_number: form.phone_number || '',
        qualification: form.qualification || '',
        experience_years: form.experience_years ? parseInt(form.experience_years) : 0,
        emergency_contact: form.emergency_contact || '',
        address: form.address || '',
        specializations: form.specializations.length > 0 ? form.specializations : [],
        ...(form.class_id ? { class_id: parseInt(form.class_id) } : {}),
      });
      
      setShowDialog(false);
      await fetchTeachers();
    } catch (err: any) {
      const details = err.response?.data?.details || err.response?.data;
      if (details && typeof details === 'object' && !(details instanceof Error)) {
        const messages = Object.entries(details).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n');
        setFormError(messages || err.message || 'Failed to create teacher');
      } else {
        setFormError(err.message || 'Failed to create teacher');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleAssignClass = async (teacher: any) => {
    setSelectedTeacher(teacher);
    setSelectedClassId('');
    setAssignError(null);
    
    // Fetch available classes (only unassigned ones)
    try {
      const response = await secureApiClient.get('/schools/classes/');
      const classList = response?.results || response || [];
      // Filter out classes that already have a class teacher assigned
      const unassignedClasses = classList.filter((cls: any) => !cls.class_teacher);
      setAvailableClasses(unassignedClasses);
      
      if (unassignedClasses.length === 0) {
        setAssignError('No unassigned classes available');
      }
    } catch (error) {
      setAvailableClasses([]);
      setAssignError('Failed to load classes');
    }
    
    setShowAssignDialog(true);
  };

  const handleConfirmAssignClass = async () => {
    if (!selectedTeacher || !selectedClassId) {
      setAssignError('Please select a class');
      return;
    }

    setAssigningClass(true);
    setAssignError(null);

    try {
      const response = await secureApiClient.patch(`/teachers/${selectedTeacher.id}/assign_as_class_teacher/`, {
        class_id: selectedClassId
      });
      
      // Show success message
      const className = response.class_name || 'the selected class';
      toast({ title: 'Success', description: `Assigned ${selectedTeacher.full_name || `${selectedTeacher.first_name} ${selectedTeacher.last_name}`} to ${className}` });
      
      setShowAssignDialog(false);
      await fetchTeachers(); // Refresh the teacher list
    } catch (error: any) {
      setAssignError(error.response?.data?.error || 'Failed to assign class');
    } finally {
      setAssigningClass(false);
    }
  };

  // Show Teacher Credentials
  const handleShowCredentials = async (teacher: any) => {
    setSelectedCredentialsTeacher(teacher);
    setCredentialsLoading(true);
    try {
      const response = await secureApiClient.get(`/teachers/${teacher.id}/credentials/`);
      setSelectedCredentialsTeacher({
        ...teacher,
        credentials: response
      });
      setShowCredentialsDialog(true);
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to load credentials', variant: 'destructive' });
    } finally {
      setCredentialsLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: 'Copied', description: `${field} copied to clipboard` });
  };

  // View Teacher Details
  const handleViewTeacher = (teacher: any) => {
    setViewingTeacher(teacher);
    setShowViewDialog(true);
  };

  // Edit Teacher
  const handleEditTeacher = (teacher: any) => {
    setEditingTeacher(teacher);
    setEditForm({
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      email: teacher.email,
      phone_number: teacher.phone_number || '',
      qualification: teacher.qualification || '',
      experience_years: teacher.experience_years ? teacher.experience_years.toString() : '',
      emergency_contact: teacher.emergency_contact || '',
      address: teacher.address || '',
    });
    setEditError(null);
    setShowEditDialog(true);
  };

  const handleUpdateTeacher = async () => {
    if (!editingTeacher) return;

    setEditLoading(true);
    setEditError(null);

    try {
      if (!editForm.first_name || !editForm.last_name || !editForm.email) {
        setEditError('Please fill all required fields');
        return;
      }

      await secureApiClient.patch(`/teachers/${editingTeacher.id}/`, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        phone_number: editForm.phone_number,
        qualification: editForm.qualification,
        experience_years: editForm.experience_years ? parseInt(editForm.experience_years) : 0,
        emergency_contact: editForm.emergency_contact,
        address: editForm.address,
      });

      toast({ title: 'Success', description: 'Teacher updated successfully' });
      setShowEditDialog(false);
      await fetchTeachers();
    } catch (err: any) {
      const details = err.response?.data?.details || err.response?.data;
      if (details && typeof details === 'object' && !(details instanceof Error)) {
        const messages = Object.entries(details).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n');
        setEditError(messages || err.message || 'Failed to update teacher');
      } else {
        setEditError(err.message || 'Failed to update teacher');
      }
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Teacher
  const handleDeleteTeacher = async (teacher: any) => {
    if (window.confirm(`Are you sure you want to delete ${teacher.first_name} ${teacher.last_name}?`)) {
      try {
        await secureApiClient.delete(`/teachers/${teacher.id}/`);
        toast({ title: 'Success', description: 'Teacher deleted successfully' });
        await fetchTeachers();
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Failed to delete teacher', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="min-h-full w-full max-w-full overflow-x-hidden">
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <PageHeader 
        title="Teachers Management" 
        description="Manage school teachers and their information"
        actionLabel="Add Teacher"
        onAction={handleOpenDialog}
      />
      
      {loading ? (
        <div className="bg-muted/50 rounded-lg p-8 text-center text-foreground/60">Loading teachers...</div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">{error}</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={teachers} 
          searchKey="full_name" 
          searchPlaceholder="Search teachers..." 
          actions={{ 
            handleAssignClass,
            handleShowCredentials,
            handleViewTeacher,
            handleEditTeacher,
            handleDeleteTeacher
          }}
        />
      )}

      {/* Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Teacher Credentials</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {credentialsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-foreground/60" />
              </div>
            ) : selectedCredentialsTeacher?.credentials ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-foreground/60 mb-1">TEACHER NAME</p>
                  <p className="text-sm font-medium text-foreground">{selectedCredentialsTeacher.credentials.teacher_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground/60 mb-1">EMPLOYEE ID</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-mono text-foreground">{selectedCredentialsTeacher.credentials.employee_id}</p>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => copyToClipboard(selectedCredentialsTeacher.credentials.employee_id, 'Employee ID')}
                      className="h-6 px-2 text-xs"
                    >
                      {copiedField === 'employee_id' ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground/60 mb-1">EMAIL</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-mono text-foreground break-all">{selectedCredentialsTeacher.credentials.email}</p>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => copyToClipboard(selectedCredentialsTeacher.credentials.email, 'Email')}
                      className="h-6 px-2 text-xs flex-shrink-0"
                    >
                      {copiedField === 'email' ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground/60 mb-1">CLASS ASSIGNED</p>
                  <p className="text-sm text-foreground">{selectedCredentialsTeacher.credentials.class_name || 'No class assigned'}</p>
                </div>
                <div className="border-t border-border pt-3 mt-3">
                  <p className="text-xs text-foreground/60 mb-2">Portal Access Details:</p>
                  <ul className="text-xs text-foreground/70 space-y-1">
                    <li>• Use email as username to login</li>
                    <li>• Initial password was set during creation</li>
                    <li>• Password can be reset via login page</li>
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground/60 text-center">No credentials available</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowCredentialsDialog(false)} className="bg-foreground/10 hover:bg-foreground/15 text-foreground">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Teacher Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {viewingTeacher && (
              <>
                <div>
                  <p className="text-xs font-semibold text-foreground/60 mb-1">NAME</p>
                  <p className="text-sm font-medium text-foreground">{viewingTeacher.first_name} {viewingTeacher.last_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground/60 mb-1">EMPLOYEE ID</p>
                  <p className="text-sm text-foreground">{viewingTeacher.employee_id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground/60 mb-1">EMAIL</p>
                  <p className="text-sm text-foreground">{viewingTeacher.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground/60 mb-1">PHONE</p>
                  <p className="text-sm text-foreground">{viewingTeacher.phone_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground/60 mb-1">QUALIFICATION</p>
                  <p className="text-sm text-foreground">{viewingTeacher.qualification || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground/60 mb-1">EXPERIENCE</p>
                  <p className="text-sm text-foreground">{viewingTeacher.experience_years || 0} years</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground/60 mb-1">ASSIGNED CLASS</p>
                  <p className="text-sm text-foreground">{viewingTeacher.assigned_class || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground/60 mb-1">STATUS</p>
                  <Badge className={viewingTeacher.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {viewingTeacher.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)} className="bg-foreground/10 hover:bg-foreground/15 text-foreground">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">First Name *</label>
                <Input 
                  value={editForm.first_name} 
                  onChange={(e) => setEditForm({...editForm, first_name: e.target.value})} 
                  placeholder="First Name" 
                  className="text-foreground placeholder:text-foreground/50"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Last Name *</label>
                <Input 
                  value={editForm.last_name} 
                  onChange={(e) => setEditForm({...editForm, last_name: e.target.value})} 
                  placeholder="Last Name"
                  className="text-foreground placeholder:text-foreground/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Email *</label>
                <Input 
                  value={editForm.email} 
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})} 
                  placeholder="Email" 
                  type="email"
                  className="text-foreground placeholder:text-foreground/50"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Phone</label>
                <Input 
                  value={editForm.phone_number} 
                  onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})} 
                  placeholder="Phone Number"
                  className="text-foreground placeholder:text-foreground/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Qualification</label>
                <Input 
                  value={editForm.qualification} 
                  onChange={(e) => setEditForm({...editForm, qualification: e.target.value})} 
                  placeholder="e.g., B.Ed, M.A"
                  className="text-foreground placeholder:text-foreground/50"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Experience (Years)</label>
                <Input 
                  value={editForm.experience_years} 
                  onChange={(e) => setEditForm({...editForm, experience_years: e.target.value})} 
                  placeholder="0" 
                  type="number" 
                  min="0"
                  className="text-foreground placeholder:text-foreground/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Emergency Contact</label>
              <Input 
                value={editForm.emergency_contact} 
                onChange={(e) => setEditForm({...editForm, emergency_contact: e.target.value})} 
                placeholder="Emergency Contact"
                className="text-foreground placeholder:text-foreground/50"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Address</label>
              <Input 
                value={editForm.address} 
                onChange={(e) => setEditForm({...editForm, address: e.target.value})} 
                placeholder="Address"
                className="text-foreground placeholder:text-foreground/50"
              />
            </div>
            {editError && <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">{editError}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={editLoading} className="bg-foreground/5 border-foreground/20 text-foreground hover:bg-foreground/10">
              Cancel
            </Button>
            <Button onClick={handleUpdateTeacher} disabled={editLoading} className="bg-foreground/10 hover:bg-foreground/15 text-foreground">
              {editLoading ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Updating...</span> : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Teacher Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Employee ID *</label>
                <Input value={form.employee_id} onChange={e => handleFormChange('employee_id', e.target.value)} placeholder="Employee ID" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Hire Date *</label>
                <Input value={form.hire_date} onChange={e => handleFormChange('hire_date', e.target.value)} placeholder="YYYY-MM-DD" type="date" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">First Name *</label>
                <Input value={form.first_name} onChange={e => handleFormChange('first_name', e.target.value)} placeholder="First Name" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Last Name *</label>
                <Input value={form.last_name} onChange={e => handleFormChange('last_name', e.target.value)} placeholder="Last Name" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Email *</label>
                <Input value={form.email} onChange={e => handleFormChange('email', e.target.value)} placeholder="Email" type="email" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Phone Number</label>
                <Input value={form.phone_number} onChange={e => handleFormChange('phone_number', e.target.value)} placeholder="Phone Number" />
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Password *</label>
              <Input value={form.password} onChange={e => handleFormChange('password', e.target.value)} placeholder="Password" type="password" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Qualification</label>
                <Input value={form.qualification} onChange={e => handleFormChange('qualification', e.target.value)} placeholder="e.g., B.Ed, M.A" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Experience (Years)</label>
                <Input value={form.experience_years} onChange={e => handleFormChange('experience_years', e.target.value)} placeholder="0" type="number" min="0" />
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Emergency Contact</label>
              <Input value={form.emergency_contact} onChange={e => handleFormChange('emergency_contact', e.target.value)} placeholder="Emergency Contact Number" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <Input value={form.address} onChange={e => handleFormChange('address', e.target.value)} placeholder="Home Address" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Class Assignment</label>
              <select value={form.class_id} onChange={e => handleFormChange('class_id', e.target.value)} className="w-full border rounded p-2 bg-background text-foreground">
                <option value="">No Class</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name || `${c.level} ${c.section || ''}`.trim()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subjects (Specializations)</label>
              <select multiple value={form.specializations} onChange={e => handleFormChange('specializations', Array.from(e.target.selectedOptions, option => option.value))} className="w-full border rounded p-2 bg-background text-foreground">
                {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {formError && <div className="text-destructive text-sm">{formError}</div>}
          </div>
          <DialogFooter>
            <Button onClick={handleCreateTeacher} disabled={creating}>
              {creating ? <span className="mr-2">Creating...</span> : null}
              Add Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Class Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Class to Teacher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm text-foreground/70 mb-2">
                Assigning class to: <span className="font-medium">{selectedTeacher?.full_name || `${selectedTeacher?.first_name} ${selectedTeacher?.last_name}`}</span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Select Class</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class to assign" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.full_name || `${cls.level} ${cls.section || ''}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {assignError && (
              <div className="text-destructive text-sm">{assignError}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)} disabled={assigningClass}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAssignClass} disabled={assigningClass || !selectedClassId}>
              {assigningClass ? 'Assigning...' : 'Assign Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
};

export default TeachersManagement;
