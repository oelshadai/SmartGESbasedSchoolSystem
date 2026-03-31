import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Eye, Clock, CheckCircle, XCircle, Loader2, BookOpen, MessageSquare, FileCheck } from 'lucide-react';
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
  assignment_type: string;
  pending_submissions: number;
}

interface Submission {
  id: string;
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
  status: 'submitted' | 'graded';
  quiz_attempt_id?: number;
}

interface QuizAnswer {
  id: number;
  question: {
    id: number;
    text: string;
    type: 'mcq' | 'short_answer' | 'project';
    points: number;
  };
  answer_text: string;
  selected_option?: string;
  is_correct?: boolean | null;
  points_earned: number;
  teacher_comment: string;
  files: Array<{
    id: number;
    filename: string;
    url: string;
    size: number;
  }>;
}

interface QuizDetails {
  attempt: {
    id: number;
    student: {
      id: number;
      name: string;
      student_id: string;
    };
    assignment: {
      id: number;
      title: string;
      max_score: number;
    };
    score?: number;
    status: string;
    submitted_at: string;
  };
  answers: QuizAnswer[];
}

const EnhancedGradeBook = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [score, setScore] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [quizDetails, setQuizDetails] = useState<QuizDetails | null>(null);
  const [loadingQuizDetails, setLoadingQuizDetails] = useState(false);
  const [gradingAnswers, setGradingAnswers] = useState<{[key: number]: {points: string, comment: string}}>({});

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

  const fetchQuizDetails = async (submissionId: string) => {
    setLoadingQuizDetails(true);
    try {
      const response = await secureApiClient.get(`/assignments/grading/${submissionId}/quiz-details/`);
      setQuizDetails(response);
      
      const initialGrading: {[key: number]: {points: string, comment: string}} = {};
      response.answers.forEach((answer: QuizAnswer) => {
        if (answer.question.type === 'short_answer' || answer.question.type === 'project') {
          initialGrading[answer.id] = {
            points: answer.points_earned?.toString() || '0',
            comment: answer.teacher_comment || ''
          };
        }
      });
      setGradingAnswers(initialGrading);
    } catch (error) {
      console.error('Failed to fetch quiz details:', error);
      toast.error('Failed to load quiz details');
    } finally {
      setLoadingQuizDetails(false);
    }
  };

  const handleGradeSubmission = async (submission: Submission) => {
    setGradingSubmission(submission);
    setScore(submission.score?.toString() || '');
    setFeedback(submission.feedback || '');
    
    if (submission.id.startsWith('quiz_')) {
      await fetchQuizDetails(submission.id);
    }
  };

  const updateAnswerGrading = (answerId: number, field: 'points' | 'comment', value: string) => {
    setGradingAnswers(prev => ({
      ...prev,
      [answerId]: {
        ...prev[answerId],
        [field]: value
      }
    }));
  };

  const calculateTotalScore = () => {
    if (!quizDetails) return 0;
    
    let totalEarned = 0;
    let totalPossible = 0;
    
    quizDetails.answers.forEach(answer => {
      totalPossible += answer.question.points;
      
      if (answer.question.type === 'mcq') {
        totalEarned += answer.points_earned;
      } else {
        const grading = gradingAnswers[answer.id];
        if (grading) {
          totalEarned += parseFloat(grading.points) || 0;
        }
      }
    });
    
    const maxScore = quizDetails.attempt.assignment.max_score;
    return totalPossible > 0 ? (totalEarned / totalPossible) * maxScore : 0;
  };

  const saveGrade = async () => {
    if (!gradingSubmission) return;

    setSaving(true);
    try {
      if (gradingSubmission.id.startsWith('quiz_')) {
        for (const [answerId, grading] of Object.entries(gradingAnswers)) {
          await secureApiClient.patch('/assignments/grading/grade-quiz-answer/', {
            answer_id: parseInt(answerId),
            points_earned: parseFloat(grading.points) || 0,
            teacher_comment: grading.comment
          });
        }
        
        const finalScore = score || calculateTotalScore().toFixed(1);
        await secureApiClient.patch('/assignments/grading/grade-submission/', {
          submission_id: gradingSubmission.id,
          score: parseFloat(finalScore),
          feedback: feedback
        });
      } else {
        await secureApiClient.patch('/assignments/grading/grade-submission/', {
          submission_id: gradingSubmission.id,
          score: parseFloat(score) || 0,
          feedback: feedback
        });
      }
      
      toast.success('Grade saved successfully');
      setGradingSubmission(null);
      setQuizDetails(null);
      setScore('');
      setFeedback('');
      setGradingAnswers({});
      await fetchSubmissions();
    } catch (error) {
      console.error('Failed to save grade:', error);
      toast.error('Failed to save grade');
    } finally {
      setSaving(false);
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

  const selectedAssignmentData = assignments.find(a => a.id.toString() === selectedAssignment);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Assignment Grading</h1>
        <p className="text-muted-foreground mt-1">Review and grade student submissions with detailed inspection</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
            <SelectTrigger>
              <SelectValue placeholder="Choose assignment to grade" />
            </SelectTrigger>
            <SelectContent>
              {assignments.length > 0 ? (
                assignments.map(assignment => (
                  <SelectItem key={assignment.id} value={assignment.id.toString()}>
                    {assignment.title} - {assignment.subject.name} ({assignment.pending_submissions} pending)
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No assignments pending grading</SelectItem>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedAssignment && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedAssignmentData?.title}</CardTitle>
              <Badge>{submissions.length} submissions</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{submission.student.name}</p>
                      <p className="text-sm text-muted-foreground">{submission.student.student_id}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted: {new Date(submission.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {submission.score !== undefined && (
                        <Badge variant="outline">{submission.score}/{selectedAssignmentData?.max_score}</Badge>
                      )}
                      <Badge variant={submission.status === 'graded' ? 'default' : 'secondary'}>
                        {submission.status}
                      </Badge>
                      <Button size="sm" onClick={() => handleGradeSubmission(submission)}>
                        {submission.id.startsWith('quiz_') ? (
                          <>
                            <BookOpen className="h-4 w-4 mr-1" />
                            Inspect & Grade
                          </>
                        ) : (
                          'Grade'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!gradingSubmission} onOpenChange={() => {
        setGradingSubmission(null);
        setQuizDetails(null);
        setGradingAnswers({});
      }}>
        <DialogContent className={gradingSubmission?.id.startsWith('quiz_') ? "max-w-4xl max-h-[90vh] overflow-y-auto" : "max-w-md"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {gradingSubmission?.id.startsWith('quiz_') ? (
                <>
                  <BookOpen className="h-5 w-5" />
                  Quiz Inspection & Grading
                </>
              ) : (
                'Grade Submission'
              )}
            </DialogTitle>
          </DialogHeader>
          
          {gradingSubmission && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-lg">{gradingSubmission.student.name}</p>
                  <p className="text-sm text-muted-foreground">{gradingSubmission.student.student_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="text-sm font-medium">{new Date(gradingSubmission.submitted_at).toLocaleString()}</p>
                </div>
              </div>

              {gradingSubmission.id.startsWith('quiz_') && (
                <div>
                  {loadingQuizDetails ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading quiz details...</span>
                    </div>
                  ) : quizDetails ? (
                    <Tabs defaultValue="questions">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="questions">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Questions ({quizDetails.answers.length})
                        </TabsTrigger>
                        <TabsTrigger value="summary">
                          <FileCheck className="h-4 w-4 mr-2" />
                          Summary
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="questions" className="space-y-4 mt-4">
                        {quizDetails.answers.map((answer, index) => (
                          <Card key={answer.id} className="border-l-4 border-l-blue-500">
                            <CardHeader className="pb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">Q{index + 1}</Badge>
                                <Badge variant={answer.question.type === 'mcq' ? 'default' : 'secondary'}>
                                  {answer.question.type === 'mcq' ? 'MCQ' : 
                                   answer.question.type === 'short_answer' ? 'Short Answer' : 'Project'}
                                </Badge>
                                <Badge variant="outline">{answer.question.points} pts</Badge>
                              </div>
                              <p className="text-sm font-medium">{answer.question.text}</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium">Student's Answer:</Label>
                                <div className="mt-1 p-3 bg-muted rounded-md">
                                  {answer.question.type === 'mcq' ? (
                                    <div className="flex items-center gap-2">
                                      <span>{answer.selected_option || 'No answer'}</span>
                                      {answer.is_correct !== null && (
                                        <Badge variant={answer.is_correct ? 'default' : 'destructive'}>
                                          {answer.is_correct ? 'Correct' : 'Incorrect'}
                                        </Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="whitespace-pre-wrap text-sm">
                                      {answer.answer_text || 'No answer provided'}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {(answer.question.type === 'short_answer' || answer.question.type === 'project') && (
                                <div className="border-t pt-4 space-y-3">
                                  <div>
                                    <Label>Points (out of {answer.question.points})</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      max={answer.question.points}
                                      value={gradingAnswers[answer.id]?.points || '0'}
                                      onChange={(e) => updateAnswerGrading(answer.id, 'points', e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <Label>Comment</Label>
                                    <Textarea
                                      value={gradingAnswers[answer.id]?.comment || ''}
                                      onChange={(e) => updateAnswerGrading(answer.id, 'comment', e.target.value)}
                                      placeholder="Feedback for this answer..."
                                      rows={2}
                                    />
                                  </div>
                                </div>
                              )}

                              {answer.question.type === 'mcq' && (
                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-md">
                                  <span className="text-sm font-medium text-green-800">Auto-graded</span>
                                  <Badge>{answer.points_earned}/{answer.question.points} pts</Badge>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </TabsContent>
                      
                      <TabsContent value="summary" className="space-y-4 mt-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Grading Summary</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-4 bg-muted rounded-lg">
                                <p className="text-2xl font-bold">{calculateTotalScore().toFixed(1)}</p>
                                <p className="text-sm text-muted-foreground">Calculated Score</p>
                              </div>
                              <div className="text-center p-4 bg-muted rounded-lg">
                                <p className="text-2xl font-bold">{quizDetails.attempt.assignment.max_score}</p>
                                <p className="text-sm text-muted-foreground">Max Score</p>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div>
                              <Label>Final Score (Optional Override)</Label>
                              <Input
                                type="number"
                                value={score || calculateTotalScore().toFixed(1)}
                                onChange={(e) => setScore(e.target.value)}
                                min="0"
                                max={quizDetails.attempt.assignment.max_score}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Leave empty to use calculated: {calculateTotalScore().toFixed(1)}
                              </p>
                            </div>
                            
                            <div>
                              <Label>Overall Feedback</Label>
                              <Textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                rows={3}
                                placeholder="Overall feedback for the quiz..."
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  ) : null}
                </div>
              )}

              {!gradingSubmission.id.startsWith('quiz_') && (
                <div className="space-y-4">
                  <div>
                    <Label>Score (out of {selectedAssignmentData?.max_score})</Label>
                    <Input
                      type="number"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      min="0"
                      max={selectedAssignmentData?.max_score}
                    />
                  </div>
                  <div>
                    <Label>Feedback</Label>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={4}
                      placeholder="Provide feedback..."
                    />
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setGradingSubmission(null);
                  setQuizDetails(null);
                  setGradingAnswers({});
                }}>
                  Cancel
                </Button>
                <Button onClick={saveGrade} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Grade
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedGradeBook;
