
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
// Class level choices (should match backend LEVEL_CHOICES)
const LEVEL_CHOICES = [
  { value: 'BASIC_1', label: 'Basic 1' },
  { value: 'BASIC_2', label: 'Basic 2' },
  { value: 'BASIC_3', label: 'Basic 3' },
  { value: 'BASIC_4', label: 'Basic 4' },
  { value: 'BASIC_5', label: 'Basic 5' },
  { value: 'BASIC_6', label: 'Basic 6' },
  { value: 'BASIC_7', label: 'Basic 7 (JHS 1)' },
  { value: 'BASIC_8', label: 'Basic 8 (JHS 2)' },
  { value: 'BASIC_9', label: 'Basic 9 (JHS 3)' },
];
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Users, Trash2, Loader2, UserPlus, UserMinus } from 'lucide-react';
import secureApiClient from '@/lib/secureApiClient';

interface ClassData {
  id: number;
  level: string;
  section: string;
  class_teacher: string;
  class_teacher_id?: number;
  students_count: number;
  capacity: number;
  subjects_count: number;
}

const columns = [
  { key: 'level', label: 'Level', render: (c: ClassData) => <span className="font-medium text-foreground">{c.level}</span> },
  { key: 'section', label: 'Section', render: (c: ClassData) => <Badge variant="outline">{c.section}</Badge> },
  { key: 'class_teacher', label: 'Class Teacher', render: (c: ClassData) => (
    <span className={`text-muted-foreground ${c.class_teacher === 'Not Assigned' ? 'italic' : ''}`}>
      {c.class_teacher}
    </span>
  )},
  { key: 'students_count', label: 'Students', render: (c: ClassData) => (
    <div className="flex items-center gap-2">
      <span className="text-foreground">{c.students_count}/{c.capacity}</span>
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-secondary rounded-full" style={{ width: `${(c.students_count / c.capacity) * 100}%` }} />
      </div>
    </div>
  )},
  { key: 'subjects_count', label: 'Subjects', render: (c: ClassData) => <span className="text-foreground">{c.subjects_count}</span> },
];


const ClassesManagement = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [assigningTeacher, setAssigningTeacher] = useState('');
  const [assigning, setAssigning] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({
    level: '',
    section: '',
    capacity: 30,
    teacher: '',
  });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      let response;
      response = await secureApiClient.get('/schools/classes/');
      const data = (response.results || response) as any[];
      console.log('Raw classes data:', data); // Debug log
      
      const mappedClasses = data.map((c: any) => {
        console.log('Mapping class:', c); // Debug log
        return {
          id: c.id,
          level: c.level_display || c.level || '',
          section: c.section || '',
          class_teacher: c.class_teacher_name || (c.class_teacher ? 'Unknown Teacher' : 'Not Assigned'),
          class_teacher_id: c.class_teacher,
          students_count: c.students_count ?? c.student_count ?? 0,
          capacity: c.capacity ?? 0,
          subjects_count: c.subjects_count ?? (c.subjects ? c.subjects.length : 0),
        };
      });
      
      console.log('Mapped classes:', mappedClasses); // Debug log
      setClasses(mappedClasses);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Calculate summary stats
  const totalClasses = classes.length;
  const totalStudents = classes.reduce((sum, c) => sum + c.students_count, 0);
  const avgCapacity = totalClasses > 0 ? Math.round((classes.reduce((sum, c) => sum + (c.students_count / (c.capacity || 1)), 0) / totalClasses) * 100) : 0;


  const fetchTeachers = async () => {
    setTeachersLoading(true);
    try {
      const response = await secureApiClient.get('/teachers/');
      setTeachers(response);
      setTeachersError(null);
    } catch (err: any) {
      setTeachersError(err.message || 'Failed to load teachers');
    } finally {
      setTeachersLoading(false);
    }
  };

  const handleAssignTeacher = (classData: ClassData) => {
    setSelectedClass(classData);
    setAssigningTeacher(classData.class_teacher_id?.toString() || '');
    setShowAssignDialog(true);
    fetchTeachers();
  };

  const handleUnassignTeacher = async (classData: ClassData) => {
    setAssigning(true);
    try {
      await secureApiClient.post(`/schools/classes/${classData.id}/assign_teacher/`, {
        teacher_user_id: null
      });
      toast({ title: 'Success', description: 'Teacher unassigned successfully' });
      setClasses([]);
      await fetchClasses();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to unassign teacher', variant: 'destructive' });
    } finally {
      setAssigning(false);
    }
  };

  const handleSaveAssignment = async () => {
    if (!selectedClass || !assigningTeacher) return;
    
    setAssigning(true);
    try {
      await secureApiClient.post(`/schools/classes/${selectedClass.id}/assign_teacher/`, {
        teacher_user_id: parseInt(assigningTeacher)
      });
      toast({ title: 'Success', description: 'Teacher assigned successfully' });
      setShowAssignDialog(false);
      setClasses([]);
      await fetchClasses();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to assign teacher', variant: 'destructive' });
    } finally {
      setAssigning(false);
    }
  };

  const handleOpenDialog = () => {
    setForm({ level: '', section: '', capacity: 30 });
    setFormError(null);
    setShowDialog(true);
    fetchTeachers();
  };

  const handleFormChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeleteClass = async (classData: ClassData) => {
    if (!confirm(`Are you sure you want to delete ${classData.level} ${classData.section}?`)) return;
    try {
      await secureApiClient.delete(`/schools/classes/${classData.id}/`);
      toast({ title: 'Success', description: 'Class deleted successfully' });
      await fetchClasses();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete class', variant: 'destructive' });
    }
  };

  const handleCreateClass = async () => {
    setCreating(true);
    setFormError(null);
    try {
      if (!form.level) {
        setFormError('Please select a class level.');
        setCreating(false);
        return;
      }
      const payload: any = {
        level: form.level,
        section: form.section,
        capacity: form.capacity,
      };
      if (form.teacher) {
        payload.class_teacher = parseInt(form.teacher);
      }
      await secureApiClient.post('/schools/classes/', payload);
      setShowDialog(false);
      await fetchClasses();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Classes Management" description="Manage classes, sections, and enrollments" actionLabel="Add Class" onAction={handleOpenDialog} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative group rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-lg hover:scale-[1.02] transition-all duration-200 overflow-hidden text-center">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -top-5 -right-5 w-16 h-16 bg-blue-500/10 rounded-full blur-xl opacity-60" />
          <div className="relative"><p className="text-2xl font-bold text-foreground">{totalClasses}</p><p className="text-sm text-muted-foreground">Total Classes</p></div>
        </div>
        <div className="relative group rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 shadow-lg hover:scale-[1.02] transition-all duration-200 overflow-hidden text-center">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-violet-400 opacity-60 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -top-5 -right-5 w-16 h-16 bg-purple-500/10 rounded-full blur-xl opacity-60" />
          <div className="relative"><p className="text-2xl font-bold text-foreground">{totalStudents}</p><p className="text-sm text-muted-foreground">Total Students</p></div>
        </div>
        <div className="relative group rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-lg hover:scale-[1.02] transition-all duration-200 overflow-hidden text-center">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-60 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -top-5 -right-5 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl opacity-60" />
          <div className="relative"><p className="text-2xl font-bold text-success">{avgCapacity}%</p><p className="text-sm text-muted-foreground">Avg Capacity</p></div>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">{error}</div>
      ) : (
        <DataTable 
          key={classes.length + classes.map(c => `${c.id}-${c.class_teacher_id || 'none'}`).join(',')}
          columns={[
            ...columns,
            { 
              key: 'actions', 
              label: 'Actions', 
              render: (c: ClassData) => (
                <div className="flex items-center gap-1">
                  {c.class_teacher_id ? (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-orange-600" 
                      title="Unassign Teacher"
                      onClick={() => handleUnassignTeacher(c)}
                      disabled={assigning}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-green-600" 
                      title="Assign Teacher"
                      onClick={() => handleAssignTeacher(c)}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Users className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteClass(c)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              )
            }
          ]} 
          data={classes} 
          searchKey="level" 
          searchPlaceholder="Search classes..." 
        />
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-1">Class Level</label>
              <Select value={form.level} onValueChange={v => handleFormChange('level', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_CHOICES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <Input value={form.section} onChange={e => handleFormChange('section', e.target.value)} placeholder="e.g. A, B, Gold" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Capacity</label>
              <Input type="number" min={1} max={100} value={form.capacity} onChange={e => handleFormChange('capacity', Number(e.target.value))} />
            </div>
            {formError && <div className="text-destructive text-sm">{formError}</div>}
          </div>
          <DialogFooter>
            <Button onClick={handleCreateClass} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Class
            </Button>
            <div>
              <label className="block text-sm font-medium mb-1">Class Teacher</label>
              <Select value={form.teacher} onValueChange={v => handleFormChange('teacher', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={teachersLoading ? 'Loading teachers...' : 'Select teacher'} />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.user_id.toString()}>{t.first_name} {t.last_name} ({t.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {teachersError && <div className="text-destructive text-xs mt-1">{teachersError}</div>}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Teacher Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Teacher to {selectedClass?.level} {selectedClass?.section}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-1">Select Teacher</label>
              <Select value={assigningTeacher} onValueChange={setAssigningTeacher}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={teachersLoading ? 'Loading teachers...' : 'Select teacher'} />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.user_id.toString()}>
                      {t.first_name} {t.last_name} ({t.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {teachersError && <div className="text-destructive text-xs mt-1">{teachersError}</div>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveAssignment} disabled={assigning || !assigningTeacher}>
              {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Assign Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassesManagement;
