import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReportPreviewModal from '@/components/ReportPreviewModal';
import BulkReportPreviewModal from '@/components/BulkReportPreviewModal';
import { Save, BookOpenCheck, BookOpen, Info, CheckCircle, ArrowRight, ArrowLeft, Users, Eye, FileText, Trash2, AlertTriangle } from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/shared/PageHeader';

interface Student {
  id: number;
  student_id: string;
  full_name: string;
  current_class: number;
}

interface ClassSubject {
  id: number;
  subject: {
    id: number;
    name: string;
  };
  class_instance: {
    id: number;
    name: string;
  };
}

interface CurrentTerm {
  id: number;
  name: string;
  academic_year: string;
}

interface ScoreData {
  student_id: number;
  class_subject_id: number;
  term_id: number;
  task: number;
  homework: number;
  group_work: number;
  project_work: number;
  class_test: number;
  exam_score: number;
}

const ScoreEntry = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [currentTerm, setCurrentTerm] = useState<CurrentTerm | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [teacherClass, setTeacherClass] = useState<any>(null);
  const [scoreEntryMode, setScoreEntryMode] = useState<'CLASS_TEACHER' | 'SUBJECT_TEACHER'>('SUBJECT_TEACHER');
  const [entryMode, setEntryMode] = useState<'single' | 'multiple'>('single');
  const [scores, setScores] = useState<Record<string, ScoreData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [currentStep, setCurrentStep] = useState<'mode' | 'subjects' | 'entry'>('mode');
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [savedScores, setSavedScores] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showAllReports, setShowAllReports] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'all' | 'selected' | 'single'>('all');
  const [deleting, setDeleting] = useState(false);
  const [publishedReports, setPublishedReports] = useState<any[]>([]);
  const [loadingPublished, setLoadingPublished] = useState(false);
  const [showPublishedReports, setShowPublishedReports] = useState(false);
  const { toast } = useToast();

  const proceedToSubjects = () => {
    setCurrentStep('subjects');
  };

  const proceedToEntry = () => {
    if (entryMode === 'single' && selectedSubject) {
      setCurrentStep('entry');
      setCurrentStudentIndex(0);
    } else if (entryMode === 'multiple' && selectedSubjects.length > 0) {
      setCurrentStep('entry');
      setCurrentStudentIndex(0);
    }
  };

  const goBackToMode = () => {
    setCurrentStep('mode');
  };

  const goBackToSubjects = () => {
    setCurrentStep('subjects');
  };

  const nextStudent = () => {
    if (currentStudentIndex < students.length - 1) {
      setCurrentStudentIndex(prev => prev + 1);
    }
  };

  const previousStudent = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(prev => prev - 1);
    }
  };

  const getCurrentSubject = () => {
    if (entryMode === 'single') {
      return classSubjects.find(cs => cs.id.toString() === selectedSubject);
    }
    return null;
  };

  const getCurrentStudent = () => {
    return students[currentStudentIndex];
  };

  const isLastStudent = () => {
    return currentStudentIndex === students.length - 1;
  };

  const isFirstStudent = () => {
    return currentStudentIndex === 0;
  };

  const getProgress = () => {
    if (students.length === 0) return 0;
    return ((currentStudentIndex + 1) / students.length) * 100;
  };

  const getSavedCount = () => {
    return savedScores.size;
  };

  const previewAllReports = () => {
    if (!currentTerm) {
      toast({ title: 'Error', description: 'Term information missing', variant: 'destructive' });
      return;
    }
    setShowAllReports(true);
  };

  const getAllStudentsScores = () => {
    const allScores: Record<string, any> = {};
    
    students.forEach(student => {
      if (entryMode === 'single') {
        const scoreData = scores[`${student.id}-${selectedSubject}`];
        if (scoreData) {
          const subject = classSubjects.find(cs => cs.id.toString() === selectedSubject);
          if (subject) {
            allScores[student.id] = {
              [subject.id]: {
                subject_name: subject.subject.name,
                task: scoreData.task,
                homework: scoreData.homework,
                group_work: scoreData.group_work,
                project_work: scoreData.project_work,
                class_test: scoreData.class_test,
                exam_score: scoreData.exam_score,
                ca_total: scoreData.task + scoreData.homework + scoreData.group_work + scoreData.project_work + scoreData.class_test,
                total_score: scoreData.task + scoreData.homework + scoreData.group_work + scoreData.project_work + scoreData.class_test + scoreData.exam_score
              }
            };
          }
        }
      } else {
        const studentScores: any = {};
        selectedSubjects.forEach(subjectId => {
          const scoreData = scores[`${student.id}-${subjectId}`];
          if (scoreData) {
            const subject = classSubjects.find(cs => cs.id.toString() === subjectId);
            if (subject) {
              studentScores[subject.id] = {
                subject_name: subject.subject.name,
                task: scoreData.task,
                homework: scoreData.homework,
                group_work: scoreData.group_work,
                project_work: scoreData.project_work,
                class_test: scoreData.class_test,
                exam_score: scoreData.exam_score,
                ca_total: scoreData.task + scoreData.homework + scoreData.group_work + scoreData.project_work + scoreData.class_test,
                total_score: scoreData.task + scoreData.homework + scoreData.group_work + scoreData.project_work + scoreData.class_test + scoreData.exam_score
              };
            }
          }
        });
        if (Object.keys(studentScores).length > 0) {
          allScores[student.id] = studentScores;
        }
      }
    });
    
    return allScores;
  };

  const previewReport = () => {
    const student = getCurrentStudent();
    if (!student || !currentTerm) {
      toast({ title: 'Error', description: 'Student or term information missing', variant: 'destructive' });
      return;
    }
    setShowPreview(true);
  };

  const getCurrentScoresForPreview = () => {
    const student = getCurrentStudent();
    if (!student) return {};

    const currentScores: any = {};
    
    if (entryMode === 'single') {
      const scoreData = scores[`${student.id}-${selectedSubject}`];
      if (scoreData) {
        const subject = classSubjects.find(cs => cs.id.toString() === selectedSubject);
        if (subject) {
          currentScores[subject.id] = {
            subject_name: subject.subject.name,
            task: scoreData.task,
            homework: scoreData.homework,
            group_work: scoreData.group_work,
            project_work: scoreData.project_work,
            class_test: scoreData.class_test,
            exam_score: scoreData.exam_score,
            ca_total: scoreData.task + scoreData.homework + scoreData.group_work + scoreData.project_work + scoreData.class_test,
            total_score: scoreData.task + scoreData.homework + scoreData.group_work + scoreData.project_work + scoreData.class_test + scoreData.exam_score
          };
        }
      }
    } else {
      selectedSubjects.forEach(subjectId => {
        const scoreData = scores[`${student.id}-${subjectId}`];
        if (scoreData) {
          const subject = classSubjects.find(cs => cs.id.toString() === subjectId);
          if (subject) {
            currentScores[subject.id] = {
              subject_name: subject.subject.name,
              task: scoreData.task,
              homework: scoreData.homework,
              group_work: scoreData.group_work,
              project_work: scoreData.project_work,
              class_test: scoreData.class_test,
              exam_score: scoreData.exam_score,
              ca_total: scoreData.task + scoreData.homework + scoreData.group_work + scoreData.project_work + scoreData.class_test,
              total_score: scoreData.task + scoreData.homework + scoreData.group_work + scoreData.project_work + scoreData.class_test + scoreData.exam_score
            };
          }
        }
      });
    }

    return currentScores;
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (currentTerm && ((entryMode === 'single' && selectedSubject) || (entryMode === 'multiple' && selectedSubjects.length > 0))) {
      fetchStudents();
    }
  }, [selectedSubject, selectedSubjects, currentTerm, entryMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentsResponse, currentTermResponse, schoolSettingsResponse] = await Promise.all([
        secureApiClient.get('/teachers/assignments/'),
        secureApiClient.get('/schools/terms/current/'),
        secureApiClient.get('/schools/settings/')
      ]);

      if (schoolSettingsResponse?.score_entry_mode) {
        setScoreEntryMode(schoolSettingsResponse.score_entry_mode);
      }

      const assignments = Array.isArray(assignmentsResponse) ? assignmentsResponse : assignmentsResponse.results || [];
      
      // FIXED: Look for both form_class and class assignments
      const formClassAssignment = assignments.find((assignment: any) => 
        assignment.type === 'form_class' || assignment.type === 'class_teacher'
      );
      
      if (formClassAssignment?.class) {
        setTeacherClass(formClassAssignment.class);
        
        const classSubjectsResponse = await secureApiClient.get(`/schools/class-subjects/?class_instance=${formClassAssignment.class.id}`);
        const classSubjectsData = Array.isArray(classSubjectsResponse) ? classSubjectsResponse : classSubjectsResponse.results || [];
        
        const mappedSubjects = classSubjectsData.map((cs: any) => ({
          id: cs.id,
          subject: {
            id: cs.subject?.id || cs.subject_id,
            name: cs.subject?.name || cs.subject_name
          },
          class_instance: {
            id: cs.class_instance?.id || formClassAssignment.class.id,
            name: cs.class_instance?.name || formClassAssignment.class.name
          }
        }));
        setClassSubjects(mappedSubjects);
      } else {
        // FALLBACK: If no form class assignment, try to get teacher's subject assignments
        const subjectAssignments = assignments.filter((assignment: any) => 
          assignment.type === 'subject_class' && assignment.class
        );
        
        if (subjectAssignments.length > 0) {
          // Use the first class from subject assignments
          const firstClass = subjectAssignments[0].class;
          setTeacherClass(firstClass);
          
          // Get all subjects for this class
          const classSubjectsResponse = await secureApiClient.get(`/schools/class-subjects/?class_instance=${firstClass.id}`);
          const classSubjectsData = Array.isArray(classSubjectsResponse) ? classSubjectsResponse : classSubjectsResponse.results || [];
          
          const mappedSubjects = classSubjectsData.map((cs: any) => ({
            id: cs.id,
            subject: {
              id: cs.subject?.id || cs.subject_id,
              name: cs.subject?.name || cs.subject_name
            },
            class_instance: {
              id: cs.class_instance?.id || firstClass.id,
              name: cs.class_instance?.name || firstClass.name
            }
          }));
          setClassSubjects(mappedSubjects);
        }
      }

      if (currentTermResponse && currentTermResponse.id) {
        setCurrentTerm({
          id: currentTermResponse.id,
          name: currentTermResponse.name || 'Current Term',
          academic_year: currentTermResponse.academic_year_name || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      let classId;
      
      if (entryMode === 'single') {
        const selectedSubjectData = classSubjects.find(cs => cs.id.toString() === selectedSubject);
        classId = selectedSubjectData?.class_instance?.id;
      } else {
        classId = teacherClass?.id;
      }

      if (!classId || !currentTerm) return;

      const response = await secureApiClient.get(`/students/?class_id=${classId}`);
      const studentsData = Array.isArray(response) ? response : response.results || [];
      setStudents(studentsData);

      // Load existing scores from backend
      await loadExistingScores(studentsData, classId);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast({ title: 'Error', description: 'Failed to load students', variant: 'destructive' });
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadExistingScores = async (studentsData: Student[], classId: number) => {
    try {
      const existingScores: Record<string, ScoreData> = {};
      
      // Initialize all students with empty scores using consistent keying
      studentsData.forEach((student: Student) => {
        if (entryMode === 'single') {
          // Use student-subject combination key for single mode too
          const key = `${student.id}-${selectedSubject}`;
          existingScores[key] = {
            student_id: student.id,
            class_subject_id: parseInt(selectedSubject),
            term_id: currentTerm?.id || 0,
            task: 0,
            homework: 0,
            group_work: 0,
            project_work: 0,
            class_test: 0,
            exam_score: 0
          };
        } else {
          selectedSubjects.forEach((subjectId) => {
            const key = `${student.id}-${subjectId}`;
            existingScores[key] = {
              student_id: student.id,
              class_subject_id: parseInt(subjectId),
              term_id: currentTerm?.id || 0,
              task: 0,
              homework: 0,
              group_work: 0,
              project_work: 0,
              class_test: 0,
              exam_score: 0
            };
          });
        }
      });

      // Load CA scores
      const caPromises = [];
      if (entryMode === 'single') {
        caPromises.push(
          secureApiClient.get(`/scores/ca-scores/?class_subject=${selectedSubject}&term=${currentTerm?.id}`)
        );
      } else {
        selectedSubjects.forEach(subjectId => {
          caPromises.push(
            secureApiClient.get(`/scores/ca-scores/?class_subject=${subjectId}&term=${currentTerm?.id}`)
          );
        });
      }

      const caResponses = await Promise.all(caPromises);
      
      // Process CA scores with consistent keying
      caResponses.forEach((response, index) => {
        const caScores = Array.isArray(response) ? response : response.results || [];
        const subjectId = entryMode === 'single' ? selectedSubject : selectedSubjects[index];
        
        caScores.forEach((caScore: any) => {
          // Always use student-subject combination key
          const key = `${caScore.student}-${subjectId}`;
          if (existingScores[key]) {
            existingScores[key].task = parseFloat(caScore.task) || 0;
            existingScores[key].homework = parseFloat(caScore.homework) || 0;
            existingScores[key].group_work = parseFloat(caScore.group_work) || 0;
            existingScores[key].project_work = parseFloat(caScore.project_work) || 0;
            existingScores[key].class_test = parseFloat(caScore.class_test) || 0;
          }
        });
      });

      // Load exam scores
      const examPromises = [];
      if (entryMode === 'single') {
        examPromises.push(
          secureApiClient.get(`/scores/exam-scores/?class_subject=${selectedSubject}&term=${currentTerm?.id}`)
        );
      } else {
        selectedSubjects.forEach(subjectId => {
          examPromises.push(
            secureApiClient.get(`/scores/exam-scores/?class_subject=${subjectId}&term=${currentTerm?.id}`)
          );
        });
      }

      const examResponses = await Promise.all(examPromises);
      
      // Process exam scores with consistent keying
      examResponses.forEach((response, index) => {
        const examScores = Array.isArray(response) ? response : response.results || [];
        const subjectId = entryMode === 'single' ? selectedSubject : selectedSubjects[index];
        
        examScores.forEach((examScore: any) => {
          // Always use student-subject combination key
          const key = `${examScore.student}-${subjectId}`;
          if (existingScores[key]) {
            existingScores[key].exam_score = parseFloat(examScore.score) || 0;
          }
        });
      });
      
      setScores(existingScores);
    } catch (error) {
      console.error('Failed to load existing scores:', error);
      // Initialize empty scores if loading fails with consistent keying
      const initialScores: Record<string, ScoreData> = {};
      studentsData.forEach((student: Student) => {
        if (entryMode === 'single') {
          // Use student-subject combination key for single mode too
          const key = `${student.id}-${selectedSubject}`;
          initialScores[key] = {
            student_id: student.id,
            class_subject_id: parseInt(selectedSubject),
            term_id: currentTerm?.id || 0,
            task: 0,
            homework: 0,
            group_work: 0,
            project_work: 0,
            class_test: 0,
            exam_score: 0
          };
        } else {
          selectedSubjects.forEach((subjectId) => {
            const key = `${student.id}-${subjectId}`;
            initialScores[key] = {
              student_id: student.id,
              class_subject_id: parseInt(subjectId),
              term_id: currentTerm?.id || 0,
              task: 0,
              homework: 0,
              group_work: 0,
              project_work: 0,
              class_test: 0,
              exam_score: 0
            };
          });
        }
      });
      setScores(initialScores);
    }
  };

  const updateScore = (studentId: number, field: keyof ScoreData, value: number, subjectId?: string) => {
    // Always use student-subject combination as key to prevent cross-contamination
    const key = subjectId ? `${studentId}-${subjectId}` : `${studentId}-${selectedSubject}`;
    
    setScores(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const calculateCATotal = (studentId: number, subjectId?: string) => {
    // Always use student-subject combination as key
    const key = subjectId ? `${studentId}-${subjectId}` : `${studentId}-${selectedSubject}`;
    const score = scores[key];
    if (!score) return 0;
    return Number(score.task) + Number(score.homework) + Number(score.group_work) + Number(score.project_work) + Number(score.class_test);
  };

  const calculateGrandTotal = (studentId: number, subjectId?: string) => {
    // Always use student-subject combination as key
    const key = subjectId ? `${studentId}-${subjectId}` : `${studentId}-${selectedSubject}`;
    return calculateCATotal(studentId, subjectId) + Number(scores[key]?.exam_score || 0);
  };

  const saveScores = async () => {
    try {
      setSaving(true);
      const scoreEntries = Object.values(scores).filter(score => 
        score.task > 0 || score.homework > 0 || score.group_work > 0 || 
        score.project_work > 0 || score.class_test > 0 || score.exam_score > 0
      );
      
      if (scoreEntries.length === 0) {
        toast({ title: 'No Scores', description: 'Please enter some scores before saving', variant: 'destructive' });
        return;
      }

      let savedCount = 0;
      let errorCount = 0;
      
      for (const scoreEntry of scoreEntries) {
        try {
          // Use the correct backend endpoint for score entry
          await secureApiClient.post('/scores/manage/enter_scores/', scoreEntry);
          savedCount++;
        } catch (error) {
          errorCount++;
          console.error(`Failed to save score for student ${scoreEntry.student_id}:`, error);
        }
      }

      if (errorCount === 0) {
        toast({ 
          title: 'Success', 
          description: `All ${savedCount} scores saved successfully`,
          duration: 3000
        });
        // Update saved scores tracking
        const newSavedScores = new Set(savedScores);
        scoreEntries.forEach(score => {
          const key = entryMode === 'multiple' ? `${score.student_id}-${score.class_subject_id}` : score.student_id.toString();
          newSavedScores.add(key);
        });
        setSavedScores(newSavedScores);
      } else {
        toast({ 
          title: 'Partial Success', 
          description: `${savedCount} scores saved, ${errorCount} failed`,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save scores', 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchPublishedReports = async () => {
    if (!currentTerm) return;
    
    try {
      setLoadingPublished(true);
      const response = await secureApiClient.get(`/reports/report-cards/published_reports/?term_id=${currentTerm.id}`);
      setPublishedReports(response.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load published reports',
        variant: 'destructive'
      });
    } finally {
      setLoadingPublished(false);
    }
  };

  const handleUnpublish = async (reportId: number, studentName: string) => {
    try {
      await secureApiClient.post(`/reports/report-cards/${reportId}/unpublish/`);
      
      toast({
        title: 'Success',
        description: `Report for ${studentName} has been unpublished`,
      });

      // Refresh the published reports list
      fetchPublishedReports();
    } catch (error: any) {
      toast({
        title: 'Error', 
        description: error.response?.data?.error || 'Failed to unpublish report',
        variant: 'destructive'
      });
    }
  };

  // Load published reports when component mounts or term changes
  useEffect(() => {
    if (currentTerm && showPublishedReports) {
      fetchPublishedReports();
    }
  }, [currentTerm, showPublishedReports]);

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id.toString()));
    }
  };

  const clearAllScores = async () => {
    if (!teacherClass || !currentTerm) {
      toast({
        title: "Error",
        description: "Missing class or term information",
        variant: "destructive"
      });
      return;
    }

    setDeleting(true);
    try {
      const response = await secureApiClient.post('/scores/manage/clear_all_scores/', {
        term_id: currentTerm.id,
        class_id: teacherClass.id
      });

      const allMsg = response?.data?.message || 'All scores cleared successfully';
      toast({
        title: "Success",
        description: allMsg
      });

      // Reset scores state
      setScores({});
      setSavedScores(new Set());
      
    } catch (error: any) {
      console.error('Clear all scores error:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.error || error?.message || "Failed to clear scores",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteMode('all');
    }
  };

  const clearSelectedScores = async () => {
    if (!currentTerm || selectedStudents.length === 0) {
      toast({
        title: "Error", 
        description: "Please select students to clear scores for",
        variant: "destructive"
      });
      return;
    }

    setDeleting(true);
    try {
      const response = await secureApiClient.post('/scores/manage/clear_selected_scores/', {
        term_id: currentTerm.id,
        student_ids: selectedStudents.map(id => parseInt(id))
      });

      const selMsg = response?.data?.message || `Scores cleared for ${selectedStudents.length} student(s)`;
      toast({
        title: "Success",
        description: selMsg
      });

      // Reset scores state for selected students
      const newScores = { ...scores };
      selectedStudents.forEach(studentId => {
        Object.keys(newScores).forEach(key => {
          if (key.includes(`_${studentId}_`)) {
            delete newScores[key];
          }
        });
      });
      setScores(newScores);

      // Reset selections
      setSelectedStudents([]);

    } catch (error: any) {
      console.error('Clear selected scores error:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.error || error?.message || "Failed to clear selected scores",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteMode('selected');
    }
  };

  const clearStudentSubjectScore = async (studentId: number, subjectId: string) => {
    if (!currentTerm) {
      toast({
        title: "Error",
        description: "Missing term information",
        variant: "destructive"
      });
      return;
    }

    setDeleting(true);
    try {
      const response = await secureApiClient.post('/scores/manage/clear_student_subject_scores/', {
        student_id: studentId,
        class_subject_id: parseInt(subjectId),
        term_id: currentTerm.id
      });

      const subMsg = response?.data?.message || 'Score cleared successfully';
      toast({
        title: "Success",
        description: subMsg
      });

      // Remove from local state
      const key = `${studentId}_${subjectId}`;
      const newScores = { ...scores };
      delete newScores[key];
      setScores(newScores);

      // Remove from saved scores
      setSavedScores(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });

    } catch (error: any) {
      console.error('Clear student subject score error:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.error || error?.message || "Failed to clear score",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAction = (mode: 'all' | 'selected' | 'single') => {
    setDeleteMode(mode);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteMode === 'all') {
      clearAllScores();
    } else if (deleteMode === 'selected') {
      clearSelectedScores();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Score Entry" description="Loading..." />
        <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground">
          Loading score entry system...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Score Entry" 
        description="Enter continuous assessment and exam scores for students"
      />

      {/* Current Term Display */}
      {currentTerm && (
        <div className="animated-border-subtle">
          <div className="animated-border-subtle-content">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Active Term:</strong> {currentTerm.name} {currentTerm.academic_year && `(${currentTerm.academic_year})`}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {!currentTerm && (
        <div className="animated-border-subtle">
          <div className="animated-border-subtle-content">
            <Alert variant="destructive">
              <AlertDescription>
                No active term found. Please contact the school administrator to set the current term.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* Published Reports Management */}
      {currentTerm && (
        <div className="animated-border-subtle">
          <div className="animated-border-subtle-content">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Published Reports Management</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowPublishedReports(!showPublishedReports);
                      if (!showPublishedReports) {
                        fetchPublishedReports();
                      }
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {showPublishedReports ? 'Hide' : 'Show'} Published Reports
                  </Button>
                </div>
              </CardHeader>

              {showPublishedReports && (
                <CardContent>
                  {loadingPublished ? (
                    <div className="text-center py-4">
                      <div className="text-sm text-muted-foreground">Loading published reports...</div>
                    </div>
                  ) : publishedReports.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">No published reports found for {currentTerm.name}</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground mb-3">
                        {publishedReports.length} published report{publishedReports.length === 1 ? '' : 's'} found
                      </div>
                      
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {publishedReports.map((report) => (
                          <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                            <div className="flex-1">
                              <div className="flex items-center gap-4">
                                <div>
                                  <div className="font-medium">{report.student_name}</div>
                                  <div className="text-sm text-muted-foreground">ID: {report.student_id}</div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Published: {new Date(report.published_at).toLocaleDateString()}
                                </div>
                                <Badge variant="secondary">Code: {report.report_code}</Badge>
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleUnpublish(report.id, report.student_name)}
                              className="ml-4"
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Unpublish
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Note:</strong> Unpublishing a report will remove it from students' view. 
                          The report can be re-published later if needed.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Mode Selection Step */}
      {currentStep === 'mode' && currentTerm && (
        <div className="space-y-6">
          <div className="animated-border">
            <div className="animated-border-content p-6">
              <h3 className="text-lg font-semibold mb-6">Choose Entry Mode</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`animated-quick-action cursor-pointer transition-all ${entryMode === 'single' ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setEntryMode('single')}
                >
                  <div className="animated-quick-action-content p-6 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-semibold mb-2">Single Subject Entry</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter scores for one subject at a time with step-by-step navigation
                    </p>
                    {entryMode === 'single' && <CheckCircle className="h-5 w-5 mx-auto text-primary" />}
                  </div>
                </div>
                
                <div 
                  className={`animated-quick-action cursor-pointer transition-all ${entryMode === 'multiple' ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setEntryMode('multiple')}
                >
                  <div className="animated-quick-action-content p-6 text-center">
                    <BookOpenCheck className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-semibold mb-2">Multiple Subjects Entry</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter scores for multiple subjects in a grid layout
                    </p>
                    {entryMode === 'multiple' && <CheckCircle className="h-5 w-5 mx-auto text-primary" />}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-6">
                <Button onClick={proceedToSubjects} disabled={!entryMode} size="lg">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subject Selection Step */}
      {currentStep === 'subjects' && currentTerm && (
        <div className="space-y-6">
          <div className="animated-border">
            <div className="animated-border-content p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Select {entryMode === 'single' ? 'Subject' : 'Subjects'}</h3>
                <Button variant="outline" size="sm" onClick={goBackToMode}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
              
              {classSubjects.length === 0 ? (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No subjects found for your assigned class. Please ensure you have been assigned to teach subjects in this class.
                  </AlertDescription>
                </Alert>
              ) : null}
              
              {entryMode === 'single' ? (
                <div className="space-y-4">
                  <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={classSubjects.length === 0}>
                    <SelectTrigger>
                      <SelectValue placeholder={classSubjects.length === 0 ? "No subjects available" : "Select subject and class"} />
                    </SelectTrigger>
                    <SelectContent>
                      {classSubjects.length > 0 && classSubjects.map(cs => (
                        <SelectItem key={cs.id} value={cs.id.toString()}>
                          {cs.subject.name} - {cs.class_instance.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSubject && (
                    <Button onClick={proceedToEntry} className="w-full" size="lg">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Proceed to Score Entry
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {classSubjects.length === 0 ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No subjects found. Please ensure you have been assigned to teach in this class before entering scores.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {classSubjects.map(cs => (
                          <div key={cs.id} className="animated-border-subtle">
                            <div className="animated-border-subtle-content flex items-center space-x-2 p-3">
                              <Checkbox
                                id={`subject-${cs.id}`}
                                checked={selectedSubjects.includes(cs.id.toString())}
                                onCheckedChange={() => handleSubjectToggle(cs.id.toString())}
                              />
                              <Label htmlFor={`subject-${cs.id}`} className="flex-1 cursor-pointer">
                                <div className="font-medium">{cs.subject.name}</div>
                                <div className="text-sm text-muted-foreground">{cs.class_instance.name}</div>
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                      {selectedSubjects.length > 0 && (
                        <div className="space-y-3">
                          <Badge variant="secondary" className="text-sm">
                            {selectedSubjects.length} subject(s) selected
                          </Badge>
                          <Button onClick={proceedToEntry} className="w-full" size="lg">
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Proceed to Score Entry
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Entry Step */}
      {currentStep === 'entry' && students.length > 0 && (
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="animated-stats-card">
            <div className="animated-stats-card-content p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{entryMode === 'single' ? getCurrentSubject()?.subject.name : 'Multiple Subjects Entry'}</h3>
                    <p className="text-sm text-muted-foreground">
                      Student {currentStudentIndex + 1} of {students.length} • {getSavedCount()} saved
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteAction('all')}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Scores
                    </Button>
                    <Button variant="outline" size="sm" onClick={goBackToSubjects}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                  </div>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="animated-border-subtle">
            <div className="animated-border-subtle-content p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Checkbox 
                    id="select-all"
                    checked={selectedStudents.length === students.length}
                    onCheckedChange={handleSelectAllStudents}
                  />
                  <Label htmlFor="select-all" className="text-sm">
                    Select All Students ({selectedStudents.length}/{students.length})
                  </Label>
                </div>
                {selectedStudents.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteAction('selected')}
                    disabled={deleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Selected ({selectedStudents.length})
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="animated-border pulse-glow">
            <div className="animated-border-content p-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      id={`student-${getCurrentStudent().id}`}
                      checked={selectedStudents.includes(getCurrentStudent().id.toString())}
                      onCheckedChange={() => handleStudentSelect(getCurrentStudent().id.toString())}
                    />
                    <div>
                      <h3 className="font-medium text-lg">{getCurrentStudent().full_name}</h3>
                      <p className="text-sm text-muted-foreground">ID: {getCurrentStudent().student_id}</p>
                      {entryMode === 'single' && (
                        <p className="text-sm text-muted-foreground">Subject: {getCurrentSubject()?.subject.name}</p>
                      )}
                    </div>
                  </div>
                  {entryMode === 'single' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => clearStudentSubjectScore(getCurrentStudent().id, selectedSubject)}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear This Score
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Score Entry Form */}
          {entryMode === 'single' && getCurrentStudent() && getCurrentSubject() && (
            <div className="animated-border">
              <div className="animated-border-content p-6">
                <h3 className="text-lg font-semibold mb-6">Enter Scores</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['task', 'homework', 'group_work', 'project_work', 'class_test'].map((field) => (
                      <div key={field}>
                        <Label className="text-sm font-medium">
                          {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} (0-10)
                        </Label>
                        <Input
                          type="number" min="0" max="10" step="0.1"
                          className="mt-1"
                          value={scores[`${getCurrentStudent().id}-${selectedSubject}`]?.[field as keyof ScoreData] || ''}
                          onChange={(e) => updateScore(getCurrentStudent().id, field as keyof ScoreData, parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    ))}
                    <div>
                      <Label className="text-sm font-medium">Exam Score (0-50)</Label>
                      <Input
                        type="number" min="0" max="50" step="0.1"
                        className="mt-1"
                        value={scores[`${getCurrentStudent().id}-${selectedSubject}`]?.exam_score || ''}
                        onChange={(e) => updateScore(getCurrentStudent().id, 'exam_score', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="animated-stats-card">
                      <div className="animated-stats-card-content p-3">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-sm text-muted-foreground">CA Total</div>
                            <div className="text-lg font-medium">{calculateCATotal(getCurrentStudent().id)}/50</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Exam Score</div>
                            <div className="text-lg font-medium">{scores[`${getCurrentStudent().id}-${selectedSubject}`]?.exam_score || 0}/50</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Grand Total</div>
                            <div className="text-xl font-bold text-green-600">{calculateGrandTotal(getCurrentStudent().id)}/100</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multiple Subjects Entry */}
          {entryMode === 'multiple' && getCurrentStudent() && (
            <div className="animated-border">
              <div className="animated-border-content p-6">
                <h3 className="text-lg font-semibold mb-6">Enter Scores for All Subjects</h3>
                <div className="space-y-6">
                  {selectedSubjects.map(subjectId => {
                    const subject = classSubjects.find(cs => cs.id.toString() === subjectId);
                    if (!subject) return null;
                    
                    return (
                      <div key={subjectId} className="animated-border-subtle">
                        <div className="animated-border-subtle-content p-4">
                          <h4 className="font-medium mb-4">{subject.subject.name}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {['task', 'homework', 'group_work', 'project_work', 'class_test'].map((field) => (
                              <div key={field}>
                                <Label className="text-sm">
                                  {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} (0-10)
                                </Label>
                                <Input
                                  type="number" min="0" max="10" step="0.1"
                                  className="mt-1"
                                  value={scores[`${getCurrentStudent().id}-${subjectId}`]?.[field as keyof ScoreData] || ''}
                                  onChange={(e) => updateScore(getCurrentStudent().id, field as keyof ScoreData, parseFloat(e.target.value) || 0, subjectId)}
                                />
                              </div>
                            ))}
                            <div>
                              <Label className="text-sm">Exam Score (0-50)</Label>
                              <Input
                                type="number" min="0" max="50" step="0.1"
                                className="mt-1"
                                value={scores[`${getCurrentStudent().id}-${subjectId}`]?.exam_score || ''}
                                onChange={(e) => updateScore(getCurrentStudent().id, 'exam_score', parseFloat(e.target.value) || 0, subjectId)}
                              />
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="animated-stats-card">
                              <div className="animated-stats-card-content p-3 text-center">
                                <span className="text-sm text-muted-foreground">Total: </span>
                                <span className="font-bold text-green-600">
                                  {calculateGrandTotal(getCurrentStudent().id, subjectId)}/100
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="animated-border-subtle">
            <div className="animated-border-subtle-content p-6">
              <div className="space-y-3">
                {/* Mobile Layout */}
                <div className="block sm:hidden space-y-2">
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={previousStudent} 
                      disabled={isFirstStudent()}
                      size="sm"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    {!isLastStudent() ? (
                      <Button onClick={nextStudent} size="sm">
                        Next
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Button onClick={saveScores} disabled={saving} size="sm">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Finish
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={previewAllReports} variant="outline" size="sm" className="flex-1">
                      <FileText className="h-4 w-4 mr-1" />
                      All Reports
                    </Button>
                    <Button onClick={previewReport} disabled={loadingPreview} variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      onClick={() => handleDeleteAction('single')} 
                      variant="destructive" 
                      size="sm" 
                      className="flex-1"
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={saveScores} disabled={saving} variant="outline" size="sm" className="flex-1">
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
                
                {/* Desktop Layout */}
                <div className="hidden sm:flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    onClick={previousStudent} 
                    disabled={isFirstStudent()}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous Student
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button onClick={previewAllReports} variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Preview All Reports
                    </Button>
                    <Button onClick={previewReport} disabled={loadingPreview} variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      {loadingPreview ? 'Loading...' : 'Preview Report'}
                    </Button>
                    <Button onClick={saveScores} disabled={saving} variant="outline">
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Current'}
                    </Button>
                  </div>
                  
                  {!isLastStudent() ? (
                    <Button onClick={nextStudent}>
                      Next Student
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={saveScores} disabled={saving}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Finish & Save All'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ReportPreviewModal 
        isOpen={showPreview} 
        onClose={() => setShowPreview(false)}
        studentId={getCurrentStudent()?.id}
        termId={currentTerm?.id}
        previewType="student-report"
        currentScores={getCurrentScoresForPreview()}
      />

      <BulkReportPreviewModal 
        isOpen={showAllReports} 
        onClose={() => setShowAllReports(false)}
        students={students}
        termId={currentTerm?.id}
        allScores={getAllStudentsScores()}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Delete
            </DialogTitle>
            <DialogDescription>
              {deleteMode === 'all' && (
                "Are you sure you want to clear ALL scores for ALL students in this class? This action cannot be undone."
              )}
              {deleteMode === 'selected' && (
                `Are you sure you want to clear scores for ${selectedStudents.length} selected student(s)? This action cannot be undone.`
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2">⏳</span>
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Scores
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instructions */}
      <div className="animated-border-subtle">
        <div className="animated-border-subtle-content p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Scoring Guidelines</h3>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-medium text-sm">Continuous Assessment (CA) - 50 marks total:</div>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li>Task/Exercise: 0-10 marks</li>
                  <li>Homework/Assignment: 0-10 marks</li>
                  <li>Group Work: 0-10 marks</li>
                  <li>Project Work: 0-10 marks</li>
                  <li>Class Test: 0-10 marks</li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-sm">Assessment Components:</div>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li><strong>Exam Score:</strong> 0-50 marks</li>
                  <li><strong>Total Score:</strong> CA + Exam = 0-100 marks</li>
                  <li><strong>Entry Modes:</strong> Single or Multiple subjects</li>
                  <li><strong>Navigation:</strong> Step-by-step student entry</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreEntry;