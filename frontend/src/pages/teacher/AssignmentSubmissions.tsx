import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Download, Eye, Edit, RotateCcw, Send, FileDown } from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';
import { toast } from 'sonner';

interface Assignment {
  id: number;
  title: string;
  due_date: string;
  max_score: number;
}

interface Submission {
  id: number;
  student: {
    id: number;
    name: string;
    student_id: string;
  };
  status: string;
  submitted_at: string | null;
  score: number | null;
  attempts_count: number;
  is_overdue: boolean;
  can_reopen: boolean;
}

const statusConfig = {
  NOT_STARTED: { color: 'bg-muted text-muted-foreground', icon: Clock, label: 'Not Started' },
  IN_PROGRESS: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'In Progress' },
  SUBMITTED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Submitted' },
  GRADED: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, label: 'Graded' },
  EXPIRED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Expired' },
  OVERDUE: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, label: 'Overdue' }
};

const AssignmentSubmissions = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [gradeData, setGradeData] = useState({ score: '', feedback: '' });

  useEffect(() => {
    if (assignmentId) {
      fetchSubmissions();
    }
  }, [assignmentId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await secureApiClient.get(`/assignments/teacher/${assignmentId}/submissions/`);
      setAssignment(response.assignment);
      setSubmissions(response.submissions);
    } catch (error: any) {
      console.error('Failed to fetch submissions:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message || 'Failed to load submissions';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;

    try {
      await secureApiClient.patch(`/assignments/teacher/${assignmentId}/grade-submission/`, {
        submission_id: selectedSubmission.id,
        score: parseFloat(gradeData.score),
        feedback: gradeData.feedback
      });
      
      toast.success('Submission graded successfully');
      setGradeDialogOpen(false);
      setGradeData({ score: '', feedback: '' });
      fetchSubmissions();
    } catch (error) {
      console.error('Failed to grade submission:', error);
      toast.error('Failed to grade submission');
    }
  };

  const handleAutoSubmitOverdue = async () => {
    if (!assignment) return;
    const overdueStudents = submissions.filter(s => s.is_overdue && ['NOT_STARTED', 'IN_PROGRESS'].includes(s.status));
    if (overdueStudents.length === 0) {
      toast.info('No overdue unsubmitted students found');
      return;
    }
    if (!confirm(`Auto-submit ${overdueStudents.length} overdue student(s) with zero/empty submission? This cannot be undone.`)) return;

    try {
      const response = await secureApiClient.post(`/assignments/teacher/${assignmentId}/auto-submit-overdue/`, {});
      toast.success(response.message || `Auto-submitted ${overdueStudents.length} student(s)`);
      fetchSubmissions();
    } catch (error: any) {
      console.error('Failed to auto-submit overdue:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to auto-submit overdue students';
      toast.error(errorMessage);
    }
  };

  const handleDownloadReport = () => {
    if (!assignment || submissions.length === 0) return;
    const rows: string[][] = [
      ['Student Name', 'Student ID', 'Status', 'Submitted At', 'Score', 'Attempts']
    ];
    submissions.forEach(s => {
      rows.push([
        s.student.name,
        s.student.student_id,
        s.is_overdue && s.status === 'NOT_STARTED' ? 'OVERDUE' : s.status,
        s.submitted_at ? new Date(s.submitted_at).toLocaleString() : 'Not submitted',
        s.score !== null ? String(s.score) : '-',
        String(s.attempts_count)
      ]);
    });
    const csv = rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assignment.title.replace(/[^a-z0-9]/gi, '_')}_submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  const handleReopenSubmission = async (submission: Submission) => {
    if (!confirm(`Reopen assignment for ${submission.student.name}?`)) return;

    try {
      await secureApiClient.post(`/assignments/teacher/${assignmentId}/reopen-submission/`, {
        student_id: submission.student.id
      });
      
      toast.success(`Assignment reopened for ${submission.student.name}`);
      fetchSubmissions();
    } catch (error: any) {
      console.error('Failed to reopen submission:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message || 'Failed to reopen submission';
      toast.error(errorMessage);
    }
  };

  const openGradeDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradeData({
      score: submission.score?.toString() || '',
      feedback: ''
    });
    setGradeDialogOpen(true);
  };

  const getStatusDisplay = (submission: Submission) => {
    let status = submission.status;
    if (submission.is_overdue && status === 'NOT_STARTED') {
      status = 'OVERDUE';
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.NOT_STARTED;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Assignment not found</p>
        <Button onClick={() => navigate('/teacher/assignments')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assignments
        </Button>
      </div>
    );
  }

  const submittedCount = submissions.filter(s => ['SUBMITTED', 'GRADED'].includes(s.status)).length;
  const pendingCount = submissions.filter(s => s.status === 'NOT_STARTED').length;
  const overdueCount = submissions.filter(s => s.is_overdue && s.status === 'NOT_STARTED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/teacher/assignments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{assignment.title}</h1>
            <p className="text-muted-foreground">
              Due: {new Date(assignment.due_date).toLocaleDateString()} • Max Score: {assignment.max_score}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleAutoSubmitOverdue}
              title={`Auto-submit ${overdueCount} overdue student(s) with zero score`}
            >
              <Send className="h-4 w-4 mr-2" />
              Auto-Submit Overdue ({overdueCount})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadReport}
            title="Download submission report as CSV"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-sm text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{submittedCount}</div>
            <p className="text-sm text-muted-foreground">Submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <p className="text-sm text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Student Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {submissions.map((submission) => (
              <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <h4 className="font-medium">{submission.student.name}</h4>
                    <p className="text-sm text-muted-foreground">ID: {submission.student.student_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusDisplay(submission)}
                    {submission.score !== null && (
                      <Badge variant="outline">
                        Score: {submission.score}/{assignment.max_score}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {submission.submitted_at && (
                    <span className="text-sm text-muted-foreground">
                      Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                    </span>
                  )}
                  
                  <div className="flex gap-1">
                    {submission.status === 'SUBMITTED' && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => openGradeDialog(submission)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {submission.status === 'GRADED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openGradeDialog(submission)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {submission.can_reopen && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReopenSubmission(submission)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grade Dialog */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSubmission?.status === 'GRADED' ? 'View Grade' : 'Grade Submission'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <Label>Student</Label>
                <p className="text-sm font-medium">{selectedSubmission.student.name}</p>
              </div>
              
              <div>
                <Label htmlFor="score">Score (out of {assignment.max_score})</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max={assignment.max_score}
                  value={gradeData.score}
                  onChange={(e) => setGradeData({...gradeData, score: e.target.value})}
                  disabled={selectedSubmission.status === 'GRADED'}
                />
              </div>
              
              <div>
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  value={gradeData.feedback}
                  onChange={(e) => setGradeData({...gradeData, feedback: e.target.value})}
                  placeholder="Provide feedback to the student..."
                  rows={4}
                  disabled={selectedSubmission.status === 'GRADED'}
                />
              </div>
              
              {selectedSubmission.status !== 'GRADED' && (
                <div className="flex gap-2">
                  <Button onClick={handleGradeSubmission} className="flex-1">
                    Grade Submission
                  </Button>
                  <Button variant="outline" onClick={() => setGradeDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssignmentSubmissions;