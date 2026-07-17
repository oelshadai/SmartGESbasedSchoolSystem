import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Save, Loader2, Eye, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';
import { toast } from 'sonner';

interface Assignment {
  id: number;
  title: string;
  assignment_type: string;
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
  submitted_at: string;
  score: number | null;
  attempts_count: number;
  is_overdue: boolean;
  can_reopen: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'GRADED': return 'bg-green-100 text-green-800';
    case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
    case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
    case 'NOT_STARTED': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'GRADED': return <CheckCircle className="h-4 w-4" />;
    case 'SUBMITTED': return <FileText className="h-4 w-4" />;
    case 'IN_PROGRESS': return <Clock className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

const AssignmentGrading = () => {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      fetchSubmissions();
    }
  }, [selectedAssignment]);

  const fetchAssignments = async () => {
    try {
      const response = await secureApiClient.get('/assignments/teacher/');
      setAssignments(response.results || response || []);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!selectedAssignment) return;
    
    try {
      setLoading(true);
      const response = await secureApiClient.get(`/assignments/teacher/${selectedAssignment}/submissions/`);
      setSubmissions(response.submissions || []);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = (submission: Submission) => {
    setGradingSubmission(submission);
    setGradeForm({
      score: submission.score?.toString() || '',
      feedback: ''
    });
  };

  const saveGrade = async () => {
    if (!gradingSubmission || !selectedAssignment) return;

    setSaving(true);
    try {
      await secureApiClient.patch(`/assignments/teacher/${selectedAssignment}/grade-submission/`, {
        submission_id: gradingSubmission.id,
        score: parseFloat(gradeForm.score),
        feedback: gradeForm.feedback
      });

      toast.success('Grade saved successfully');
      setGradingSubmission(null);
      await fetchSubmissions();
    } catch (error) {
      console.error('Failed to save grade:', error);
      toast.error('Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  const reopenSubmission = async (submissionId: number) => {
    if (!selectedAssignment) return;

    try {
      await secureApiClient.post(`/assignments/teacher/${selectedAssignment}/reopen-submission/`, {
        student_id: submissions.find(s => s.id === submissionId)?.student.id
      });

      toast.success('Assignment reopened for student');
      await fetchSubmissions();
    } catch (error) {
      console.error('Failed to reopen submission:', error);
      toast.error('Failed to reopen assignment');
    }
  };

  if (loading && assignments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading assignments...</p>
        </div>
      </div>
    );
  }

  const selectedAssignmentData = assignments.find(a => a.id.toString() === selectedAssignment);
  const pendingGrading = submissions.filter(s => s.status === 'SUBMITTED').length;
  const graded = submissions.filter(s => s.status === 'GRADED').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assignment Grading</h1>
        <p className="text-muted-foreground mt-1">Grade student submissions and provide feedback</p>
      </div>

      {/* Assignment Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an assignment to grade" />
            </SelectTrigger>
            <SelectContent>
              {assignments.map(assignment => (
                <SelectItem key={assignment.id} value={assignment.id.toString()}>
                  {assignment.title} ({assignment.assignment_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Grading Stats */}
      {selectedAssignment && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Submissions</p>
                  <p className="text-2xl font-bold">{submissions.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Grading</p>
                  <p className="text-2xl font-bold">{pendingGrading}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Graded</p>
                  <p className="text-2xl font-bold">{graded}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Max Score</p>
                  <p className="text-2xl font-bold">{selectedAssignmentData?.max_score}</p>
                </div>
                <Eye className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submissions List */}
      {selectedAssignment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedAssignmentData?.title} - Submissions</span>
              <Badge variant="outline">{submissions.length} students</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Student</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Submitted</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Score</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">{submission.student.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{submission.student.student_id}</p>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge className={getStatusColor(submission.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(submission.status)}
                            {submission.status}
                          </span>
                        </Badge>
                      </td>
                      <td className="p-4 text-center text-sm">
                        {submission.submitted_at ? (
                          <div>
                            <p>{new Date(submission.submitted_at).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(submission.submitted_at).toLocaleTimeString()}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not submitted</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {submission.score !== null ? (
                          <span className="font-bold text-foreground">
                            {submission.score}/{selectedAssignmentData?.max_score}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          {submission.status === 'SUBMITTED' && (
                            <Button
                              size="sm"
                              onClick={() => handleGradeSubmission(submission)}
                            >
                              Grade
                            </Button>
                          )}
                          {submission.status === 'GRADED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGradeSubmission(submission)}
                            >
                              Edit Grade
                            </Button>
                          )}
                          {submission.can_reopen && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reopenSubmission(submission.id)}
                            >
                              Reopen
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden p-3 space-y-3">
              {submissions.map((submission) => (
                <div key={submission.id} className="border rounded-xl p-3 space-y-2 bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{submission.student.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{submission.student.student_id}</p>
                    </div>
                    <Badge className={`text-xs flex-shrink-0 ${getStatusColor(submission.status)}`}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(submission.status)}
                        {submission.status}
                      </span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {submission.submitted_at
                        ? new Date(submission.submitted_at).toLocaleDateString()
                        : 'Not submitted'}
                    </span>
                    <span className="font-bold">
                      {submission.score !== null
                        ? `${submission.score}/${selectedAssignmentData?.max_score}`
                        : '-'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {submission.status === 'SUBMITTED' && (
                      <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => handleGradeSubmission(submission)}>Grade</Button>
                    )}
                    {submission.status === 'GRADED' && (
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => handleGradeSubmission(submission)}>Edit Grade</Button>
                    )}
                    {submission.can_reopen && (
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => reopenSubmission(submission.id)}>Reopen</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grading Dialog */}
      <Dialog open={!!gradingSubmission} onOpenChange={() => setGradingSubmission(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Grade Submission - {gradingSubmission?.student.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="score">Score (out of {selectedAssignmentData?.max_score})</Label>
              <Input
                id="score"
                type="number"
                value={gradeForm.score}
                onChange={(e) => setGradeForm({...gradeForm, score: e.target.value})}
                min="0"
                max={selectedAssignmentData?.max_score}
                required
              />
            </div>
            <div>
              <Label htmlFor="feedback">Feedback (Optional)</Label>
              <Textarea
                id="feedback"
                value={gradeForm.feedback}
                onChange={(e) => setGradeForm({...gradeForm, feedback: e.target.value})}
                rows={3}
                placeholder="Provide feedback to the student..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setGradingSubmission(null)}>
                Cancel
              </Button>
              <Button onClick={saveGrade} disabled={saving || !gradeForm.score}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Grade'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {!selectedAssignment && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Select Assignment to Grade</h3>
            <p className="text-muted-foreground">
              Choose an assignment from the dropdown above to view and grade student submissions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssignmentGrading;