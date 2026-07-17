import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import secureApiClient from '@/lib/secureApiClient';

interface Subject {
  id: string;
  name: string;
  code: string;
}

const ScoreEntrySetup = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClasses = async () => {
    try {
      const response = await secureApiClient.get('/schools/classes/');
      setClasses(Array.isArray(response) ? response : response.results || response.data || []);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await secureApiClient.get('/schools/subjects/');
      setSubjects(Array.isArray(response) ? response : response.results || response.data || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSubjects.length === subjects.length) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects(subjects.map(s => s.id));
    }
  };

  const getSelectedSubjectNames = () => {
    return subjects
      .filter(s => selectedSubjects.includes(s.id))
      .map(s => s.name);
  };

  const handleProceed = () => {
    if (!selectedClass || !selectedTerm || !selectedSession || selectedSubjects.length === 0) {
      alert('Please select all required fields');
      return;
    }

    const params = new URLSearchParams({
      class: selectedClass,
      term: selectedTerm,
      session: selectedSession,
      subjects: selectedSubjects.join(',')
    });

    navigate(`/school/multi-subject-score-entry?${params.toString()}`);
  };

  const canProceed = selectedClass && selectedTerm && selectedSession && selectedSubjects.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Score Entry Setup</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Entry Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Class *</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Term *</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">First Term</SelectItem>
                  <SelectItem value="2">Second Term</SelectItem>
                  <SelectItem value="3">Third Term</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Session *</label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023-2024">2023-2024</SelectItem>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Select Multiple Subjects *
              </label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSelectAll}
              >
                {selectedSubjects.length === subjects.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
              {subjects.map(subject => (
                <div key={subject.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                  <Checkbox
                    id={subject.id}
                    checked={selectedSubjects.includes(subject.id)}
                    onCheckedChange={() => handleSubjectToggle(subject.id)}
                  />
                  <label 
                    htmlFor={subject.id} 
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {subject.name}
                  </label>
                </div>
              ))}
            </div>
            
            {selectedSubjects.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected:
                </p>
                <div className="flex flex-wrap gap-1">
                  {getSelectedSubjectNames().map(name => (
                    <Badge key={name} variant="secondary" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleProceed} 
              disabled={!canProceed}
              className="min-w-32"
              size="lg"
            >
              Proceed to Score Entry
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScoreEntrySetup;