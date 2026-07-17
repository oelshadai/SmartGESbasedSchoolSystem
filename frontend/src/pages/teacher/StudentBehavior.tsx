import { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Edit, Plus, Loader2 } from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';

interface BehaviorRecord {
  id: number;
  student: number;
  student_name: string;
  term: number;
  term_name: string;
  conduct: string;
  attitude: string;
  interest: string;
  punctuality: string;
  class_teacher_remarks: string;
  promoted_to: string;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: number;
  student_id: string;
  full_name: string;
  current_class: number;
  class_name: string;
}

interface ActiveTerm {
  id: number;
  name: string;
  academic_year_name: string;
}

interface BehaviorChoices {
  conduct_choices: [string, string][];
  attitude_choices: [string, string][];
  interest_choices: [string, string][];
  teacher_remarks_templates: string[];
}

const typeColors: Record<string, string> = {
  EXCELLENT: 'bg-green-100 text-green-800',
  VERY_GOOD: 'bg-blue-100 text-blue-800',
  GOOD: 'bg-emerald-100 text-emerald-800',
  SATISFACTORY: 'bg-yellow-100 text-yellow-800',
  NEEDS_IMPROVEMENT: 'bg-red-100 text-red-800',
};

const StudentBehavior = () => {
  const [records, setRecords] = useState<BehaviorRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeTerm, setActiveTerm] = useState<ActiveTerm | null>(null);
  const [choices, setChoices] = useState<BehaviorChoices | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BehaviorRecord | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    student: '',
    conduct: 'GOOD',
    attitude: 'GOOD',
    interest: '',
    punctuality: 'GOOD',
    class_teacher_remarks: '',
    promoted_to: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchBehaviorRecords(),
        fetchStudents(),
        fetchActiveTerm(),
        fetchChoices()
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBehaviorRecords = async () => {
    try {
      const response = await secureApiClient.get('/students/behaviour/');
      const data = Array.isArray(response) ? response : response.results || response.data || [];
      
      // Transform data to include student and term names
      const transformedData = data.map((record: any) => ({
        ...record,
        student_name: record.student_name || record.student?.full_name || `Student ${record.student}`,
        term_name: record.term_name || record.term?.name || `Term ${record.term}`
      }));
      
      setRecords(transformedData);
    } catch (error: any) {
      console.error('Failed to fetch behavior records:', error);
      setRecords([]);
      
      // Don't show error toast for 404 - just means no records exist yet
      if (error.status !== 404) {
        toast({ 
          title: "Error", 
          description: "Failed to load behavior records. Please try again.", 
          variant: "destructive" 
        });
      }
    }
  };

  const fetchStudents = async () => {
    try {
      console.log('Fetching students for behavior page...');
      
      // First try to get teacher's form class assignments
      const response = await secureApiClient.get('/teachers/assignments/');
      const assignments = Array.isArray(response) ? response : response.results || response.data || [];
      console.log('Teacher assignments:', assignments);
      
      // Filter form class assignments (where teacher is class teacher)
      const formClassAssignments = assignments.filter((assignment: any) => assignment.type === 'form_class');
      console.log('Form class assignments:', formClassAssignments);
      
      if (formClassAssignments.length > 0) {
        // Get the first form class ID (teachers usually have one form class)
        const formClassId = formClassAssignments[0].class.id;
        console.log('Fetching students for class ID:', formClassId);
        
        // Fetch students from the teacher's form class
        const studentsResponse = await secureApiClient.get(`/students/?class_id=${formClassId}`);
        console.log('Raw students response:', studentsResponse);
        const studentsData = Array.isArray(studentsResponse) ? studentsResponse : studentsResponse.results || studentsResponse.data || [];
        console.log('Students data:', studentsData);
        
        if (studentsData.length === 0) {
          console.log('No students found for class, trying without class filter...');
          // Try fetching all students as fallback
          const allStudentsResponse = await secureApiClient.get('/students/');
          const allStudentsData = Array.isArray(allStudentsResponse) ? allStudentsResponse : allStudentsResponse.results || allStudentsResponse.data || [];
          console.log('All students fallback:', allStudentsData);
          setStudents(allStudentsData);
        } else {
          setStudents(studentsData);
        }
      } else {
        console.log('No form class assignments found, trying direct student fetch...');
        // Fallback: try to get all students the teacher has access to
        const studentsResponse = await secureApiClient.get('/students/');
        const studentsData = Array.isArray(studentsResponse) ? studentsResponse : studentsResponse.results || studentsResponse.data || [];
        console.log('All students data:', studentsData);
        setStudents(studentsData);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]);
    }
  };

  const fetchActiveTerm = async () => {
    try {
      // Use the current term set by admin in school settings
      const response = await secureApiClient.get('/schools/terms/current/');
      if (response?.id) {
        setActiveTerm({
          id: response.id,
          name: response.name || 'Current Term',
          academic_year_name: response.academic_year_name || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch active term:', error);
    }
  };

  const fetchChoices = async () => {
    try {
      const response = await secureApiClient.get('/students/behaviour/choices/');
      setChoices(response);
    } catch (error) {
      console.error('Failed to fetch choices:', error);
      // Set default choices if API fails
      setChoices({
        conduct_choices: [
          ['EXCELLENT', 'Excellent'],
          ['VERY_GOOD', 'Very Good'],
          ['GOOD', 'Good'],
          ['SATISFACTORY', 'Satisfactory'],
          ['NEEDS_IMPROVEMENT', 'Needs Improvement']
        ],
        attitude_choices: [
          ['EXCELLENT', 'Excellent'],
          ['VERY_GOOD', 'Very Good'],
          ['GOOD', 'Good'],
          ['SATISFACTORY', 'Satisfactory'],
          ['NEEDS_IMPROVEMENT', 'Needs Improvement']
        ],
        interest_choices: [],
        teacher_remarks_templates: [
          "Student has shown remarkable improvement this term.",
          "A well-behaved student with good academic performance.",
          "Student displays positive attitude towards learning."
        ]
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.student) {
      toast({ 
        title: "Error", 
        description: "Please select a student", 
        variant: "destructive" 
      });
      return;
    }
    // Validate required fields for terminal report
    if (!formData.conduct || !formData.attitude || !formData.punctuality) {
      toast({ 
        title: "Error", 
        description: "Please fill in conduct, attitude, and punctuality ratings", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      const submitData: any = {
        ...formData,
        student: parseInt(formData.student),
      };
      if (activeTerm) {
        submitData.term = activeTerm.id;
      }
      
      if (editingRecord) {
        await secureApiClient.put(`/students/behaviour/${editingRecord.id}/`, submitData);
        toast({ title: "Success", description: "Behavior record updated successfully" });
      } else {
        await secureApiClient.post('/students/behaviour/', submitData);
        toast({ title: "Success", description: "Behavior record created successfully" });
      }
      
      await fetchBehaviorRecords();
      resetForm();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save behavior record", 
        variant: "destructive" 
      });
    }
  };

  const resetForm = () => {
    setFormData({
      student: '',
      conduct: 'GOOD',
      attitude: 'GOOD',
      interest: '',
      punctuality: 'GOOD',
      class_teacher_remarks: '',
      promoted_to: ''
    });
    setEditingRecord(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (record: BehaviorRecord) => {
    setEditingRecord(record);
    setFormData({
      student: record.student.toString(),
      conduct: record.conduct,
      attitude: record.attitude,
      interest: record.interest,
      punctuality: record.punctuality,
      class_teacher_remarks: record.class_teacher_remarks,
      promoted_to: record.promoted_to
    });
    setIsDialogOpen(true);
  };

  const useTemplate = (template: string) => {
    setFormData(prev => ({ ...prev, class_teacher_remarks: template }));
  };

  const columns = [
    { 
      key: 'created_at', 
      label: 'Date', 
      render: (r: BehaviorRecord) => (
        <span className="text-muted-foreground text-xs">
          {new Date(r.created_at).toLocaleDateString()}
        </span>
      )
    },
    { 
      key: 'student_name', 
      label: 'Student', 
      render: (r: BehaviorRecord) => (
        <span className="font-medium text-foreground">{r.student_name}</span>
      )
    },
    { 
      key: 'conduct', 
      label: 'Conduct', 
      render: (r: BehaviorRecord) => (
        <Badge variant="outline" className={typeColors[r.conduct]}>
          {r.conduct.replace('_', ' ')}
        </Badge>
      )
    },
    { 
      key: 'attitude', 
      label: 'Attitude', 
      render: (r: BehaviorRecord) => (
        <Badge variant="outline" className={typeColors[r.attitude]}>
          {r.attitude.replace('_', ' ')}
        </Badge>
      )
    },
    { 
      key: 'punctuality', 
      label: 'Punctuality', 
      render: (r: BehaviorRecord) => (
        <Badge variant="outline" className={typeColors[r.punctuality] || typeColors['GOOD']}>
          {r.punctuality?.replace('_', ' ') || 'Good'}
        </Badge>
      )
    },
    { 
      key: 'interest', 
      label: 'Interest', 
      render: (r: BehaviorRecord) => (
        <span className="text-xs text-muted-foreground">
          {r.interest ? r.interest.replace('_', ' ') : 'Not specified'}
        </span>
      )
    },
    { 
      key: 'class_teacher_remarks', 
      label: 'Remarks', 
      render: (r: BehaviorRecord) => (
        <span className="text-sm text-foreground max-w-xs truncate block">
          {r.class_teacher_remarks || 'No remarks'}
        </span>
      )
    },
    { 
      key: 'actions', 
      label: '', 
      render: (r: BehaviorRecord) => (
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => handleEdit(r)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Student Behavior" 
        description="Record and track student behavior and conduct for terminal reports"
      />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{records.length}</p>
              <p className="text-sm text-muted-foreground">Total Records</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {records.filter(r => r.conduct === 'EXCELLENT' || r.conduct === 'VERY_GOOD').length}
              </p>
              <p className="text-sm text-muted-foreground">Excellent/Very Good</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {records.filter(r => r.conduct === 'NEEDS_IMPROVEMENT').length}
              </p>
              <p className="text-sm text-muted-foreground">Needs Improvement</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{students.length}</p>
              <p className="text-sm text-muted-foreground">Your Students</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Record Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => resetForm()}
              disabled={students.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Behavior Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRecord ? 'Edit Behavior Record' : 'Add Behavior Record'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Active term banner */}
              {activeTerm && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 text-sm">
                  <span className="text-muted-foreground">Term:</span>
                  <span className="font-medium">{activeTerm.name}</span>
                  <span className="text-muted-foreground">— {activeTerm.academic_year_name}</span>
                </div>
              )}

              <div>
                <Label htmlFor="student">Student</Label>
                {students.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 border rounded-md">
                    No students found in your form class. Only class teachers can record behavior for their assigned students.
                  </div>
                ) : (
                  <Select 
                    value={formData.student} 
                    onValueChange={(value) => setFormData({...formData, student: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select student from your form class" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{student.full_name}</span>
                            <span className="text-xs text-muted-foreground ml-2">({student.student_id})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="conduct">Conduct</Label>
                  <Select 
                    value={formData.conduct} 
                    onValueChange={(value) => setFormData({...formData, conduct: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {choices?.conduct_choices.map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="attitude">Attitude</Label>
                  <Select 
                    value={formData.attitude} 
                    onValueChange={(value) => setFormData({...formData, attitude: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {choices?.attitude_choices.map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="punctuality">Punctuality</Label>
                  <Select 
                    value={formData.punctuality} 
                    onValueChange={(value) => setFormData({...formData, punctuality: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {choices?.conduct_choices.map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="interest">Student Interests</Label>
                <Select 
                  value={formData.interest} 
                  onValueChange={(value) => setFormData({...formData, interest: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student interests" />
                  </SelectTrigger>
                  <SelectContent>
                    {choices?.interest_choices && choices.interest_choices.length > 0 ? (
                      choices.interest_choices.map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="READING_WRITING">Reading, Writing</SelectItem>
                        <SelectItem value="MATHEMATICS_SCIENCE">Mathematics, Science</SelectItem>
                        <SelectItem value="SPORTS_GAMES">Sports, Games</SelectItem>
                        <SelectItem value="ARTS_CRAFTS">Arts, Crafts</SelectItem>
                        <SelectItem value="MUSIC_DANCING">Music, Dancing</SelectItem>
                        <SelectItem value="TECHNOLOGY_COMPUTERS">Technology, Computers</SelectItem>
                        <SelectItem value="SOCIAL_ACTIVITIES">Social Activities</SelectItem>
                        <SelectItem value="LEADERSHIP_ACTIVITIES">Leadership Activities</SelectItem>
                        <SelectItem value="VARIED_INTERESTS">Varied Interests</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  This will appear in the terminal report under "Interest" section
                </p>
              </div>
              
              <div>
                <Label htmlFor="promoted_to">Promoted To (Next Class)</Label>
                <Input
                  id="promoted_to"
                  value={formData.promoted_to}
                  onChange={(e) => setFormData({...formData, promoted_to: e.target.value})}
                  placeholder="e.g., Basic 8A"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Only fill this for terminal (third term) reports
                </p>
              </div>
              
              <div>
                <Label htmlFor="class_teacher_remarks">Class Teacher Remarks</Label>
                <Textarea
                  id="class_teacher_remarks"
                  value={formData.class_teacher_remarks}
                  onChange={(e) => setFormData({...formData, class_teacher_remarks: e.target.value})}
                  placeholder="Enter teacher remarks about the student's behavior, attitude, and overall performance..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  These remarks will appear on the terminal report card
                </p>
                
                {choices?.teacher_remarks_templates && (
                  <div className="mt-2">
                    <Label className="text-sm text-muted-foreground">Quick Templates:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {choices.teacher_remarks_templates.slice(0, 3).map((template, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => useTemplate(template)}
                        >
                          Template {index + 1}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={students.length === 0 || !formData.student}
                >
                  {editingRecord ? 'Update' : 'Create'} Record
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
      </div>

      {/* No Students Message */}
      {students.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No students found in your form class.</p>
          <p className="text-sm">Only class teachers can record behavior for their assigned students.</p>
        </div>
      )}

      {/* Records Table */}
      <DataTable 
        columns={columns} 
        data={records} 
        searchKey="student_name" 
        searchPlaceholder="Search students..." 
      />
    </div>
  );
};

export default StudentBehavior;
