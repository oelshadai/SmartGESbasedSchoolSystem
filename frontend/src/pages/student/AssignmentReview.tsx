import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Download, 
  ArrowLeft,
  Target,
  Award,
  BookOpen,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';
import { toast } from 'sonner';

interface QuestionReview {
  id: number;
  question_text: string;
  question_type: 'mcq' | 'short_answer' | 'project';
  points: number;
  points_earned: number;
  is_correct: boolean;
  explanation?: string;
  options?: Array<{
    id: number;
    option_text: string;
    is_correct: boolean;
  }>;
  correct_option_id?: number;
  student_selected_option_id?: number;
  expected_answer?: string;
  student_answer?: string;
  teacher_comment?: string;
  uploaded_files?: Array<{
    id: number;
    filename: string;
    url: string;
    size: number;
  }>;
}

interface ReviewData {
  submission: {
    id: number;
    status: string;
    score: number;
    submitted_at: string;
    graded_at: string;
    teacher_feedback: string;
  };
  assignment: {
    id: number;
    title: string;
    description: string;
    assignment_type: string;
    max_score: number;
  };
  questions?: QuestionReview[];
  quiz_summary?: {
    total_questions: number;
    correct_answers: number;
    wrong_answers: number;
    accuracy_percentage: number;
    total_points: number;
    earned_points: number;
    score_percentage: number;
    final_score: number;
    time_taken: number;
  };
  submission_content?: {
    text_content: string;
    file_url: string;
    file_name: string;
  };
  grading?: {
    score: number;
    max_score: number;
    percentage: number;
    teacher_feedback: string;
    graded_at: string;
  };
}

const AssignmentReview = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (submissionId) {
      fetchReviewData();
    }
  }, [submissionId]);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      const response = await secureApiClient.get(`/assignments/review/${submissionId}/review/`);
      setReviewData(response);
    } catch (error) {
      console.error('Failed to fetch review data:', error);
      toast.error('Failed to load assignment review');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (isCorrect: boolean) => {
    return isCorrect ? 'default' : 'destructive';
  };

  const downloadFile = async (fileUrl: string, filename: string) => {
    try {
      const response = await secureApiClient.get(fileUrl, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assignment review...</p>
        </div>
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Assignment review not found or not available yet.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isQuiz = reviewData.assignment.assignment_type === 'QUIZ' || reviewData.assignment.assignment_type === 'EXAM';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{reviewData.assignment.title}</h1>
            <p className="text-muted-foreground">Assignment Review</p>
          </div>
        </div>
        <Badge variant={reviewData.submission.status === 'GRADED' ? 'default' : 'secondary'}>
          {reviewData.submission.status}
        </Badge>
      </div>

      {/* Score Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Your Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isQuiz && reviewData.quiz_summary ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {reviewData.quiz_summary.final_score}/{reviewData.assignment.max_score}
                </div>
                <div className="text-sm text-muted-foreground">Final Score</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(reviewData.quiz_summary.accuracy_percentage)}`}>
                  {reviewData.quiz_summary.accuracy_percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {reviewData.quiz_summary.correct_answers}
                </div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {reviewData.quiz_summary.wrong_answers}
                </div>
                <div className="text-sm text-muted-foreground">Wrong</div>
              </div>
            </div>
          ) : reviewData.grading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {reviewData.grading.score}/{reviewData.grading.max_score}
                </div>
                <div className="text-sm text-muted-foreground">Score</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(reviewData.grading.percentage)}`}>
                  {reviewData.grading.percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Percentage</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  Graded: {new Date(reviewData.grading.graded_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-lg text-muted-foreground">
                {reviewData.submission.status === 'SUBMITTED' ? 'Awaiting Grade' : 'No score available'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teacher Feedback */}
      {(reviewData.submission.teacher_feedback || reviewData.grading?.teacher_feedback) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Teacher Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm">
                {reviewData.submission.teacher_feedback || reviewData.grading?.teacher_feedback}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz Questions Review */}
      {isQuiz && reviewData.questions && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Question Review
          </h2>
          
          {reviewData.questions.map((question, index) => (
            <Card key={question.id} className={`border-l-4 ${question.is_correct ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">Question {index + 1}</span>
                      <Badge variant={getScoreBadgeVariant(question.is_correct)}>
                        {question.points_earned}/{question.points} pts
                      </Badge>
                      {question.is_correct ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <p className="text-sm font-medium">{question.question_text}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Multiple Choice Questions */}
                {question.question_type === 'mcq' && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option) => {
                      const isStudentChoice = option.id === question.student_selected_option_id;
                      const isCorrectAnswer = option.is_correct;
                      
                      let optionClass = 'p-3 rounded border ';
                      if (isCorrectAnswer) {
                        optionClass += 'bg-green-50 border-green-200 text-green-800';
                      } else if (isStudentChoice && !isCorrectAnswer) {
                        optionClass += 'bg-red-50 border-red-200 text-red-800';
                      } else {
                        optionClass += 'bg-gray-50 border-gray-200';
                      }
                      
                      return (
                        <div key={option.id} className={optionClass}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{option.option_text}</span>
                            <div className="flex items-center gap-2">
                              {isStudentChoice && (
                                <Badge variant="outline" className="text-xs">
                                  Your Answer
                                </Badge>
                              )}
                              {isCorrectAnswer && (
                                <Badge variant="default" className="text-xs bg-green-600">
                                  Correct
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Short Answer Questions */}
                {question.question_type === 'short_answer' && (
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-green-700 mb-1">Correct Answer:</div>
                      <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                        {question.expected_answer}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-700 mb-1">Your Answer:</div>
                      <div className={`p-3 border rounded text-sm ${
                        question.is_correct 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}>
                        {question.student_answer || 'No answer provided'}
                      </div>
                    </div>
                    {question.teacher_comment && (
                      <div>
                        <div className="text-sm font-medium text-purple-700 mb-1">Teacher Comment:</div>
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded text-sm">
                          {question.teacher_comment}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Project Questions */}
                {question.question_type === 'project' && (
                  <div className="space-y-3">
                    {question.student_answer && (
                      <div>
                        <div className="text-sm font-medium text-blue-700 mb-1">Your Response:</div>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                          {question.student_answer}
                        </div>
                      </div>
                    )}
                    
                    {question.uploaded_files && question.uploaded_files.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-blue-700 mb-2">Uploaded Files:</div>
                        <div className="space-y-2">
                          {question.uploaded_files.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 border rounded">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">{file.filename}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadFile(file.url, file.filename)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {question.teacher_comment && (
                      <div>
                        <div className="text-sm font-medium text-purple-700 mb-1">Teacher Feedback:</div>
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded text-sm">
                          {question.teacher_comment}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Question Explanation */}
                {question.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="text-sm font-medium text-blue-700 mb-1">Explanation:</div>
                    <div className="text-sm text-blue-800">{question.explanation}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Regular Assignment Content */}
      {!isQuiz && reviewData.submission_content && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Your Submission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviewData.submission_content.text_content && (
              <div>
                <div className="text-sm font-medium mb-2">Text Submission:</div>
                <div className="p-4 bg-muted/50 rounded border">
                  <pre className="whitespace-pre-wrap text-sm">
                    {reviewData.submission_content.text_content}
                  </pre>
                </div>
              </div>
            )}
            
            {reviewData.submission_content.file_url && (
              <div>
                <div className="text-sm font-medium mb-2">File Submission:</div>
                <div className="flex items-center justify-between p-3 bg-gray-50 border rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{reviewData.submission_content.file_name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadFile(
                      reviewData.submission_content!.file_url, 
                      reviewData.submission_content!.file_name
                    )}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submission Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Submission Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Submitted:</span>{' '}
              {new Date(reviewData.submission.submitted_at).toLocaleString()}
            </div>
            {reviewData.submission.graded_at && (
              <div>
                <span className="font-medium">Graded:</span>{' '}
                {new Date(reviewData.submission.graded_at).toLocaleString()}
              </div>
            )}
            {isQuiz && reviewData.quiz_summary?.time_taken && (
              <div>
                <span className="font-medium">Time Taken:</span>{' '}
                {Math.floor(reviewData.quiz_summary.time_taken / 60)} minutes{' '}
                {reviewData.quiz_summary.time_taken % 60} seconds
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentReview;