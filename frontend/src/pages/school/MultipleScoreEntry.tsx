import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import secureApiClient from '@/lib/secureApiClient';

const MultipleScoreEntry = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const subjectIds = location.state?.subjects || [];
  
  const [students, setStudents] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [scores, setScores] = useState<{[studentId: string]: {[subjectId: string]: string}}>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedStudents, setSavedStudents] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!subjectIds.length) {
      navigate('/school/score-entry');
      return;
    }
    fetchData();
  }, [classId, subjectIds]);

  const fetchData = async () => {
    try {
      const [studentsRes, classRes, ...subjectPromises] = await Promise.all([
        secureApiClient.get(`/students/?class=${classId}`),
        secureApiClient.get(`/schools/classes/${classId}/`),
        ...subjectIds.map((id: string) => secureApiClient.get(`/schools/subjects/${id}/`))
      ]);
      
      const studentsList = Array.isArray(studentsRes) ? studentsRes : studentsRes.results || [];
      setStudents(studentsList);
      setClassInfo(classRes);
      setSubjects(subjectPromises);
      
      // Initialize scores
      const initialScores: {[studentId: string]: {[subjectId: string]: string}} = {};
      studentsList.forEach((student: any) => {
        initialScores[student.id] = {};
        subjectIds.forEach((subjectId: string) => {
          initialScores[student.id][subjectId] = '';
        });
      });
      setScores(initialScores);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (studentId: string, subjectId: string, score: string) => {
    // Validate score (0-100)
    if (score === '' || (Number(score) >= 0 && Number(score) <= 100)) {
      setScores(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [subjectId]: score
        }
      }));
    }
  };

  const saveCurrentStudentScores = async () => {
    const currentStudent = students[currentIndex];
    const studentScores = scores[currentStudent.id];
    
    // Check if all scores are valid
    const validScores = Object.entries(studentScores).filter(([_, score]) => 
      score !== '' && Number(score) >= 0 && Number(score) <= 100
    );
    
    if (validScores.length === 0) return;
    
    setSaving(true);
    try {
      // Save all valid scores for this student
      await Promise.all(
        validScores.map(([subjectId, score]) =>
          secureApiClient.post('/scores/', {
            student: currentStudent.id,
            subject: subjectId,
            score: Number(score),
            term: 1, // You might want to make this dynamic
            academic_year: new Date().getFullYear()
          })
        )
      );
      
      setSavedStudents(prev => new Set([...prev, currentStudent.id]));
    } catch (err) {
      console.error('Failed to save scores:', err);
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
  const currentStudentScores = currentStudent ? scores[currentStudent.id] : {};
  const hasValidScores = currentStudent && Object.values(currentStudentScores).some(score => 
    score !== '' && Number(score) >= 0 && Number(score) <= 100
  );
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
            <h1 className="font-semibold text-lg">Multiple Score Entry</h1>
            <p className="text-sm text-muted-foreground">
              {classInfo?.name} • {subjects.length} subjects
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
            <CardContent className="space-y-4">
              {/* Subjects Grid */}
              <div className="grid gap-4">
                {subjects.map((subject, index) => (
                  <div key={subject.id} className="space-y-2">
                    <label className="block text-sm font-medium">
                      {subject.name}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={currentStudentScores[subject.id] || ''}
                      onChange={(e) => handleScoreChange(currentStudent.id, subject.id, e.target.value)}
                      placeholder="0-100"
                      className="text-center"
                    />
                  </div>
                ))}
              </div>

              <Button
                onClick={saveCurrentStudentScores}
                disabled={!hasValidScores || saving || isCurrentSaved}
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
                    Save Scores
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

export default MultipleScoreEntry;