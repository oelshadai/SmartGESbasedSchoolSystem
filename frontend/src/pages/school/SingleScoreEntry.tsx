import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import secureApiClient from '@/lib/secureApiClient';

const SingleScoreEntry = () => {
  const { classId, subjectId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [subjectInfo, setSubjectInfo] = useState<any>(null);
  const [scores, setScores] = useState<{[key: string]: string}>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedStudents, setSavedStudents] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, [classId, subjectId]);

  const fetchData = async () => {
    try {
      const [studentsRes, classRes, subjectRes] = await Promise.all([
        secureApiClient.get(`/students/?class=${classId}`),
        secureApiClient.get(`/schools/classes/${classId}/`),
        secureApiClient.get(`/schools/subjects/${subjectId}/`)
      ]);
      
      const studentsList = Array.isArray(studentsRes) ? studentsRes : studentsRes.results || [];
      setStudents(studentsList);
      setClassInfo(classRes);
      setSubjectInfo(subjectRes);
      
      // Initialize scores
      const initialScores: {[key: string]: string} = {};
      studentsList.forEach((student: any) => {
        initialScores[student.id] = '';
      });
      setScores(initialScores);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (studentId: string, score: string) => {
    // Validate score (0-100)
    if (score === '' || (Number(score) >= 0 && Number(score) <= 100)) {
      setScores(prev => ({ ...prev, [studentId]: score }));
    }
  };

  const saveCurrentScore = async () => {
    const currentStudent = students[currentIndex];
    const score = scores[currentStudent.id];
    
    if (!score || Number(score) < 0 || Number(score) > 100) return;
    
    setSaving(true);
    try {
      await secureApiClient.post('/scores/', {
        student: currentStudent.id,
        subject: subjectId,
        score: Number(score),
        term: 1, // You might want to make this dynamic
        academic_year: new Date().getFullYear()
      });
      
      setSavedStudents(prev => new Set([...prev, currentStudent.id]));
    } catch (err) {
      console.error('Failed to save score:', err);
    } finally {
      setSaving(false);
    }
  };

  const navigateStudent = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === 'next' && currentIndex < students.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentStudent = students[currentIndex];
  const currentScore = currentStudent ? scores[currentStudent.id] : '';
  const isScoreValid = currentScore !== '' && Number(currentScore) >= 0 && Number(currentScore) <= 100;
  const isCurrentSaved = currentStudent ? savedStudents.has(currentStudent.id) : false;

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col w-full bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b p-4 z-10">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/school/score-entry')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-lg">Score Entry</h1>
            <p className="text-sm text-muted-foreground">
              {classInfo?.name} • {subjectInfo?.name}
            </p>
          </div>
          <Badge variant="outline">
            {currentIndex + 1} of {students.length}
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-2">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / students.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          {savedStudents.size} of {students.length} saved
        </p>
      </div>

      {/* Student Card */}
      {currentStudent && (
        <div className="p-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{currentStudent.full_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">ID: {currentStudent.student_id}</p>
                </div>
                {isCurrentSaved && (
                  <div className="flex items-center gap-1 text-success">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Saved</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Score (0-100) *
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={currentScore}
                  onChange={(e) => handleScoreChange(currentStudent.id, e.target.value)}
                  placeholder="Enter score"
                  className="text-lg text-center h-12"
                />
                {currentScore && !isScoreValid && (
                  <p className="text-sm text-destructive mt-1">
                    Score must be between 0 and 100
                  </p>
                )}
              </div>

              <Button
                onClick={saveCurrentScore}
                disabled={!isScoreValid || saving || isCurrentSaved}
                className="w-full h-12"
                size="lg"
              >
                {saving ? (
                  'Saving...'
                ) : isCurrentSaved ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Score
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Button
            variant="outline"
            onClick={() => navigateStudent('prev')}
            disabled={currentIndex === 0}
            className="flex-1 mr-2"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigateStudent('next')}
            disabled={currentIndex === students.length - 1}
            className="flex-1 ml-2"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        {savedStudents.size === students.length && (
          <div className="text-center mt-3">
            <Button
              onClick={() => navigate('/school/score-entry')}
              className="w-full max-w-md"
            >
              All Scores Saved - Return to Menu
            </Button>
          </div>
        )}
      </div>

      {/* Bottom padding to prevent content being hidden behind navigation */}
      <div className="h-24" />
    </div>
  );
};

export default SingleScoreEntry;