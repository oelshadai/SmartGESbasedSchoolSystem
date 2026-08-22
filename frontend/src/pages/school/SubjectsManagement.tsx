import { useEffect, useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, UserPlus } from 'lucide-react';
import secureApiClient from '@/lib/secureApiClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SubjectsManagement = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Subject Modal State
  const [showDialog, setShowDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    code: '',
    category: '',
    description: '',
  });
  const [assignForm, setAssignForm] = useState({
    class_id: '',
    teacher_id: '',
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const response = await secureApiClient.get('/schools/subjects/');
      console.log('Subjects API response:', response);
      setSubjects(Array.isArray(response) ? response : response.results || response.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Subjects API error:', err);
      setError(err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchTeachers();
    fetchClasses();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await secureApiClient.get('/teachers/');
      setTeachers(Array.isArray(response) ? response : response.results || response.data || []);
    } catch (err: any) {
      console.error('Failed to load teachers:', err);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await secureApiClient.get('/schools/classes/');
      setClasses(Array.isArray(response) ? response : response.results || response.data || []);
    } catch (err: any) {
      console.error('Failed to load classes:', err);
    }
  };

  const columns = [
    { key: 'name', label: 'Subject', render: (s: any) => <span className="font-medium text-foreground">{s.name}</span> },
    { key: 'code', label: 'Code', render: (s: any) => <span className="font-mono text-foreground">{s.code}</span> },
    { key: 'category', label: 'Category', render: (s: any) => (
      <Badge variant="outline" className={s.category === 'PRIMARY' ? 'bg-blue/10 text-blue border-blue/20' : s.category === 'JHS' ? 'bg-green/10 text-green border-green/20' : 'bg-purple/10 text-purple border-purple/20'}>
        {s.category === 'PRIMARY' ? 'Primary' : s.category === 'JHS' ? 'JHS' : 'Both'}
      </Badge>
    )},
    { key: 'description', label: 'Description', render: (s: any) => <span className="text-foreground text-sm">{s.description || 'No description'}</span> },
    { key: 'is_active', label: 'Status', render: (s: any) => (
      <Badge variant="outline" className={s.is_active ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}>
        {s.is_active ? 'Active' : 'Inactive'}
      </Badge>
    )},
    { key: 'actions', label: '', render: (s: any) => (
      <div className="flex items-center gap-0.5 flex-wrap justify-start">
        <Button variant="ghost" size="icon" className="h-7 w-7 p-0" title="View Subject" onClick={() => handleViewSubject(s)}><Eye className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 p-0" title="Assign Teacher" onClick={() => handleAssignTeacher(s)}><UserPlus className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 p-0" title="Edit Subject" onClick={() => handleEditSubject(s)}><Edit className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 p-0 text-destructive" title="Delete Subject" onClick={() => handleDeleteSubject(s)} disabled={deleting}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ];

  const handleOpenDialog = () => {
    setForm({ name: '', code: '', category: '', description: '' });
    setFormError(null);
    setShowDialog(true);
  };

  const handleViewSubject = (subject: any) => {
    setSelectedSubject(subject);
    setShowViewDialog(true);
  };

  const handleEditSubject = (subject: any) => {
    setSelectedSubject(subject);
    setForm({
      name: subject.name,
      code: subject.code,
      category: subject.category,
      description: subject.description || '',
    });
    setFormError(null);
    setShowEditDialog(true);
  };

  const handleAssignTeacher = (subject: any) => {
    setSelectedSubject(subject);
    setAssignForm({ class_id: '', teacher_id: '' });
    setShowAssignDialog(true);
  };

  const handleAssignSubmit = async () => {
    setAssigning(true);
    try {
      if (!assignForm.class_id) {
        alert('Please select a class');
        return;
      }
      
      await secureApiClient.post('/schools/class-subjects/', {
        class_instance: assignForm.class_id,
        subject: selectedSubject.id,
        teacher: assignForm.teacher_id === 'none' ? null : assignForm.teacher_id,
      });
      
      setShowAssignDialog(false);
      alert('Subject assigned successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to assign subject');
    } finally {
      setAssigning(false);
    }
  };

  const handleDeleteSubject = async (subject: any) => {
    if (!confirm(`Are you sure you want to delete "${subject.name}"?`)) return;
    
    setDeleting(true);
    try {
      await secureApiClient.delete(`/schools/subjects/${subject.id}/`);
      await fetchSubjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete subject');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateSubject = async () => {
    setUpdating(true);
    setFormError(null);
    
    try {
      if (!form.name || !form.code || !form.category) {
        setFormError('Please fill all required fields (Name, Code, Category).');
        return;
      }
      
      await secureApiClient.put(`/schools/subjects/${selectedSubject.id}/`, form);
      
      setShowEditDialog(false);
      await fetchSubjects();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update subject');
    } finally {
      setUpdating(false);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateSubject = async () => {
    setCreating(true);
    setFormError(null);
    
    try {
      if (!form.name || !form.code || !form.category) {
        setFormError('Please fill all required fields (Name, Code, Category).');
        return;
      }
      
      await secureApiClient.post('/schools/subjects/', form);
      
      setShowDialog(false);
      await fetchSubjects();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create subject');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Subjects Management" 
        description="Manage subjects and curriculum"
        actionLabel="Add Subject"
        onAction={handleOpenDialog}
      />
      
      {loading ? (
        <div className="bg-muted/50 rounded-lg p-8 text-center text-foreground/60">Loading subjects...</div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">{error}</div>
      ) : (
        <DataTable columns={columns} data={Array.isArray(subjects) ? subjects : []} searchKey="name" searchPlaceholder="Search subjects..." />
      )}

      {/* Add Subject Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="professional-dialog">
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription>
              Create a new subject for the curriculum. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject Name *</label>
                <Input value={form.name} onChange={e => handleFormChange('name', e.target.value)} placeholder="e.g., Mathematics" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject Code *</label>
                <Input value={form.code} onChange={e => handleFormChange('code', e.target.value)} placeholder="e.g., MATH" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <Select value={form.category} onValueChange={value => handleFormChange('category', value)}>
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue placeholder="Select Category" className="text-foreground" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="PRIMARY" className="text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                    Primary (Basic 1-6)
                  </SelectItem>
                  <SelectItem value="JHS" className="text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                    Junior High School (Basic 7-9)
                  </SelectItem>
                  <SelectItem value="BOTH" className="text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                    Both Primary and JHS
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input value={form.description} onChange={e => handleFormChange('description', e.target.value)} placeholder="Subject description (optional)" />
            </div>
            {formError && <div className="text-destructive text-sm">{formError}</div>}
          </div>
          <DialogFooter>
            <Button onClick={handleCreateSubject} disabled={creating}>
              {creating ? 'Creating...' : 'Add Subject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Subject Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="professional-dialog">
          <DialogHeader>
            <DialogTitle>Subject Details</DialogTitle>
          </DialogHeader>
          {selectedSubject && (
            <div className="space-y-4 py-2">
              <div><strong>Name:</strong> {selectedSubject.name}</div>
              <div><strong>Code:</strong> {selectedSubject.code}</div>
              <div><strong>Category:</strong> {selectedSubject.category === 'PRIMARY' ? 'Primary (Basic 1-6)' : selectedSubject.category === 'JHS' ? 'Junior High School (Basic 7-9)' : 'Both Primary and JHS'}</div>
              <div><strong>Description:</strong> {selectedSubject.description || 'No description'}</div>
              <div><strong>Status:</strong> {selectedSubject.is_active ? 'Active' : 'Inactive'}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="professional-dialog">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Update subject information. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject Name *</label>
                <Input value={form.name} onChange={e => handleFormChange('name', e.target.value)} placeholder="e.g., Mathematics" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject Code *</label>
                <Input value={form.code} onChange={e => handleFormChange('code', e.target.value)} placeholder="e.g., MATH" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <Select value={form.category} onValueChange={value => handleFormChange('category', value)}>
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue placeholder="Select Category" className="text-foreground" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="PRIMARY" className="text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                    Primary (Basic 1-6)
                  </SelectItem>
                  <SelectItem value="JHS" className="text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                    Junior High School (Basic 7-9)
                  </SelectItem>
                  <SelectItem value="BOTH" className="text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                    Both Primary and JHS
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input value={form.description} onChange={e => handleFormChange('description', e.target.value)} placeholder="Subject description (optional)" />
            </div>
            {formError && <div className="text-destructive text-sm">{formError}</div>}
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateSubject} disabled={updating}>
              {updating ? 'Updating...' : 'Update Subject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Teacher Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="professional-dialog">
          <DialogHeader>
            <DialogTitle>Assign Subject to Class</DialogTitle>
            <DialogDescription>
              Assign "{selectedSubject?.name}" to a class and optionally assign a teacher.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-1">Class *</label>
              <Select value={assignForm.class_id} onValueChange={value => setAssignForm(prev => ({...prev, class_id: value}))}>
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  {Array.isArray(classes) && classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()} className="text-foreground hover:bg-accent hover:text-accent-foreground">
                      {cls.full_name || `${cls.level} ${cls.section || ''}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teacher (Optional)</label>
              <Select value={assignForm.teacher_id} onValueChange={value => setAssignForm(prev => ({...prev, teacher_id: value}))}>
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue placeholder="Select Teacher (Optional)" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="none" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                    No Teacher Assigned
                  </SelectItem>
                  {Array.isArray(teachers) && teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.user_id?.toString() || teacher.id.toString()} className="text-foreground hover:bg-accent hover:text-accent-foreground">
                      {teacher.full_name || `${teacher.first_name} ${teacher.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAssignSubmit} disabled={assigning}>
              {assigning ? 'Assigning...' : 'Assign Subject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubjectsManagement;
