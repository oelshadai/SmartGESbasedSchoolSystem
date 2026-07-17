import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Save, Send, GripVertical, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CreateAssignment = () => {
  const [questions, setQuestions] = useState([
    { id: 1, text: '', type: 'mcq', options: [{ text: '', correct: false }, { text: '', correct: false }] },
  ]);
  const [isTimed, setIsTimed] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { id: questions.length + 1, text: '', type: 'mcq', options: [{ text: '', correct: false }, { text: '', correct: false }] }]);
  };

  const removeQuestion = (id: number) => {
    if (questions.length > 1) setQuestions(questions.filter((q) => q.id !== id));
  };

  const addOption = (qId: number) => {
    setQuestions(questions.map((q) => q.id === qId ? { ...q, options: [...q.options, { text: '', correct: false }] } : q));
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-y-auto -m-6">
      {/* Animated Background Logo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5">
          <BookOpen className="w-96 h-96 text-blue-600 animate-pulse" />
        </div>
        <div className="absolute top-20 right-20 opacity-3">
          <BookOpen className="w-32 h-32 text-blue-400 animate-bounce" style={{ animationDuration: '3s' }} />
        </div>
        <div className="absolute bottom-20 left-20 opacity-3">
          <BookOpen className="w-24 h-24 text-blue-500 animate-spin" style={{ animationDuration: '8s' }} />
        </div>
      </div>

      {/* Main Form Container */}
      <div className="relative z-10 max-w-5xl mx-auto p-6">
        {/* Header with Blue Border */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-4 border-blue-500 shadow-2xl shadow-blue-500/20 mb-8 p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
              Create New Assignment
            </h1>
            <p className="text-blue-600 text-lg font-medium">Build engaging assignments for your students</p>
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-8 animate-fade-in">
          {/* Assignment Details Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-blue-300 shadow-xl shadow-blue-500/10 p-8 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-blue-800">Assignment Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-blue-700 font-semibold">Title</Label>
                <Input 
                  placeholder="e.g. Mathematics Quiz - Chapter 5" 
                  className="border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12 text-lg" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-blue-700 font-semibold">Type</Label>
                <select className="w-full h-12 rounded-xl border-2 border-blue-200 focus:border-blue-500 bg-white px-4 text-lg font-medium">
                  <option value="QUIZ">📝 Quiz</option>
                  <option value="HOMEWORK">📚 Homework</option>
                  <option value="PROJECT">🎯 Project</option>
                  <option value="EXAM">📋 Exam</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-blue-700 font-semibold">Subject / Class</Label>
                <Input 
                  placeholder="e.g. Mathematics - Basic 7A" 
                  className="border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12 text-lg" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-blue-700 font-semibold">Due Date</Label>
                <Input 
                  type="datetime-local" 
                  className="border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12 text-lg" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-blue-700 font-semibold">Max Score</Label>
                <Input 
                  type="number" 
                  placeholder="e.g. 10" 
                  className="border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12 text-lg" 
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-between flex-1 bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div>
                    <Label className="text-blue-700 font-semibold">Timed Quiz</Label>
                    <p className="text-sm text-blue-600">Set a time limit</p>
                  </div>
                  <Switch checked={isTimed} onCheckedChange={setIsTimed} className="data-[state=checked]:bg-blue-500" />
                </div>
                {isTimed && (
                  <div className="w-32 space-y-2">
                    <Label className="text-blue-700 font-semibold">Minutes</Label>
                    <Input 
                      type="number" 
                      placeholder="30" 
                      className="border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12 text-lg" 
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <Label className="text-blue-700 font-semibold">Description</Label>
              <Textarea 
                placeholder="Describe the assignment..." 
                className="border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl min-h-[100px] text-lg" 
              />
            </div>
          </div>

          {/* Questions Section */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-blue-300 shadow-xl shadow-blue-500/10 p-8 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">{questions.length}</span>
                </div>
                <h3 className="text-2xl font-bold text-blue-800">Questions ({questions.length})</h3>
              </div>
              <Button 
                variant="outline" 
                onClick={addQuestion}
                className="border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white rounded-xl px-6 py-3 font-semibold transition-all duration-300"
              >
                <Plus className="h-5 w-5 mr-2" />Add Question
              </Button>
            </div>

            <div className="space-y-6">
              {questions.map((q, qi) => (
                <div key={q.id} className="bg-gradient-to-r from-blue-50 to-white rounded-xl border-2 border-blue-200 p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-blue-400 cursor-move" />
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 px-3 py-1 text-sm font-bold">
                        Q{qi + 1}
                      </Badge>
                      <select
                        className="h-10 rounded-lg border-2 border-blue-200 bg-white px-3 text-sm font-medium focus:border-blue-500"
                        defaultValue={q.type}
                      >
                        <option value="mcq">📝 Multiple Choice</option>
                        <option value="true_false">✅ True / False</option>
                        <option value="short_answer">💭 Short Answer</option>
                        <option value="essay">📄 Essay</option>
                      </select>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg" 
                      onClick={() => removeQuestion(q.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <Label className="text-blue-700 font-semibold">Question Text</Label>
                    <Textarea 
                      placeholder="Enter your question..." 
                      className="border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl min-h-[80px] text-lg" 
                    />
                  </div>

                  {q.type === 'mcq' && (
                    <div className="space-y-3">
                      <Label className="text-blue-700 font-semibold">Options</Label>
                      {q.options.map((_, oi) => (
                        <div key={oi} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-blue-200">
                          <input 
                            type="radio" 
                            name={`q${q.id}`} 
                            className="h-5 w-5 text-blue-500 focus:ring-blue-500" 
                          />
                          <Input 
                            placeholder={`Option ${oi + 1}`} 
                            className="flex-1 border-blue-200 focus:border-blue-500 rounded-lg" 
                          />
                          {q.options.length > 2 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:bg-red-50 shrink-0 rounded-lg"
                              onClick={() => setQuestions(questions.map((qn) => qn.id === q.id ? { ...qn, options: qn.options.filter((_, i) => i !== oi) } : qn))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => addOption(q.id)} 
                        className="text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                      >
                        <Plus className="h-4 w-4 mr-1" />Add Option
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pb-8">
            <Button 
              variant="outline"
              className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 rounded-xl px-8 py-4 text-lg font-semibold transition-all duration-300"
            >
              <Save className="h-5 w-5 mr-2" />Save as Draft
            </Button>
            <Button 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Send className="h-5 w-5 mr-2" />Publish Assignment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAssignment;
