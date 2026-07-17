import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';
import { toast } from 'sonner';

interface Assignment {
  id: number;
  title: string;
  description: string;
  instructions: string;
  assignment_type: string;
  due_date: string;
  max_score: number;
  time_limit: number | null;
  max_attempts: number;
  status: string;
  class_instance: number;
  has_mcq_questions: boolean;
  has_short_answer_questions: boolean;
}

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  points: number;
  order: number;
  options: QuestionOption[];
}

interface QuestionOption {
  id: number;
  option_text: string;
  is_correct: boolean;
  order: number;
}

const AssignmentEdit = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      // Try to get individual assignment details
      const response = await secureApiClient.get(`/assignments/teacher/${assignmentId}/`);
      
      // Convert ISO date to datetime-local format for the input
      const formattedAssignment = {
        ...response,
        due_date: response.due_date ? new Date(response.due_date).toISOString().slice(0, 16) : ''
      };
      
      setAssignment({
        ...formattedAssignment,
        has_mcq_questions: response.has_mcq_questions ?? false,
        has_short_answer_questions: response.has_short_answer_questions ?? false,
      });
      
      // Fetch questions if it's a quiz/exam
      if (response.assignment_type === 'QUIZ' || response.assignment_type === 'EXAM') {
        try {
          const questionsResponse = await secureApiClient.get(`/assignments/teacher/${assignmentId}/questions/`);
          // Ensure questionsResponse is an array
          if (Array.isArray(questionsResponse)) {
            // Mark as saved so handleSaveAssignment skips them
            setQuestions(questionsResponse.map((q: Question) => ({ ...q, saved: true })));
          } else {
            console.warn('Questions response is not an array:', questionsResponse);
            setQuestions([]);
          }
        } catch (questionError) {
          console.warn('No questions endpoint available, questions will be empty');
          setQuestions([]);
        }
      } else {
        // Not a quiz/exam, no questions needed
        setQuestions([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch assignment:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message || 'Failed to load assignment';
      toast.error(errorMessage);
      navigate('/teacher/assignments');
    } finally {
      setLoading(false);
    }
  };

  // Unsaved questions have a temp Date.now() id (no 'saved' flag on the object)
  const isUnsaved = (q: Question) => !('saved' in q);

  const handleSaveAssignment = async () => {
    if (!assignment) return;

    try {
      setSaving(true);
      
      const dueDateISO = assignment.due_date ? new Date(assignment.due_date).toISOString() : null;
      
      await secureApiClient.patch(`/assignments/teacher/${assignmentId}/`, {
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions,
        due_date: dueDateISO,
        max_score: assignment.max_score,
        time_limit: assignment.time_limit,
        max_attempts: assignment.max_attempts,
        has_mcq_questions: assignment.has_mcq_questions,
        has_short_answer_questions: assignment.has_short_answer_questions
      });
      
      // Save only new (unsaved) questions
      if (assignment.assignment_type === 'QUIZ' || assignment.assignment_type === 'EXAM') {
        for (const question of questions) {
          if (!isUnsaved(question)) continue;
          try {
            await secureApiClient.post(`/assignments/teacher/${assignmentId}/add-question/`, {
              question_text: question.question_text,
              question_type: question.question_type,
              points: question.points,
              options: question.options.map((opt, i) => ({
                option_text: opt.option_text,
                is_correct: opt.is_correct,
                order: i + 1
              }))
            });
          } catch (qError: any) {
            const msg = qError.response?.data?.error || 'Failed to save a question';
            toast.error(msg);
          }
        }
      }
      
      toast.success('Assignment saved successfully');
      await fetchAssignment();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.message || 'Failed to update assignment';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishFromEdit = async () => {
    if (!assignment) return;
    // Save first, then publish
    await handleSaveAssignment();
    try {
      const response = await secureApiClient.post(`/assignments/teacher/${assignmentId}/publish_assignment/`);
      toast.success(response.message || 'Assignment published successfully');
      navigate('/teacher/assignments');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to publish';
      toast.error(errorMsg);
    }
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      question_text: '',
      question_type: 'mcq',
      points: 1,
      order: questions.length + 1,
      options: [
        { id: Date.now() + 1, option_text: '', is_correct: false, order: 1 },
        { id: Date.now() + 2, option_text: '', is_correct: false, order: 2 }
      ]
      // no 'saved' key → isUnsaved() returns true
    } as unknown as Question;
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (questionIndex: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      [field]: value
    };
    setQuestions(updatedQuestions);
  };

  const handleDeleteQuestion = (questionIndex: number) => {
    if (confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = questions.filter((_, index) => index !== questionIndex);
      setQuestions(updatedQuestions);
    }
  };

  const handleAddOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    const newOption: QuestionOption = {
      id: Date.now(),
      option_text: '',
      is_correct: false,
      order: question.options.length + 1
    };
    question.options.push(newOption);
    setQuestions(updatedQuestions);
  };

  const handleUpdateOption = (questionIndex: number, optionIndex: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    
    if (field === 'is_correct' && value) {
      // Only one option can be correct for MCQ
      question.options.forEach((opt, idx) => {
        opt.is_correct = idx === optionIndex;
      });
    } else {
      question.options[optionIndex] = {
        ...question.options[optionIndex],
        [field]: value
      };
    }
    
    setQuestions(updatedQuestions);
  };

  const handleDeleteOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    if (question.options.length > 2) {
      question.options.splice(optionIndex, 1);
      setQuestions(updatedQuestions);
    } else {
      toast.error('A question must have at least 2 options');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading assignment...</p>
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
            <h1 className="text-2xl font-bold">Edit Assignment</h1>
            <p className="text-muted-foreground">Modify assignment details and questions</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveAssignment} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          {assignment?.status === 'DRAFT' && (
            <Button onClick={handlePublishFromEdit} disabled={saving}>
              {saving ? 'Publishing...' : 'Save & Publish'}
            </Button>
          )}
        </div>
      </div>

      {/* Assignment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={assignment.title}
              onChange={(e) => setAssignment({...assignment, title: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={assignment.description}
              onChange={(e) => setAssignment({...assignment, description: e.target.value})}
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={assignment.instructions}
              onChange={(e) => setAssignment({...assignment, instructions: e.target.value})}
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={assignment.due_date}
                onChange={(e) => setAssignment({...assignment, due_date: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="max_score">Max Score</Label>
              <Input
                id="max_score"
                type="number"
                min="1"
                value={assignment.max_score}
                onChange={(e) => setAssignment({...assignment, max_score: parseInt(e.target.value)})}
              />
            </div>
          </div>
          
          {(assignment.assignment_type === 'QUIZ' || assignment.assignment_type === 'EXAM') && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="time_limit">Time Limit (minutes)</Label>
                  <Input
                    id="time_limit"
                    type="number"
                    min="1"
                    value={assignment.time_limit || ''}
                    onChange={(e) => setAssignment({...assignment, time_limit: parseInt(e.target.value) || null})}
                  />
                </div>
                <div>
                  <Label htmlFor="max_attempts">Max Attempts</Label>
                  <Input
                    id="max_attempts"
                    type="number"
                    min="1"
                    value={assignment.max_attempts}
                    onChange={(e) => setAssignment({...assignment, max_attempts: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-blue-50/20">
                <Label className="font-semibold text-sm">Quiz/Exam Question Types</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={assignment.has_mcq_questions}
                      onChange={(e) => setAssignment({...assignment, has_mcq_questions: e.target.checked})}
                    />
                    <span>Multiple Choice (auto-graded)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={assignment.has_short_answer_questions}
                      onChange={(e) => setAssignment({...assignment, has_short_answer_questions: e.target.checked})}
                    />
                    <span>Short Answer (manual grade)</span>
                  </label>
                </div>
                {(!assignment.has_mcq_questions && !assignment.has_short_answer_questions) && (
                  <p className="text-sm text-red-700 mt-2">Please select at least one question type before saving.</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Questions Section (for Quiz/Exam) */}
      {(assignment.assignment_type === 'QUIZ' || assignment.assignment_type === 'EXAM') && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Questions ({questions.length})</CardTitle>
              <Button onClick={handleAddQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.isArray(questions) && questions.map((question, questionIndex) => (
              <div key={question.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Question {questionIndex + 1}</h4>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteQuestion(questionIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div>
                  <Label>Question Text</Label>
                  <Textarea
                    value={question.question_text}
                    onChange={(e) => handleUpdateQuestion(questionIndex, 'question_text', e.target.value)}
                    placeholder="Enter your question..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Question Type</Label>
                    <Select
                      value={question.question_type}
                      onValueChange={(value) => handleUpdateQuestion(questionIndex, 'question_type', value)}
                    >
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
                    <Label>Points</Label>
                    <Input
                      type="number"
                      min="1"
                      value={question.points}
                      onChange={(e) => handleUpdateQuestion(questionIndex, 'points', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                {question.question_type === 'mcq' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Options</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddOption(questionIndex)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Option
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {Array.isArray(question.options) && question.options.map((option, optionIndex) => (
                        <div key={option.id} className="flex gap-2 items-center">
                          <Input
                            placeholder={`Option ${optionIndex + 1}`}
                            value={option.option_text}
                            onChange={(e) => handleUpdateOption(questionIndex, optionIndex, 'option_text', e.target.value)}
                            className="flex-1"
                          />
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              name={`correct_${questionIndex}`}
                              checked={option.is_correct}
                              onChange={() => handleUpdateOption(questionIndex, optionIndex, 'is_correct', true)}
                            />
                            <span className="text-sm">Correct</span>
                          </label>
                          {question.options.length > 2 && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteOption(questionIndex, optionIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {questions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No questions added yet.</p>
                <Button onClick={handleAddQuestion} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Question
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssignmentEdit;