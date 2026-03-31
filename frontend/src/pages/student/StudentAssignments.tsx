import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle, AlertCircle, FileText, Loader2, Play, Eye } from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Assignment {
  id: number;
  title: string;
  description: string;
  subject_name: string;
  assignment_type: string;
  due_date: string;
  points: number;
  status: string;
  score: number | null;
  time_limit: number | null;
  max_attempts: number;
  submitted_at: string | null;
  teacher_feedback: string;
  class_name: string;
}

const statusConfig: Record<string, { icon: React.ReactNode; class: string; label: string }> = {
  NOT_STARTED: { icon: <Clock className="h-4 w-4" />, class: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Not Started' },
  IN_PROGRESS: { icon: <Clock className="h-4 w-4" />, class: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'In Progress' },
  SUBMITTED: { icon: <CheckCircle className="h-4 w-4" />, class: 'bg-green-100 text-green-800 border-green-200', label: 'Submitted' },
  GRADED: { icon: <CheckCircle className="h-4 w-4" />, class: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Graded' },
  EXPIRED: { icon: <AlertCircle className="h-4 w-4" />, class: 'bg-red-100 text-red-800 border-red-200', label: 'Expired' },
};

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await secureApiClient.get('/assignments/student/my-assignments/');
      console.log('Student assignments response:', response);
      setAssignments(response || []);
    } catch (error: any) {
      console.error('Failed to fetch assignments:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load assignments';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssignment = (assignment: Assignment) => {
    if (assignment.status === 'SUBMITTED' || assignment.status === 'GRADED') {
      navigate(`/student/assignments/${assignment.id}`);
    } else {
      navigate(`/student/assignments/${assignment.id}`);
    }
  };

  const handleReviewAssignment = async (assignment: Assignment) => {
    try {
      // First get the student assignment ID for review
      const response = await secureApiClient.get('/assignments/review/my-submissions/');
      const submissions = response || [];
      const submission = submissions.find((s: any) => s.assignment.id === assignment.id);
      
      if (submission && submission.can_review) {
        navigate(`/student/assignments/review/${submission.id}`);
      } else {
        toast.error('Review not available yet. Please wait for grading.');
      }
    } catch (error) {
      console.error('Failed to get submission for review:', error);
      toast.error('Failed to access review');
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getStatusForDisplay = (assignment: Assignment) => {
    // Only show EXPIRED if overdue AND not yet submitted
    if (isOverdue(assignment.due_date) && assignment.status === 'NOT_STARTED') {
      return 'EXPIRED';
    }
    return assignment.status;
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Assignments</h1>
        <p className="text-muted-foreground mt-1">View and submit your assignments</p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Assignments</h3>
            <p className="text-muted-foreground">
              You don't have any assignments yet. Check back later!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const displayStatus = getStatusForDisplay(assignment);
            const sc = statusConfig[displayStatus] || statusConfig.NOT_STARTED;
            const isOverdueAssignment = isOverdue(assignment.due_date);
            
            return (
              <div key={assignment.id} className="animated-assignment-card">
                <div 
                  className="animated-assignment-card-content flex items-center justify-between cursor-pointer hover:bg-muted/20 transition-colors p-4"
                  onClick={() => handleStartAssignment(assignment)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-muted text-muted-foreground">
                      {sc.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{assignment.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {assignment.subject_name} • {assignment.class_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(assignment.due_date).toLocaleDateString()} • 
                        Max: {assignment.points} points
                        {assignment.time_limit && (
                          <> • Time: {assignment.time_limit} min</>
                        )}
                      </p>
                      {assignment.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {assignment.score !== null && (
                        <div className="text-sm font-medium text-foreground mb-1">
                          {assignment.score}/{assignment.points}
                        </div>
                      )}
                      <Badge variant="outline" className={sc.class}>
                        {sc.label}
                      </Badge>
                      {isOverdueAssignment && assignment.status === 'NOT_STARTED' && (
                        <div className="text-xs text-red-600 mt-1">Overdue</div>
                      )}
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant={assignment.status === 'GRADED' ? 'outline' : 'default'}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (assignment.status === 'GRADED' || assignment.status === 'SUBMITTED') {
                          handleReviewAssignment(assignment);
                        } else {
                          handleStartAssignment(assignment);
                        }
                      }}
                    >
                      {assignment.status === 'GRADED' ? (
                        <><Eye className="h-4 w-4 mr-1" />Review</>
                      ) : assignment.status === 'SUBMITTED' ? (
                        <><Eye className="h-4 w-4 mr-1" />Review</>
                      ) : assignment.status === 'IN_PROGRESS' ? (
                        <>Continue</>
                      ) : (
                        <><Play className="h-4 w-4 mr-1" />Start</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;
