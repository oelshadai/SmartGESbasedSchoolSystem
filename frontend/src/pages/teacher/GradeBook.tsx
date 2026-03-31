import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Eye, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';
import { toast } from 'sonner';

interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  subject: { id: number; name: string };
  class_instance: { id: number; name: string };
  is_auto_graded: boolean;
}

interface Submission {
  id: number;
  student: {
    id: number;
    name: string;
    student_id: string;
  };
  assignment: Assignment;
  submitted_at: string;
  file_url?: string;
  text_content?: string;
  score?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'late' | 'auto_graded';
  is_auto_graded?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'graded': return 'text-green-600';
    case 'auto_graded': return 'text-purple-600';
    case 'submitted': return 'text-blue-600';
    case 'late': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'graded': return CheckCircle;
    case 'auto_graded': return CheckCircle;
    case 'submitted': return Clock;
    case 'late': return XCircle;
    default: return FileText;
  }
};

const GradeBook = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [score, setScore] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

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
      // Fetch assignments that have submissions needing manual grading
      const response = await secureApiClient.get('/assignments/grading/pending-grading/');
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
      const response = await secureApiClient.get(`/assignments/grading/${selectedAssignment}/submissions/`);
      setSubmissions(response.results || response || []);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = (submission: Submission) => {
    setGradingSubmission(submission);
    setScore(submission.score?.toString() || '');
    setFeedback(submission.feedback || '');
  };

  const saveGrade = async () => {
    if (!gradingSubmission) return;

    setSaving(true);
    try {
      await secureApiClient.patch('/assignments/grading/grade-submission/', {
        submission_id: gradingSubmission.id,
        score: parseFloat(score) || 0,
        feedback: feedback
      });
      
      toast.success('Grade saved successfully');
      setGradingSubmission(null);
      setScore('');
      setFeedback('');
      await fetchSubmissions();
    } catch (error) {
      console.error('Failed to save grade:', error);
      toast.error('Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  const downloadSubmission = async (submission: Submission) => {
    if (!submission.file_url) return;
    
    try {
      const response = await secureApiClient.get(submission.file_url, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${submission.student.name}_${submission.assignment.title}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download submission:', error);
      toast.error('Failed to download submission');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    );
  }

  const selectedAssignmentData = Array.isArray(assignments) ? assignments.find(a => a.id.toString() === selectedAssignment) : undefined;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assignment Grading</h1>
        <p className="text-muted-foreground mt-1">Review and grade student submissions</p>
      </div>

      {/* Assignment Selection */}
      <div className="animated-border">
        <div className="animated-border-content p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Assignment</Label>
              <Select value={selectedAssignment} onValueChange={(value) => value !== 'no-assignments' && setSelectedAssignment(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignment to grade" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(assignments) && assignments.length > 0 ? (
                    assignments.map(assignment => (
                      <SelectItem key={assignment.id} value={assignment.id.toString()}>
                        {assignment.title} - {assignment.subject.name} ({assignment.class_instance.name})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-assignments" disabled>No assignments pending manual grading</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedAssignmentData && (
              <div className="flex items-end">
                <div className="animated-stats-card">
                  <div className="animated-stats-card-content p-3">
                    <div className="text-sm text-muted-foreground">
                      <p>Due: {new Date(selectedAssignmentData.due_date).toLocaleDateString()}</p>
                      <p>Max Score: {selectedAssignmentData.max_score}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submissions List */}
      {selectedAssignment && (
        <div className="animated-border">
          <div className="animated-border-content">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{selectedAssignmentData?.title}</h2>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {Array.isArray(submissions) ? submissions.length : 0} submissions
                </Badge>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {Array.isArray(submissions) && submissions.map((submission) => {
                const StatusIcon = getStatusIcon(submission.status);
                return (
                  <div key={submission.id} className="animated-border-subtle">
                    <div className="animated-border-subtle-content p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <StatusIcon className={`h-4 w-4 ${getStatusColor(submission.status)}`} />
                          </div>
                          <div>
                            <p className="font-medium">{submission.student.name}</p>
                            <p className="text-sm text-muted-foreground">{submission.student.student_id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={submission.status === 'graded' || submission.status === 'auto_graded' ? 'default' : 'secondary'}>
                            {submission.status === 'auto_graded' ? 'Auto Graded' : submission.status}
                          </Badge>
                          {submission.score !== undefined && (
                            <Badge variant="outline">
                              {submission.score}/{selectedAssignmentData?.max_score}
                            </Badge>
                          )}
                          {selectedAssignmentData?.is_auto_graded && (
                            <Badge variant="secondary">Auto</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Submitted: {new Date(submission.submitted_at).toLocaleString()}
                        </div>
                        <div className="flex gap-2">
                          {submission.file_url && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => downloadSubmission(submission)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          )}
                          {submission.text_content && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Submission Content</DialogTitle>
                                </DialogHeader>
                                <div className="max-h-96 overflow-y-auto p-4 bg-muted rounded">
                                  <pre className="whitespace-pre-wrap text-sm">{submission.text_content}</pre>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          <Button 
                            size="sm" 
                            onClick={() => handleGradeSubmission(submission)}
                            disabled={selectedAssignmentData?.is_auto_graded || submission.status === 'auto_graded'}
                          >
                            {selectedAssignmentData?.is_auto_graded || submission.status === 'auto_graded' ? 'View' : 'Grade'}
                          </Button>
                        </div>
                      </div>
                      
                      {submission.feedback && (
                        <div className="mt-3">
                          <div className="animated-stats-card">
                            <div className="animated-stats-card-content p-3">
                              <div className="text-sm">
                                <strong>Feedback:</strong> {submission.feedback}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Grading Dialog */}
      <Dialog open={!!gradingSubmission} onOpenChange={() => setGradingSubmission(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
          </DialogHeader>
          {gradingSubmission && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{gradingSubmission.student.name}</p>
                <p className="text-sm text-muted-foreground">{gradingSubmission.student.student_id}</p>
              </div>
              
              <div>
                <Label htmlFor="score">Score (out of {selectedAssignmentData?.max_score})</Label>
                <Input
                  id="score"
                  type="number"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  min="0"
                  max={selectedAssignmentData?.max_score}
                  disabled={selectedAssignmentData?.is_auto_graded || gradingSubmission?.status === 'auto_graded'}
                />
              </div>
              
              <div>
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  placeholder="Provide feedback for the student..."
                  disabled={selectedAssignmentData?.is_auto_graded || gradingSubmission?.status === 'auto_graded'}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setGradingSubmission(null)}>
                  {selectedAssignmentData?.is_auto_graded || gradingSubmission?.status === 'auto_graded' ? 'Close' : 'Cancel'}
                </Button>
                {!selectedAssignmentData?.is_auto_graded && gradingSubmission?.status !== 'auto_graded' && (
                  <Button onClick={saveGrade} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Save Grade
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {!selectedAssignment ? (
        <div className="animated-border pulse-glow">
          <div className="animated-border-content p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Select Assignment</h3>
            <p className="text-muted-foreground">
              Choose an assignment to view and grade student submissions.
            </p>
          </div>
        </div>
      ) : Array.isArray(submissions) && submissions.length === 0 ? (
        <div className="animated-border-subtle">
          <div className="animated-border-subtle-content p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Submissions</h3>
            <p className="text-muted-foreground">
              No submissions found for this assignment.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GradeBook;
