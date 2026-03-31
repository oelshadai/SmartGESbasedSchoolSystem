import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  BookOpen,
  Award,
  Target,
  TrendingUp
} from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';
import { toast } from 'sonner';

interface Submission {
  id: number;
  assignment: {
    id: number;
    title: string;
    description: string;
    assignment_type: string;
    max_score: number;
    due_date: string;
  };
  status: string;
  score: number | null;
  submitted_at: string;
  graded_at: string | null;
  teacher_feedback: string;
  can_review: boolean;
  attempts_count: number;
}

interface QuizStats {
  total_quizzes: number;
  average_score: number;
  best_score: number;
  recent_quizzes: Array<{
    assignment_title: string;
    score: number;
    max_score: number;
    percentage: number;
    submitted_at: string;
  }>;
}

const MySubmissions = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchSubmissions();
    fetchQuizStats();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await secureApiClient.get('/assignments/review/my-submissions/');
      setSubmissions(response || []);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizStats = async () => {
    try {
      const response = await secureApiClient.get('/assignments/review/quiz-statistics/');
      setQuizStats(response);
    } catch (error) {
      console.error('Failed to fetch quiz statistics:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GRADED': return 'default';
      case 'SUBMITTED': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'GRADED': return CheckCircle;
      case 'SUBMITTED': return Clock;
      default: return XCircle;
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'QUIZ':
      case 'EXAM':
        return BookOpen;
      case 'PROJECT':
        return Target;
      default:
        return FileText;
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    const matchesType = typeFilter === 'all' || submission.assignment.assignment_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleReviewSubmission = (submissionId: number) => {
    navigate(`/student/assignments/review/${submissionId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Submissions</h1>
        <p className="text-muted-foreground">Review your submitted assignments and quiz results</p>
      </div>

      {/* Quiz Statistics */}
      {quizStats && quizStats.total_quizzes > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quiz Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{quizStats.total_quizzes}</div>
                <div className="text-sm text-muted-foreground">Total Quizzes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{quizStats.average_score.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Average Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{quizStats.best_score}</div>
                <div className="text-sm text-muted-foreground">Best Score</div>
              </div>
            </div>
            
            {quizStats.recent_quizzes.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recent Quiz Results:</h4>
                <div className="space-y-2">
                  {quizStats.recent_quizzes.slice(0, 3).map((quiz, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm font-medium">{quiz.assignment_title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{quiz.score}/{quiz.max_score}</span>
                        <Badge variant={quiz.percentage >= 70 ? 'default' : 'secondary'}>
                          {quiz.percentage.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="GRADED">Graded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="QUIZ">Quiz</SelectItem>
                <SelectItem value="EXAM">Exam</SelectItem>
                <SelectItem value="HOMEWORK">Homework</SelectItem>
                <SelectItem value="PROJECT">Project</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Submissions Found</h3>
              <p className="text-muted-foreground">
                {submissions.length === 0 
                  ? "You haven't submitted any assignments yet."
                  : "No submissions match your current filters."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSubmissions.map((submission) => {
            const StatusIcon = getStatusIcon(submission.status);
            const TypeIcon = getTypeIcon(submission.assignment.assignment_type);
            
            return (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <TypeIcon className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">{submission.assignment.title}</h3>
                        <Badge variant={getStatusColor(submission.status)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {submission.status}
                        </Badge>
                        <Badge variant="outline">
                          {submission.assignment.assignment_type}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {submission.assignment.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                        </div>
                        
                        {submission.graded_at && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Graded: {new Date(submission.graded_at).toLocaleDateString()}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          Max Score: {submission.assignment.max_score}
                        </div>
                        
                        {submission.attempts_count > 1 && (
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            Attempts: {submission.attempts_count}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      {submission.score !== null && (
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(submission.score, submission.assignment.max_score)}`}>
                            {submission.score}/{submission.assignment.max_score}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {((submission.score / submission.assignment.max_score) * 100).toFixed(1)}%
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        {submission.can_review ? (
                          <Button
                            size="sm"
                            onClick={() => handleReviewSubmission(submission.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            <Clock className="h-4 w-4 mr-2" />
                            Pending
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {submission.teacher_feedback && (
                    <div className="mt-4 p-3 bg-muted/50 rounded border-l-4 border-l-primary">
                      <div className="text-sm font-medium mb-1">Teacher Feedback:</div>
                      <div className="text-sm text-muted-foreground">
                        {submission.teacher_feedback}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MySubmissions;