import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, BookOpenCheck, ArrowRight } from 'lucide-react';
import secureApiClient from '@/lib/secureApiClient';

const ScoreEntry = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [mode, setMode] = useState<'single' | 'multiple' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        secureApiClient.get('/schools/classes/'),
        secureApiClient.get('/schools/subjects/')
      ]);
      setClasses(Array.isArray(classesRes) ? classesRes : classesRes.results || []);
      setSubjects(Array.isArray(subjectsRes) ? subjectsRes : subjectsRes.results || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (!selectedClass) return;
    
    if (mode === 'single' && selectedSubject) {
      navigate(`/school/score-entry/single/${selectedClass}/${selectedSubject}`);
    } else if (mode === 'multiple' && selectedSubjects.length > 0) {
      navigate(`/school/score-entry/multiple/${selectedClass}`, { 
        state: { subjects: selectedSubjects } 
      });
    }
  };

  const canProceed = selectedClass && (
    (mode === 'single' && selectedSubject) || 
    (mode === 'multiple' && selectedSubjects.length > 0)
  );

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <PageHeader 
        title="Score Entry" 
        description="Select entry mode and subjects to begin"
      />

      {!mode ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
            onClick={() => setMode('single')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Single Subject Entry</CardTitle>
              <CardDescription>
                Enter scores for one subject at a time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
            onClick={() => setMode('multiple')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <BookOpenCheck className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Multiple Subjects Entry</CardTitle>
              <CardDescription>
                Enter scores for multiple subjects together
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Mode:</span>
            <span className="font-medium text-foreground">
              {mode === 'single' ? 'Single Subject' : 'Multiple Subjects'}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setMode(null);
                setSelectedClass('');
                setSelectedSubject('');
                setSelectedSubjects([]);
              }}
            >
              Change
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Select Class & Subject{mode === 'multiple' ? 's' : ''}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Class *</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {mode === 'single' ? (
                <div>
                  <label className="block text-sm font-medium mb-2">Subject *</label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">Subjects *</label>
                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {subjects.map((subject) => (
                      <label key={subject.id} className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/50">
                        <input
                          type="checkbox"
                          checked={selectedSubjects.includes(subject.id.toString())}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubjects([...selectedSubjects, subject.id.toString()]);
                            } else {
                              setSelectedSubjects(selectedSubjects.filter(id => id !== subject.id.toString()));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{subject.name}</span>
                      </label>
                    ))}
                  </div>
                  {selectedSubjects.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedSubjects.length} subject{selectedSubjects.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              )}

              <Button 
                onClick={handleProceed}
                disabled={!canProceed}
                className="w-full"
                size="lg"
              >
                Proceed to Score Entry
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ScoreEntry;