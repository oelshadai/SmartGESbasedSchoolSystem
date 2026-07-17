import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Clock, Send, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';
import { toast } from 'sonner';

interface Assignment {
  id: number;
  title: string;
  description: string;
  assignment_type: string;
  due_date: string;
  time_limit: number | null;
  is_timed: boolean;
  max_score: number;
  max_attempts: number;
}

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  points: number;
  order: number;
  options?: {
    id: number;
    option_text: string;
    order: number;
  }[];
}

interface StudentAssignment {
  id: number;
  status: string;
  score: number | null;
  attempts_count: number;
}

const AssignmentSubmission = () => {
  const { id: assignmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [studentAssignment, setStudentAssignment] = useState<StudentAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (assignment?.is_timed && timeLeft !== null && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [assignment, timeLeft]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const response = await secureApiClient.get(`/assignments/student/${assignmentId}/take/`);
      console.log('Assignment take response:', response);
      
      setAssignment(response.assignment);
      setQuestions(response.questions || []);
      setStudentAssignment(response.student_assignment);
      
      // Set timer for timed assignments
      if (response.assignment.is_timed && response.assignment.time_limit) {
        setTimeLeft(response.assignment.time_limit * 60); // Convert minutes to seconds
      }
    } catch (error: any) {
      console.error('Failed to fetch assignment:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load assignment';
      toast.error(errorMessage);
      navigate('/student/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmit = async () => {
    toast.warning('Time expired! Auto-submitting assignment...');
    await handleSubmit(true);
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      
      // Prepare answers
      const answers = questions.map(q => ({
        question_id: q.id,
        selected_option_id: selectedAnswers[q.id] || null,
        answer_text: textAnswers[q.id] || ''
      }));
      
      const response = await secureApiClient.post(`/assignments/student/${assignmentId}/submit/`, {
        answers: answers
      });
      
      console.log('Submit response:', response);
      
      if (response.status === 'GRADED') {
        // Quiz/Exam - show results immediately (MCQ-only)
        toast.success(`Assignment submitted! Score: ${response.score}/${assignment?.max_score}`);
      } else {
        // Hybrid quiz or manual grading required
        toast.success('Assignment submitted successfully! Waiting for teacher to grade.');
      }
      
      navigate('/student/assignments');
    } catch (error: any) {
      console.error('Failed to submit assignment:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to submit assignment';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(selectedAnswers).length + Object.keys(textAnswers).filter(key => textAnswers[parseInt(key)]?.trim()).length;
  };

  const isQuestionAnswered = (questionId: number) => {
    return selectedAnswers[questionId] !== undefined || (textAnswers[questionId] && textAnswers[questionId].trim() !== '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment || !studentAssignment) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Assignment Not Found</h3>
        <p className="text-muted-foreground mb-4">The assignment you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => navigate('/student/assignments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assignments
        </Button>
      </div>
    );
  }

  // Already graded — show result card
  if (studentAssignment.status === 'GRADED') {
    const pct = studentAssignment.score != null ? Math.round((studentAssignment.score / assignment.max_score) * 100) : 0;
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">
        <Button variant="ghost" size="sm" onClick={() => navigate('/student/assignments')} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-4">
          <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
          <h2 className="text-lg font-bold text-foreground">{assignment.title}</h2>
          <p className="text-sm text-muted-foreground">Assignment graded</p>
          <div className="text-4xl font-bold text-foreground">
            {studentAssignment.score ?? 0}<span className="text-xl text-muted-foreground">/{assignment.max_score}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">{pct}%</p>
        </div>
      </div>
    );
  }

  const mins = timeLeft ? Math.floor(timeLeft / 60) : 0;
  const secs = timeLeft ? timeLeft % 60 : 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/student/assignments')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{assignment.title}</h1>
            <p className="text-sm text-muted-foreground">
              {assignment.assignment_type} • Due: {new Date(assignment.due_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        {assignment.is_timed && timeLeft !== null && (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-sm px-3 py-1">
            <Clock className="h-4 w-4 mr-1" /> 
            {mins}:{secs.toString().padStart(2, '0')}
          </Badge>
        )}
      </div>

      {/* Assignment Info */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">{assignment.description}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span>Max Score: {assignment.max_score}</span>
            <span>Questions: {questions.length}</span>
            {assignment.time_limit && <span>Time Limit: {assignment.time_limit} minutes</span>}
            <span>Attempts: {studentAssignment.attempts_count + 1}/{assignment.max_attempts}</span>
          </div>
        </CardContent>
      </Card>

      {questions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Questions Available</h3>
            <p className="text-muted-foreground">
              This assignment doesn't have any questions yet. Please contact your teacher.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progress */}
          <div className="flex items-center gap-2 flex-wrap">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`h-8 w-8 rounded-full text-xs font-medium border transition-colors ${
                  i === currentQ ? 'bg-primary text-primary-foreground border-primary' :
                  isQuestionAnswered(questions[i].id) ? 'bg-success/10 text-success border-success/30' :
                  'bg-muted text-muted-foreground border-border'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <span className="text-xs text-muted-foreground ml-2">
              {getAnsweredCount()}/{questions.length} answered
            </span>
          </div>

          {/* Current Question */}
          {questions.map((q, i) => i === currentQ && (
            <Card key={q.id}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Q{i + 1}</Badge>
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    {q.question_type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
                  </Badge>
                  <Badge variant="outline">{q.points} points</Badge>
                </div>
                
                <p className="text-foreground font-medium text-lg">{q.question_text}</p>

                {q.question_type === 'mcq' && q.options && (
                  <div className="space-y-3">
                    {q.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: opt.id })}
                        className={`w-full text-left p-4 rounded-lg border transition-colors text-sm ${
                          selectedAnswers[q.id] === opt.id 
                            ? 'border-primary bg-primary/5 text-foreground ring-2 ring-primary/20' 
                            : 'border-border hover:border-muted-foreground/30 text-foreground hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            selectedAnswers[q.id] === opt.id 
                              ? 'border-primary bg-primary' 
                              : 'border-muted-foreground/30'
                          }`}>
                            {selectedAnswers[q.id] === opt.id && (
                              <CheckCircle className="h-3 w-3 text-primary-foreground" />
                            )}
                          </div>
                          <span>{opt.option_text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {q.question_type === 'short_answer' && (
                  <Textarea
                    placeholder="Type your answer here..."
                    value={textAnswers[q.id] || ''}
                    onChange={(e) => setTextAnswers({ ...textAnswers, [q.id]: e.target.value })}
                    className="min-h-[120px]"
                  />
                )}
              </CardContent>
            </Card>
          ))}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              disabled={currentQ === 0} 
              onClick={() => setCurrentQ(currentQ - 1)}
            >
              Previous
            </Button>
            
            <div className="flex gap-3">
              {currentQ < questions.length - 1 ? (
                <Button onClick={() => setCurrentQ(currentQ + 1)}>
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={() => handleSubmit()} 
                  disabled={submitting}
                  className="bg-success hover:bg-success/90 text-success-foreground"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" />Submit Assignment</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AssignmentSubmission;
