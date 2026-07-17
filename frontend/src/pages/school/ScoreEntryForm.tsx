import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Save, User, ArrowLeft } from 'lucide-react';
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
  [studentId: string]: {
    [subjectId: string]: {
      ca1?: number;
      ca2?: number;
      exam?: number;
    };
  };
}

const ScoreEntryForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const selectedClass = searchParams.get('class') || '';
  const selectedTerm = searchParams.get('term') || '';
  const selectedSession = searchParams.get('session') || '';
  const selectedSubjectIds = searchParams.get('subjects')?.split(',') || [];

  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<ScoreData>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentStudent = students[currentIndex];
  const sessionKey = `scores_${selectedClass}_${selectedTerm}_${selectedSession}`;

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
      // Filter subjects based on selected IDs
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

  const updateScore = (subjectId: string, scoreType: 'ca1' | 'ca2' | 'exam', value: string) => {
    if (!currentStudent) return;
    
    const numValue = value === '' ? undefined : Number(value);
    setScores(prev => ({
      ...prev,
      [currentStudent.id]: {
        ...prev[currentStudent.id],
        [subjectId]: {
          ...prev[currentStudent.id]?.[subjectId],
          [scoreType]: numValue
        }
      }
    }));
  };

  const getScore = (subjectId: string, scoreType: 'ca1' | 'ca2' | 'exam'): string => {
    if (!currentStudent) return '';
    const score = scores[currentStudent.id]?.[subjectId]?.[scoreType];
    return score !== undefined ? score.toString() : '';
  };

  const navigateStudent = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === 'next' && currentIndex < students.length - 1) {
      setCurrentIndex(currentIndex + 1);
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
        Loading students...
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
          <h1 className="text-2xl font-bold">Score Entry</h1>
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
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} of {students.length}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigateStudent('next')}
                  disabled={currentIndex === students.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enter Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subjects.map(subject => (
                  <div key={subject.id} className="grid grid-cols-5 gap-4 items-center">
                    <div className="font-medium">{subject.name}</div>
                    <div>
                      <label className="text-xs text-muted-foreground">CA1 (20)</label>
                      <Input
                        type="number"
                        max="20"
                        min="0"
                        value={getScore(subject.id, 'ca1')}
                        onChange={e => updateScore(subject.id, 'ca1', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">CA2 (20)</label>
                      <Input
                        type="number"
                        max="20"
                        min="0"
                        value={getScore(subject.id, 'ca2')}
                        onChange={e => updateScore(subject.id, 'ca2', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Exam (60)</label>
                      <Input
                        type="number"
                        max="60"
                        min="0"
                        value={getScore(subject.id, 'exam')}
                        onChange={e => updateScore(subject.id, 'exam', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="text-center font-medium">
                      {(() => {
                        const ca1 = Number(getScore(subject.id, 'ca1')) || 0;
                        const ca2 = Number(getScore(subject.id, 'ca2')) || 0;
                        const exam = Number(getScore(subject.id, 'exam')) || 0;
                        return ca1 + ca2 + exam;
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ScoreEntryForm;