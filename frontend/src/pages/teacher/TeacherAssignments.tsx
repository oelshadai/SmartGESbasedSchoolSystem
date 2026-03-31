import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Clock, FileText, Users, Calendar, Loader2, Eye, Edit, Trash2, Copy, MoreHorizontal } from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Assignment {
  id: number;
  title: string;
  description: string;
  assignment_type: string;
  due_date: string;
  status: string;
  max_score: number;
  class_name: string;
  created_at: string;
  updated_at: string;
}

interface ClassAssignment {
  id: string;
  type: 'form_class' | 'subject_class';
  class: {
    id: number;
    name: string;
    level: string;
    section: string;
  };
  subject?: {
    id: number;
    name: string;
  };
  assignment_count: number;
}

const statusColors: Record<string, string> = {
  PUBLISHED: 'bg-success/10 text-success border-success/20',
  DRAFT: 'bg-muted text-muted-foreground border-border',
  CLOSED: 'bg-destructive/10 text-destructive border-destructive/20',
};

const typeIcons: Record<string, React.ReactNode> = {
  QUIZ: <Clock className="h-4 w-4" />,
  HOMEWORK: <FileText className="h-4 w-4" />,
  PROJECT: <FileText className="h-4 w-4" />,
};

const TeacherAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassAssignment[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [createdAssignmentId, setCreatedAssignmentId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    assignment_type: 'HOMEWORK',
    class_instance: '',
    due_date: '',
    max_score: 10,
    max_attempts: 1,
    time_limit: null as number | null,
    is_timed: false,
    auto_grade: false,
    allow_file_submission: true,
    allow_text_submission: true,
    allow_review: true,
    review_available_after: 'GRADED',
    has_mcq_questions: false,
    has_short_answer_questions: false
  });
  const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedClass !== 'all') {
      fetchClassAssignments();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await secureApiClient.get('/teachers/assignments/');
      setClasses(response || []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await secureApiClient.get('/assignments/teacher/');
      setAssignments(response.results || []);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassAssignments = async () => {
    try {
      setLoading(true);
      const response = await secureApiClient.get(`/assignments/teacher/dashboard/?class_id=${selectedClass}`);
      setAssignments(response.assignments || []);
    } catch (error) {
      console.error('Failed to fetch class assignments:', error);
      toast.error('Failed to load class assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = () => {
    setIsCreateDialogOpen(true);
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.class_instance) {
      toast.error('Please select a class');
      return;
    }
    
    if (!formData.instructions) {
      toast.error('Please provide instructions');
      return;
    }
    
    // Type-specific validation
    if (formData.assignment_type === 'QUIZ' || formData.assignment_type === 'EXAM') {
      if (!formData.time_limit) {
        toast.error(`${formData.assignment_type} requires a time limit`);
        return;
      }
    }
    
    console.log('Submitting assignment with data:', formData);
    
    try {
      const response = await secureApiClient.post('/assignments/teacher/create_draft/', formData);
      console.log('Assignment created:', response);
      setCreatedAssignmentId(response.id);
      
      // Handle different assignment types
      if (formData.assignment_type === 'QUIZ' || formData.assignment_type === 'EXAM') {
        // Quiz/Exam: Go to questions step
        toast.success(`${formData.assignment_type} draft created - Add questions to continue`);
        setCurrentStep(2);
      } else if (formData.assignment_type === 'HOMEWORK' || formData.assignment_type === 'EXERCISE') {
        // Homework/Exercise: Publish immediately
        try {
          await secureApiClient.post(`/assignments/teacher/${response.id}/publish_assignment/`);
          toast.success(`${formData.assignment_type} published successfully`);
          setIsCreateDialogOpen(false);
          resetForm();
          fetchAssignments();
        } catch (publishError: any) {
          console.error('Failed to publish:', publishError);
          toast.error('Assignment created as draft. You can publish it from the list.');
          setIsCreateDialogOpen(false);
          resetForm();
          fetchAssignments();
        }
      } else if (formData.assignment_type === 'PROJECT') {
        // Project: Save as draft for teacher to add detailed instructions
        toast.success('Project assignment created as draft. You can add more details and publish from the list.');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchAssignments();
      } else {
        // Default: Publish immediately
        try {
          await secureApiClient.post(`/assignments/teacher/${response.id}/publish_assignment/`);
          toast.success('Assignment published successfully');
          setIsCreateDialogOpen(false);
          resetForm();
          fetchAssignments();
        } catch (publishError: any) {
          toast.error('Assignment created as draft. You can publish it from the list.');
          setIsCreateDialogOpen(false);
          resetForm();
          fetchAssignments();
        }
      }
    } catch (error: any) {
      console.error('Failed to create assignment:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to create assignment';
      toast.error(errorMsg);
    }
  };

  const handleAddQuestion = async (questionData: any) => {
    if (!createdAssignmentId) return;
    
    try {
      const response = await secureApiClient.post(`/assignments/teacher/${createdAssignmentId}/add-question/`, questionData);
      setQuestions(prev => [...prev, { ...questionData, id: response.question_id }]);
      toast.success(`Question added (${response.total_questions} total, ${response.total_points} pts)`);
    } catch (error: any) {
      console.error('Failed to add question:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to save question to server';
      toast.error(`Question NOT saved: ${errorMsg}`);
      throw error; // re-throw so QuestionCreator knows not to reset the form
    }
  };

  const handlePublishAssignment = async () => {
    if (!createdAssignmentId) return;
    
    // Verify questions were actually saved to DB (avoid stale React state)
    let savedQuestions: any[] = [];
    try {
      const questionsResponse = await secureApiClient.get(`/assignments/teacher/${createdAssignmentId}/questions/`);
      savedQuestions = Array.isArray(questionsResponse) ? questionsResponse : [];
    } catch {
      toast.error('Could not verify questions. Please try again.');
      return;
    }

    if (savedQuestions.length === 0) {
      toast.error('No questions saved yet. Add at least one question before publishing.');
      return;
    }

    try {
      const response = await secureApiClient.post(`/assignments/teacher/${createdAssignmentId}/publish_assignment/`);
      toast.success(response.message || `Published with ${savedQuestions.length} question(s)`);
      setIsCreateDialogOpen(false);
      resetForm();
      fetchAssignments();
    } catch (error: any) {
      console.error('Publish failed:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to publish assignment';
      toast.error(errorMsg);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      instructions: '',
      assignment_type: 'HOMEWORK',
      class_instance: '',
      due_date: '',
      max_score: 10,
      max_attempts: 1,
      time_limit: null,
      is_timed: false,
      auto_grade: false,
      allow_file_submission: true,
      allow_text_submission: true,
      allow_review: true,
      review_available_after: 'GRADED',
      has_mcq_questions: false,
      has_short_answer_questions: false
    });
    setCurrentStep(1);
    setCreatedAssignmentId(null);
    setQuestions([]);
  };

  const handleViewSubmissions = (assignmentId: number) => {
    navigate(`/teacher/assignments/${assignmentId}/submissions`);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    // Navigate to edit assignment or open edit dialog
    navigate(`/teacher/assignments/${assignment.id}/edit`);
  };

  const handlePublishDraftAssignment = async (assignmentId: number) => {
    try {
      console.log(`Publishing assignment ${assignmentId}...`);
      
      const response = await secureApiClient.post(`/assignments/teacher/${assignmentId}/publish_assignment/`);
      
      console.log('Publish response:', response);
      toast.success(response.message || 'Assignment published successfully');
      
      // Force refresh to get updated status
      await fetchAssignments();
    } catch (error: any) {
      console.error('Failed to publish assignment:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = 'Failed to publish assignment';
      
      if (error.response?.status === 404) {
        errorMessage = 'Assignment not found or endpoint not available';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Permission denied. You can only publish your own assignments.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAssignments.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedAssignments.length} assignment(s)? This action cannot be undone.`)) return;
    
    try {
      await Promise.all(
        selectedAssignments.map(id => secureApiClient.delete(`/assignments/teacher/${id}/`))
      );
      toast.success(`${selectedAssignments.length} assignment(s) deleted successfully`);
      setSelectedAssignments([]);
      fetchAssignments();
    } catch (error: any) {
      console.error('Failed to delete assignments:', error);
      toast.error('Failed to delete some assignments');
    }
  };

  const handleBulkPublish = async () => {
    if (selectedAssignments.length === 0) return;
    
    try {
      await Promise.all(
        selectedAssignments.map(id => secureApiClient.post(`/assignments/teacher/${id}/publish_assignment/`))
      );
      toast.success(`${selectedAssignments.length} assignment(s) published successfully`);
      setSelectedAssignments([]);
      fetchAssignments();
    } catch (error: any) {
      console.error('Failed to publish assignments:', error);
      toast.error('Failed to publish some assignments');
    }
  };

  const toggleAssignmentSelection = (assignmentId: number) => {
    setSelectedAssignments(prev => 
      prev.includes(assignmentId) 
        ? prev.filter(id => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  const handleDuplicateAssignment = async (assignment: Assignment) => {
    try {
      const duplicateData = {
        title: `${assignment.title} (Copy)`,
        description: assignment.description,
        assignment_type: assignment.assignment_type,
        class_instance: '1', // Will need to get proper class ID
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        max_score: assignment.max_score,
        instructions: 'Duplicated assignment - please review and update as needed'
      };
      
      await secureApiClient.post('/assignments/teacher/create_draft/', duplicateData);
      toast.success('Assignment duplicated successfully');
      fetchAssignments();
    } catch (error: any) {
      console.error('Failed to duplicate assignment:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message || 'Failed to duplicate assignment';
      toast.error(errorMessage);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) return;
    
    try {
      await secureApiClient.delete(`/assignments/teacher/${assignmentId}/`);
      toast.success('Assignment deleted successfully');
      fetchAssignments();
    } catch (error: any) {
      console.error('Failed to delete assignment:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete assignment';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading assignments...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
          <p className="text-muted-foreground mt-1">Create and manage assignments for your classes</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateAssignment}>
              <Plus className="h-4 w-4 mr-2" />
              New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {currentStep === 1 ? 'Create New Assignment' : 'Add Questions'}
              </DialogTitle>
            </DialogHeader>
            
            {currentStep === 1 ? (
              <form onSubmit={handleSubmitAssignment} className="space-y-4">
                {/* Assignment Type Info */}
                {formData.assignment_type && (
                  <div className="bg-muted/50 border border-border rounded-lg p-3 text-sm">
                    <p className="font-medium mb-1">
                      {formData.assignment_type === 'HOMEWORK' && '📝 Homework: Regular assignments with file/text submissions'}
                      {formData.assignment_type === 'QUIZ' && '⏱️ Quiz: Timed assessment with auto-graded questions'}
                      {formData.assignment_type === 'PROJECT' && '🎯 Project: Long-term work with detailed requirements'}
                      {formData.assignment_type === 'EXAM' && '📋 Exam: Formal timed assessment (1 attempt only)'}
                      {formData.assignment_type === 'EXERCISE' && '✏️ Exercise: Practice work for skill building'}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formData.assignment_type === 'HOMEWORK' && 'Students can submit files and text. Multiple attempts allowed.'}
                      {formData.assignment_type === 'QUIZ' && 'Requires questions. Auto-graded. Time-limited. Multiple attempts allowed.'}
                      {formData.assignment_type === 'PROJECT' && 'Saved as draft for you to add detailed instructions before publishing.'}
                      {formData.assignment_type === 'EXAM' && 'Requires questions. Auto-graded. Time-limited. Single attempt only.'}
                      {formData.assignment_type === 'EXERCISE' && 'Quick practice assignments. Can be submitted multiple times.'}
                    </p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                    rows={3}
                    placeholder="Detailed instructions for students..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select value={formData.assignment_type} onValueChange={(value) => {
                      setFormData({
                        ...formData, 
                        assignment_type: value,
                        is_timed: value === 'QUIZ' || value === 'EXAM',
                        auto_grade: value === 'QUIZ' || value === 'EXAM',
                        max_attempts: value === 'EXAM' ? 1 : (value === 'QUIZ' ? 3 : 1),
                        time_limit: value === 'QUIZ' ? 30 : (value === 'EXAM' ? 60 : null)
                      });
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOMEWORK">Homework - Regular assignments</SelectItem>
                        <SelectItem value="QUIZ">Quiz - Timed with questions</SelectItem>
                        <SelectItem value="PROJECT">Project - Long-term work</SelectItem>
                        <SelectItem value="EXAM">Exam - Formal assessment</SelectItem>
                        <SelectItem value="EXERCISE">Exercise - Practice work</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="max_attempts">Max Attempts</Label>
                    <Input
                      id="max_attempts"
                      type="number"
                      min="1"
                      value={formData.max_attempts}
                      onChange={(e) => setFormData({...formData, max_attempts: parseInt(e.target.value)})}
                      disabled={formData.assignment_type === 'EXAM'}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.assignment_type === 'EXAM' ? 'Exams allow only 1 attempt' : 
                       formData.assignment_type === 'QUIZ' ? 'Recommended: 2-3 attempts' :
                       'Number of times students can submit'}
                    </p>
                  </div>
                </div>
                
                {(formData.assignment_type === 'QUIZ' || formData.assignment_type === 'EXAM') && (
                  <div>
                    <Label htmlFor="time_limit">Time Limit (minutes) *</Label>
                    <Input
                      id="time_limit"
                      type="number"
                      min="1"
                      value={formData.time_limit || ''}
                      onChange={(e) => setFormData({...formData, time_limit: parseInt(e.target.value) || null})}
                      placeholder="Enter time limit in minutes"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.assignment_type === 'QUIZ' ? 'Typical: 15-45 minutes' : 'Typical: 60-120 minutes'}
                    </p>
                  </div>
                )}
                <div>
                  <Label htmlFor="class">Class *</Label>
                  <Select value={formData.class_instance} onValueChange={(value) => setFormData({...formData, class_instance: value})} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.length === 0 ? (
                        <SelectItem value="" disabled>No classes assigned</SelectItem>
                      ) : (
                        classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.class.id.toString()}>
                            {cls.class.name} {cls.subject ? `- ${cls.subject.name}` : '(Form Class)'}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="datetime-local"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_score">Max Score</Label>
                    <Input
                      id="max_score"
                      type="number"
                      min="1"
                      value={formData.max_score}
                      onChange={(e) => setFormData({...formData, max_score: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </div>

                {/* Quiz Question Types - Only for QUIZ/EXAM */}
                {(formData.assignment_type === 'QUIZ' || formData.assignment_type === 'EXAM') && (
                  <div className="border rounded-lg p-4 space-y-3 bg-blue-50/50 border-blue-200">
                    <h4 className="font-semibold text-sm">Question Types</h4>
                    <p className="text-sm text-muted-foreground">
                      Select what types of questions this quiz will contain. This affects how and when results are shown to students.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has_mcq"
                          checked={formData.has_mcq_questions}
                          onCheckedChange={(checked) => setFormData({...formData, has_mcq_questions: checked as boolean})}
                        />
                        <Label htmlFor="has_mcq" className="font-normal cursor-pointer">
                          <div className="font-medium">Multiple Choice Questions</div>
                          <div className="text-xs text-muted-foreground">Auto-graded immediately</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has_short_answer"
                          checked={formData.has_short_answer_questions}
                          onCheckedChange={(checked) => setFormData({...formData, has_short_answer_questions: checked as boolean})}
                        />
                        <Label htmlFor="has_short_answer" className="font-normal cursor-pointer">
                          <div className="font-medium">Short Answer Questions</div>
                          <div className="text-xs text-muted-foreground">You grade these manually</div>
                        </Label>
                      </div>
                    </div>
                    
                    {/* Show grading info based on selection */}
                    {formData.has_mcq_questions && !formData.has_short_answer_questions && (
                      <div className="bg-green-50 border border-green-200 rounded p-2 text-sm">
                        <p className="font-medium text-green-900">✅ Results shown immediately</p>
                        <p className="text-xs text-green-800">All MCQ questions are auto-graded. Students see results right after submitting.</p>
                      </div>
                    )}
                    
                    {!formData.has_mcq_questions && formData.has_short_answer_questions && (
                      <div className="bg-amber-50 border border-amber-200 rounded p-2 text-sm">
                        <p className="font-medium text-amber-900">⏳ Wait for teacher grading</p>
                        <p className="text-xs text-amber-800">Students cannot see results until you grade all their answers.</p>
                      </div>
                    )}
                    
                    {formData.has_mcq_questions && formData.has_short_answer_questions && (
                      <div className="bg-purple-50 border border-purple-200 rounded p-2 text-sm">
                        <p className="font-medium text-purple-900">🔄 Hybrid grading</p>
                        <p className="text-xs text-purple-800">MCQ auto-graded immediately, but students won't see full results until you grade their short answers.</p>
                      </div>
                    )}
                    
                    {!formData.has_mcq_questions && !formData.has_short_answer_questions && (
                      <div className="bg-red-50 border border-red-200 rounded p-2 text-sm">
                        <p className="font-medium text-red-900">⚠️ Select at least one question type</p>
                        <p className="text-xs text-red-800">Your quiz must contain either multiple choice or short answer questions.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Submission Options */}
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <h4 className="font-semibold text-sm">Submission Options</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allow_file"
                        checked={formData.allow_file_submission}
                        onCheckedChange={(checked) => setFormData({...formData, allow_file_submission: checked as boolean})}
                      />
                      <Label htmlFor="allow_file" className="font-normal cursor-pointer">
                        Allow file submissions
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allow_text"
                        checked={formData.allow_text_submission}
                        onCheckedChange={(checked) => setFormData({...formData, allow_text_submission: checked as boolean})}
                      />
                      <Label htmlFor="allow_text" className="font-normal cursor-pointer">
                        Allow text submissions
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Student Review Controls */}
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <h4 className="font-semibold text-sm">Student Review Access</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allow_review"
                        checked={formData.allow_review}
                        onCheckedChange={(checked) => setFormData({...formData, allow_review: checked as boolean})}
                      />
                      <Label htmlFor="allow_review" className="font-normal cursor-pointer">
                        Allow students to review submissions
                      </Label>
                    </div>
                    
                    {formData.allow_review && (
                      <div>
                        <Label htmlFor="review_after" className="text-sm mb-2 block">
                          When can students review?
                        </Label>
                        <Select value={formData.review_available_after} onValueChange={(value) => setFormData({...formData, review_available_after: value})}>
                          <SelectTrigger id="review_after">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IMMEDIATE">
                              <span>Immediately after submission</span>
                            </SelectItem>
                            <SelectItem value="GRADED">
                              <span>After you grade the assignment</span>
                            </SelectItem>
                            <SelectItem value="MANUAL">
                              <span>Only when you manually enable it</span>
                            </SelectItem>
                            <SelectItem value="NEVER">
                              <span>Never allow review</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.review_available_after === 'IMMEDIATE' && 'Students see correct answers and feedback right away'}
                          {formData.review_available_after === 'GRADED' && 'Students can review after you finish grading'}
                          {formData.review_available_after === 'MANUAL' && 'You control exactly when students can see results'}
                          {formData.review_available_after === 'NEVER' && 'Students cannot review submissions or see results'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {formData.assignment_type === 'QUIZ' || formData.assignment_type === 'EXAM' 
                      ? 'Next: Add Questions' 
                      : formData.assignment_type === 'PROJECT'
                      ? 'Create Project (Draft)'
                      : 'Create & Publish'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                  }}>Cancel</Button>
                </div>
              </form>
            ) : (
              <QuestionCreator 
                onAddQuestion={handleAddQuestion}
                onPublish={handlePublishAssignment}
                questions={questions}
                assignmentType={formData.assignment_type}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Assigned Classes Section */}
      <div className="animated-border">
        <div className="animated-border-content p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5" />
            <h3 className="text-lg font-semibold">My Assigned Classes</h3>
          </div>
          {classes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No classes assigned yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((cls) => (
                <div key={cls.id} className="animated-border-subtle">
                  <div className="animated-border-subtle-content p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">
                          {cls.class.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {cls.subject ? cls.subject.name : 'Form Class'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Level {cls.class.level} • Section {cls.class.section || 'A'}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {cls.assignment_count} assignments
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Class Filter */}
      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.class.id.toString()}>
                  {cls.class.name} {cls.subject ? `- ${cls.subject.name}` : '(Form Class)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-3">
        {assignments.length === 0 ? (
          <div className="animated-border">
            <div className="animated-border-content p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Assignments</h3>
              <p className="text-muted-foreground mb-4">
                {selectedClass === 'all' ? 'You haven\'t created any assignments yet.' : 'No assignments found for this class.'}
              </p>
              <Button onClick={handleCreateAssignment}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Assignment
              </Button>
            </div>
          </div>
        ) : (
          assignments.map((assignment) => (
            <div key={assignment.id} className="animated-assignment-card">
              <div className="animated-assignment-card-content p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-muted text-muted-foreground">
                      {typeIcons[assignment.assignment_type] || <FileText className="h-4 w-4" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{assignment.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {assignment.class_name} • Due: {new Date(assignment.due_date).toLocaleDateString()} • Max Score: {assignment.max_score}
                      </p>
                      {assignment.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge variant="outline" className={statusColors[assignment.status]}>
                        {assignment.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {new Date(assignment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewSubmissions(assignment.id)}
                        title="View submissions"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {assignment.status === 'DRAFT' && (
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handlePublishDraftAssignment(assignment.id)}
                          title="Publish assignment"
                        >
                          Publish
                        </Button>
                      )}
                      
                      {assignment.status === 'PUBLISHED' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePublishDraftAssignment(assignment.id)}
                          title="Republish assignment (update student assignments)"
                        >
                          Republish
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditAssignment(assignment)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Assignment
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateAssignment(assignment)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherAssignments;

const QuestionCreator = ({ onAddQuestion, onPublish, questions, assignmentType }: {
  onAddQuestion: (question: any) => Promise<void>;
  onPublish: () => void;
  questions: any[];
  assignmentType: string;
}) => {
  const [questionData, setQuestionData] = useState({
    question_text: '',
    question_type: 'mcq',
    points: 1,
    options: [
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false }
    ]
  });
  const [saving, setSaving] = useState(false);

  const addOption = () => {
    setQuestionData({
      ...questionData,
      options: [...questionData.options, { option_text: '', is_correct: false }]
    });
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...questionData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setQuestionData({ ...questionData, options: newOptions });
  };

  const handleAddQuestion = async () => {
    if (!questionData.question_text.trim()) {
      toast.error('Please enter a question');
      return;
    }
    
    if (questionData.question_type === 'mcq') {
      if (questionData.options.length < 2) {
        toast.error('MCQ must have at least 2 options');
        return;
      }
      if (!questionData.options.some(opt => opt.is_correct)) {
        toast.error('Please mark one option as correct');
        return;
      }
      if (!questionData.options.every(opt => opt.option_text.trim())) {
        toast.error('All options must have text');
        return;
      }
    }
    
    setSaving(true);
    try {
      await onAddQuestion(questionData);
      // Only reset form if save succeeded (onAddQuestion throws on failure)
      setQuestionData({
        question_text: '',
        question_type: 'mcq',
        points: 1,
        options: [
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false }
        ]
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Questions added: {questions.length}
      </div>
      
      <div>
        <Label htmlFor="question_text">Question</Label>
        <Textarea
          id="question_text"
          value={questionData.question_text}
          onChange={(e) => setQuestionData({...questionData, question_text: e.target.value})}
          placeholder="Enter your question..."
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="question_type">Type</Label>
          <Select value={questionData.question_type} onValueChange={(value) => setQuestionData({...questionData, question_type: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mcq">Multiple Choice</SelectItem>
              <SelectItem value="short_answer">Short Answer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="points">Points</Label>
          <Input
            id="points"
            type="number"
            min="1"
            value={questionData.points}
            onChange={(e) => setQuestionData({...questionData, points: parseInt(e.target.value)})}
          />
        </div>
      </div>
      
      {questionData.question_type === 'mcq' && (
        <div>
          <Label>Options</Label>
          <div className="space-y-2 mt-2">
            {questionData.options.map((option, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option.option_text}
                  onChange={(e) => updateOption(index, 'option_text', e.target.value)}
                  className="flex-1"
                />
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="correct_option"
                    checked={option.is_correct}
                    onChange={() => {
                      const newOptions = questionData.options.map((opt, i) => ({
                        ...opt,
                        is_correct: i === index
                      }));
                      setQuestionData({ ...questionData, options: newOptions });
                    }}
                  />
                  <span className="text-sm">Correct</span>
                </label>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              Add Option
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex gap-2 pt-4">
        <Button type="button" onClick={handleAddQuestion} disabled={saving}>
          {saving ? 'Saving...' : 'Add Question'}
        </Button>
        <Button type="button" variant="outline" onClick={onPublish} disabled={questions.length === 0}>
          Publish Assignment ({questions.length} question{questions.length !== 1 ? 's' : ''}, {questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0)} pts)
        </Button>
      </div>
    </div>
  );
};
