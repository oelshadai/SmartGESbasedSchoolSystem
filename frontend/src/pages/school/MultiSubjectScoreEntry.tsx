import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Save, User, ArrowLeft, BookOpen, Users } from 'lucide-react';
import secureApiClient from '@/lib/secureApiClient';

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  class_name: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface ScoreData {
  [key: string]: {
    ca1?: number;
    ca2?: number;
    exam?: number;
  };
}

const MultiSubjectScoreEntry = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const selectedClass = searchParams.get('class') || '';
  const selectedTerm = searchParams.get('term') || '';
  const selectedSession = searchParams.get('session') || '';
  const selectedSubjectIds = searchParams.get('subjects')?.split(',') || [];

  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [scores, setScores] = useState<ScoreData>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'student' | 'subject'>('student');

  const currentStudent = students[currentStudentIndex];
  const currentSubject = subjects[currentSubjectIndex];
  const sessionKey = `multi_scores_${selectedClass}_${selectedTerm}_${selectedSession}`;

  // Load session data
  useEffect(() => {
    const savedScores = localStorage.getItem(sessionKey);
    if (savedScores) {
      setScores(JSON.parse(savedScores));
    }
  }, [sessionKey]);

  // Save to session
  useEffect(() => {
    if (Object.keys(scores).length > 0) {
      localStorage.setItem(sessionKey, JSON.stringify(scores));
    }
  }, [scores, sessionKey]);

  const fetchStudents = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const response = await secureApiClient.get(`/students/?class_id=${selectedClass}`);
      setStudents(Array.isArray(response) ? response : response.results || response.data || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await secureApiClient.get('/schools/subjects/');
      const allSubjects = Array.isArray(response) ? response : response.results || response.data || [];
      setSubjects(allSubjects.filter((subject: Subject) => selectedSubjectIds.includes(subject.id)));
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  useEffect(() => {
    if (!selectedClass || !selectedTerm || !selectedSession || selectedSubjectIds.length === 0) {
      navigate('/school/score-entry-setup');
      return;
    }
    
    fetchStudents();
    fetchSubjects();
  }, [selectedClass, selectedTerm, selectedSession, selectedSubjectIds]);

  const getScoreKey = (studentId: string, subjectId: string) => `${studentId}_${subjectId}`;

  const updateScore = (studentId: string, subjectId: string, scoreType: 'ca1' | 'ca2' | 'exam', value: string) => {
    const key = getScoreKey(studentId, subjectId);
    const numValue = value === '' ? undefined : Number(value);
    
    setScores(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [scoreType]: numValue
      }
    }));
  };

  const getScore = (studentId: string, subjectId: string, scoreType: 'ca1' | 'ca2' | 'exam'): string => {
    const key = getScoreKey(studentId, subjectId);
    const score = scores[key]?.[scoreType];
    return score !== undefined ? score.toString() : '';
  };

  const getTotalScore = (studentId: string, subjectId: string): number => {
    const key = getScoreKey(studentId, subjectId);
    const scoreData = scores[key];
    if (!scoreData) return 0;
    return (scoreData.ca1 || 0) + (scoreData.ca2 || 0) + (scoreData.exam || 0);
  };

  const navigateStudent = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentStudentIndex > 0) {
      setCurrentStudentIndex(currentStudentIndex - 1);
    } else if (direction === 'next' && currentStudentIndex < students.length - 1) {
      setCurrentStudentIndex(currentStudentIndex + 1);
    }
  };

  const navigateSubject = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentSubjectIndex > 0) {
      setCurrentSubjectIndex(currentSubjectIndex - 1);
    } else if (direction === 'next' && currentSubjectIndex < subjects.length - 1) {
      setCurrentSubjectIndex(currentSubjectIndex + 1);
    }
  };

  const saveScores = async () => {
    setSaving(true);
    try {
      await secureApiClient.post('/scores/bulk/', {
        class_id: selectedClass,
        term: selectedTerm,
        session: selectedSession,
        scores: scores
      });
      localStorage.removeItem(sessionKey);
      setScores({});
      alert('Scores saved successfully!');
    } catch (err) {
      console.error('Failed to save scores:', err);
      alert('Failed to save scores. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading students and subjects...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/school/score-entry-setup')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Setup
          </Button>
          <h1 className="text-2xl font-bold">Multi-Subject Score Entry</h1>
        </div>
        <Button onClick={saveScores} disabled={saving || Object.keys(scores).length === 0}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Scores'}
        </Button>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div><strong>Class:</strong> {students[0]?.class_name}</div>
            <div><strong>Term:</strong> {selectedTerm === '1' ? 'First' : selectedTerm === '2' ? 'Second' : 'Third'} Term</div>
            <div><strong>Session:</strong> {selectedSession}</div>
            <div><strong>Subjects:</strong> {subjects.length} selected</div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'student' | 'subject')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="student" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            By Student
          </TabsTrigger>
          <TabsTrigger value="subject" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            By Subject
          </TabsTrigger>
        </TabsList>

        <TabsContent value="student" className="space-y-6">
          {currentStudent && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5" />
                    <div>
                      <CardTitle>{currentStudent.full_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        ID: {currentStudent.student_id} | Class: {currentStudent.class_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigateStudent('prev')}
                      disabled={currentStudentIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentStudentIndex + 1} of {students.length}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigateStudent('next')}
                      disabled={currentStudentIndex === students.length - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enter Scores for All Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {subjects.map(subject => (
                      <div key={subject.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <BookOpen className="h-4 w-4" />
                          <h3 className="font-medium">{subject.name}</h3>
                          <Badge variant="outline">{subject.code}</Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-4 items-center">
                          <div>
                            <label className="text-xs text-muted-foreground">CA1 (20)</label>
                            <Input
                              key={`${currentStudent.id}_${subject.id}_ca1`}
                              type="number"
                              max="20"
                              min="0"
                              value={getScore(currentStudent.id, subject.id, 'ca1')}
                              onChange={e => updateScore(currentStudent.id, subject.id, 'ca1', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">CA2 (20)</label>
                            <Input
                              key={`${currentStudent.id}_${subject.id}_ca2`}
                              type="number"
                              max="20"
                              min="0"
                              value={getScore(currentStudent.id, subject.id, 'ca2')}
                              onChange={e => updateScore(currentStudent.id, subject.id, 'ca2', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Exam (60)</label>
                            <Input
                              key={`${currentStudent.id}_${subject.id}_exam`}
                              type="number"
                              max="60"
                              min="0"
                              value={getScore(currentStudent.id, subject.id, 'exam')}
                              onChange={e => updateScore(currentStudent.id, subject.id, 'exam', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div className="text-center">
                            <label className="text-xs text-muted-foreground">Total</label>
                            <div className="text-lg font-bold text-green-600">
                              {getTotalScore(currentStudent.id, subject.id)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="subject" className="space-y-6">
          {currentSubject && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5" />
                    <div>
                      <CardTitle>{currentSubject.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Code: {currentSubject.code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigateSubject('prev')}
                      disabled={currentSubjectIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentSubjectIndex + 1} of {subjects.length}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigateSubject('next')}
                      disabled={currentSubjectIndex === subjects.length - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    All Students - {currentSubject.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Desktop Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">Student</th>
                          <th className="text-center p-2 font-medium">CA1<br/><span className="text-xs text-muted-foreground">/20</span></th>
                          <th className="text-center p-2 font-medium">CA2<br/><span className="text-xs text-muted-foreground">/20</span></th>
                          <th className="text-center p-2 font-medium">Exam<br/><span className="text-xs text-muted-foreground">/60</span></th>
                          <th className="text-center p-2 font-medium bg-green-50">Total<br/><span className="text-xs text-muted-foreground">/100</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map(student => (
                          <tr key={student.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">
                              <div>
                                <div className="font-medium">{student.full_name}</div>
                                <div className="text-xs text-muted-foreground">{student.student_id}</div>
                              </div>
                            </td>
                            <td className="p-2">
                              <Input
                                key={`${student.id}_${currentSubject.id}_ca1`}
                                type="number"
                                max="20"
                                min="0"
                                className="w-16 text-center"
                                value={getScore(student.id, currentSubject.id, 'ca1')}
                                onChange={e => updateScore(student.id, currentSubject.id, 'ca1', e.target.value)}
                                placeholder="0"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                key={`${student.id}_${currentSubject.id}_ca2`}
                                type="number"
                                max="20"
                                min="0"
                                className="w-16 text-center"
                                value={getScore(student.id, currentSubject.id, 'ca2')}
                                onChange={e => updateScore(student.id, currentSubject.id, 'ca2', e.target.value)}
                                placeholder="0"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                key={`${student.id}_${currentSubject.id}_exam`}
                                type="number"
                                max="60"
                                min="0"
                                className="w-16 text-center"
                                value={getScore(student.id, currentSubject.id, 'exam')}
                                onChange={e => updateScore(student.id, currentSubject.id, 'exam', e.target.value)}
                                placeholder="0"
                              />
                            </td>
                            <td className="p-2 bg-green-50">
                              <div className="text-center font-bold">
                                {getTotalScore(student.id, currentSubject.id)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-3">
                    {students.map(student => (
                      <div key={student.id} className="border rounded-xl p-3 space-y-2 bg-card">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground">{student.student_id}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg px-3 py-1 flex-shrink-0">
                            <p className="text-xs text-muted-foreground text-center">Total</p>
                            <p className="font-bold text-center">{getTotalScore(student.id, currentSubject.id)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">CA1 /20</label>
                            <Input
                              key={`m_${student.id}_${currentSubject.id}_ca1`}
                              type="number"
                              max="20"
                              min="0"
                              className="h-9 text-center text-sm"
                              value={getScore(student.id, currentSubject.id, 'ca1')}
                              onChange={e => updateScore(student.id, currentSubject.id, 'ca1', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">CA2 /20</label>
                            <Input
                              key={`m_${student.id}_${currentSubject.id}_ca2`}
                              type="number"
                              max="20"
                              min="0"
                              className="h-9 text-center text-sm"
                              value={getScore(student.id, currentSubject.id, 'ca2')}
                              onChange={e => updateScore(student.id, currentSubject.id, 'ca2', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Exam /60</label>
                            <Input
                              key={`m_${student.id}_${currentSubject.id}_exam`}
                              type="number"
                              max="60"
                              min="0"
                              className="h-9 text-center text-sm"
                              value={getScore(student.id, currentSubject.id, 'exam')}
                              onChange={e => updateScore(student.id, currentSubject.id, 'exam', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MultiSubjectScoreEntry;