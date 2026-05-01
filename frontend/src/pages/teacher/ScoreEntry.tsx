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
import { Save, BookOpenCheck, BookOpen, Info, CheckCircle, ArrowRight, ArrowLeft, Users, Eye, FileText, Trash2, AlertTriangle, GraduationCap, PenLine, ClipboardList, FlaskConical, BookMarked, Award, Upload } from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';

const isPdfBlob = async (blob: Blob): Promise<boolean> => {
  if (blob.type.toLowerCase().includes('application/pdf')) {
    return true;
  }
  const signature = await blob.slice(0, 5).text();
  return signature === '%PDF-';
};

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
  };c
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
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [currentTerm, setCurrentTerm] = useState<CurrentTerm | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [teacherClass, setTeacherClass] = useState<any>(null);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [formClassId, setFormClassId] = useState<number | null>(null);
  const [teacherSubjectsByClass, setTeacherSubjectsByClass] = useState<Record<number, number[]>>({});
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [scoreEntryMode, setScoreEntryMode] = useState<'CLASS_TEACHER' | 'SUBJECT_TEACHER'>('SUBJECT_TEACHER');
  const [entryMode, setEntryMode] = useState<'single' | 'multiple'>('single');
  const [scores, setScores] = useState<Record<string, ScoreData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [currentStep, setCurrentStep] = useState<'mode' | 'class' | 'subjects' | 'entry'>('mode');
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [savedScores, setSavedScores] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showAllReports, setShowAllReports] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'all' | 'selected' | 'single'>('all');
  const [deleting, setDeleting] = useState(false);
  const [publishedReports, setPublishedReports] = useState<any[]>([]);
  const [loadingPublished, setLoadingPublished] = useState(false);
  const [showPublishedReports, setShowPublishedReports] = useState(false);
  const { toast } = useToast();

  const proceedToClassStep = () => {
    setCurrentStep('class');
  };

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

  const goBackToClass = () => {
    setCurrentStep('class');
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

  /**
   * Export all student reports as PDFs one-by-one, then navigate to the
   * teacher reports page so the teacher can see them all.
   */
  const exportAllReports = async () => {
    if (!currentTerm) {
      toast({ title: 'Error', description: 'Term information missing', variant: 'destructive' });
      return;
    }
    if (students.length === 0) {
      toast({ title: 'No students', description: 'No students found in this class', variant: 'destructive' });
      return;
    }

    setExporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const student of students) {
      try {
        const blob = await secureApiClient.post<Blob>(
          '/reports/report-cards/generate_pdf_report/',
          { student_id: student.id, term_id: currentTerm.id },
          { responseType: 'blob' as any }
        );
        const pdfBlob = blob instanceof Blob ? blob : new Blob([blob as any]);
        const validPdf = await isPdfBlob(pdfBlob);
        if (!validPdf) {
          throw new Error('Server returned non-PDF content');
        }
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${student.student_id}_${currentTerm.name}_Report.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setExporting(false);

    if (successCount > 0) {
      toast({
        title: 'Export complete',
        description: `${successCount} report${successCount !== 1 ? 's' : ''} downloaded${
          errorCount > 0 ? ` (${errorCount} failed — ensure scores are saved)` : ''
        }`,
      });
      navigate('/teacher/reports');
    } else {
      toast({
        title: 'Export failed',
        description: 'No reports could be exported. Please save scores first.',
        variant: 'destructive',
      });
    }
  };

  const getAllStudentsScores = () => {
    const allScores: Record<string, any> = {};

    // Include ALL in-memory subjects for every student
    students.forEach(student => {
      const studentScores: any = {};
      Object.entries(scores).forEach(([key, scoreData]) => {
        if (!key.startsWith(`${student.id}-`)) return;
        const subjectId = key.slice(`${student.id}-`.length);
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
      });
      if (Object.keys(studentScores).length > 0) {
        allScores[student.id] = studentScores;
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

    // Include ALL subjects in memory for this student (covers multi-subject sessions)
    Object.entries(scores).forEach(([key, scoreData]) => {
      if (!key.startsWith(`${student.id}-`)) return;
      const subjectId = key.slice(`${student.id}-`.length);
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
    });

    return currentScores;
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (currentTerm && selectedClass && ((entryMode === 'single' && selectedSubject) || (entryMode === 'multiple' && selectedSubjects.length > 0))) {
      fetchStudents();
    }
  }, [selectedSubject, selectedSubjects, currentTerm, entryMode, selectedClass]);

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

      // Find form-class (class teacher) assignment
      const formClassAssignment = assignments.find((a: any) =>
        a.type === 'form_class' || a.type === 'class_teacher'
      );

      // Find subject (non-form) class assignments
      const subjectAssignments = assignments.filter((a: any) =>
        a.type === 'subject_class' && a.class
      );

      // Store form class id — determines "all subjects" access
      const fClassId = formClassAssignment?.class?.id || null;
      setFormClassId(fClassId);
      if (formClassAssignment?.class) {
        setTeacherClass(formClassAssignment.class);
      }

      // Build map: classId → subjectIds teacher is assigned to teach
      const subjectsByClass: Record<number, number[]> = {};
      subjectAssignments.forEach((sa: any) => {
        const cId = sa.class?.id;
        const sId = sa.subject?.id;
        if (cId && sId) {
          if (!subjectsByClass[cId]) subjectsByClass[cId] = [];
          if (!subjectsByClass[cId].includes(sId)) subjectsByClass[cId].push(sId);
        }
      });
      setTeacherSubjectsByClass(subjectsByClass);

      // Build deduplicated list of accessible classes
      const classMap: Record<number, any> = {};
      if (formClassAssignment?.class) {
        classMap[formClassAssignment.class.id] = { ...formClassAssignment.class, isFormClass: true };
      }
      subjectAssignments.forEach((sa: any) => {
        if (sa.class?.id && !classMap[sa.class.id]) {
          classMap[sa.class.id] = { ...sa.class, isFormClass: false };
        }
      });
      const classes = Object.values(classMap);
      setAvailableClasses(classes);

      if (classes.length === 0) {
        toast({
          title: 'No Assignments',
          description: 'You have not been assigned to any class or subject.',
          variant: 'destructive',
        });
      } 

      if (currentTermResponse?.id) {
        setCurrentTerm({
          id: currentTermResponse.id,
          name: currentTermResponse.name || 'Current Term',
          academic_year: currentTermResponse.academic_year_name || '',
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
      const classId = selectedClass?.id || teacherClass?.id;

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

  const handleClassSelect = async (cls: any) => {
    setSelectedClass(cls);
    setTeacherClass(cls);
    setSelectedSubject('');
    setSelectedSubjects([]);
    setClassSubjects([]);
    try {
      setLoadingSubjects(true);
      const response = await secureApiClient.get(`/schools/class-subjects/?class_instance=${cls.id}`);
      const data = Array.isArray(response) ? response : response.results || [];
      // Always show ALL subjects assigned to the class — class teacher enters scores for every subject
      const subjects = data.map((cs: any) => ({
        id: cs.id,
        subject: { id: cs.subject?.id || cs.subject_id, name: cs.subject?.name || cs.subject_name },
        class_instance: { id: cls.id, name: cls.name },
      }));
      setClassSubjects(subjects);
    } catch (error) {
      console.error('Failed to fetch class subjects:', error);
      toast({ title: 'Error', description: 'Failed to load subjects for selected class', variant: 'destructive' });
    } finally {
      setLoadingSubjects(false);
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
      
      setScores(prev => ({ ...prev, ...existingScores }));
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
      setScores(prev => ({ ...prev, ...initialScores }));
    }
  };

  // Max score allowed per field
  const FIELD_MAX: Partial<Record<keyof ScoreData, number>> = {
    task: 10,
    homework: 10,
    group_work: 10,
    project_work: 10,
    class_test: 10,
    exam_score: 50,
  };

  const updateScore = (studentId: number, field: keyof ScoreData, value: number, subjectId?: string) => {
    // Always use student-subject combination as key to prevent cross-contamination
    const csIdStr = subjectId ?? selectedSubject;
    const key = `${studentId}-${csIdStr}`;

    // Clamp to [0, max] for the field
    const max = FIELD_MAX[field] ?? Infinity;
    const clamped = Math.min(Math.max(0, isNaN(value) ? 0 : value), max);
    
    setScores(prev => ({
      ...prev,
      [key]: {
        // Guarantee base fields are always present even if key was never initialised
        student_id: studentId,
        class_subject_id: parseInt(csIdStr),
        term_id: currentTerm?.id || 0,
        task: 0,
        homework: 0,
        group_work: 0,
        project_work: 0,
        class_test: 0,
        exam_score: 0,
        ...prev[key],
        [field]: clamped
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

      // Build the list of score entries relevant to current selection only
      const relevantKeys: string[] = [];
      if (entryMode === 'single') {
        students.forEach(s => relevantKeys.push(`${s.id}-${selectedSubject}`));
      } else {
        students.forEach(s =>
          selectedSubjects.forEach(subId => relevantKeys.push(`${s.id}-${subId}`))
        );
      }

      const scoreEntries = relevantKeys
        .map(key => {
          const entry = scores[key];
          if (!entry) return null;
          // If entry is missing identifying fields (typed before state initialised), rebuild them
          if (!entry.student_id || !entry.class_subject_id) {
            const [sid, csid] = key.split('-');
            return {
              ...entry,
              student_id: parseInt(sid),
              class_subject_id: parseInt(csid),
              term_id: entry.term_id || currentTerm?.id || 0,
            };
          }
          return entry;
        })
        .filter(Boolean);

      if (scoreEntries.length === 0) {
        toast({ title: 'No Scores', description: 'Please enter some scores before saving', variant: 'destructive' });
        return;
      }

      let savedCount = 0;
      let errorCount = 0;

      for (const scoreEntry of scoreEntries) {
        try {
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
        // Update saved scores tracking — use consistent student-subject key
        const newSavedScores = new Set(savedScores);
        scoreEntries.forEach(score => {
          newSavedScores.add(`${score.student_id}-${score.class_subject_id}`);
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
      setPublishedReports(Array.isArray(response) ? response : response?.results || []);
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

      const allMsg = response?.message || 'All scores cleared successfully';
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

      const selMsg = response?.message || `Scores cleared for ${selectedStudents.length} student(s)`;
      toast({
        title: "Success",
        description: selMsg
      });

      // Reset scores state for selected students
      const newScores = { ...scores };
      selectedStudents.forEach(studentId => {
        Object.keys(newScores).forEach(key => {
          if (key.startsWith(`${studentId}-`)) {
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

      const subMsg = response?.message || 'Score cleared successfully';
      toast({
        title: "Success",
        description: subMsg
      });

      // Remove from local state — key uses dash separator
      const key = `${studentId}-${subjectId}`;
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

      {/* Score Entry Mode Display */}
      {currentTerm && (
        <div className="animated-border-subtle">
          <div className="animated-border-subtle-content">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Active Term:</strong> {currentTerm.name} {currentTerm.academic_year && `(${currentTerm.academic_year})`}
                  </div>
                  <div className="text-sm">
                    <strong>Score Entry Mode:</strong> 
                    <Badge variant="outline" className="ml-2">
                      {scoreEntryMode === 'CLASS_TEACHER' ? 'Class Teacher Mode' : 'Subject Teacher Mode'}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {scoreEntryMode === 'CLASS_TEACHER' 
                    ? 'Class teachers can enter scores for all subjects in their assigned class'
                    : 'Teachers can only enter scores for subjects they are assigned to teach'
                  }
                </div>
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
                <Button onClick={proceedToClassStep} disabled={!entryMode} size="lg">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Selection Step */}
      {currentStep === 'class' && currentTerm && (
        <div className="space-y-6">
          <div className="animated-border">
            <div className="animated-border-content p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Select Class</h3>
                <Button variant="outline" size="sm" onClick={goBackToMode}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              {availableClasses.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No classes found. Please ensure you have been assigned to a class or subject.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableClasses.map(cls => (
                    <div
                      key={cls.id}
                      className={`animated-quick-action cursor-pointer transition-all ${selectedClass?.id === cls.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => handleClassSelect(cls)}
                    >
                      <div className="animated-quick-action-content p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{cls.name}</div>
                            {cls.isFormClass ? (
                              <Badge variant="default" className="mt-1 text-xs">Assigned Class</Badge>
                            ) : (
                              <Badge variant="outline" className="mt-1 text-xs">Subject Class</Badge>
                            )}
                          </div>
                          {selectedClass?.id === cls.id && <CheckCircle className="h-5 w-5 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {cls.isFormClass
                            ? 'All class subjects available (you are class teacher)'
                            : 'Your assigned subjects only'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {loadingSubjects && (
                <div className="text-center py-4 text-sm text-muted-foreground">Loading subjects...</div>
              )}

              {selectedClass && !loadingSubjects && (
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={proceedToSubjects}
                    size="lg"
                    disabled={classSubjects.length === 0}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {classSubjects.length === 0
                      ? 'No subjects available'
                      : `Continue (${classSubjects.length} subject${classSubjects.length === 1 ? '' : 's'})`}
                  </Button>
                </div>
              )}
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
                <Button variant="outline" size="sm" onClick={goBackToClass}>
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
                      <SelectValue placeholder={classSubjects.length === 0 ? "No subjects available" : "Select a subject"} />
                    </SelectTrigger>
                    <SelectContent>
                      {classSubjects.length > 0 && classSubjects.map(cs => (
                        <SelectItem key={cs.id} value={cs.id.toString()}>
                          {cs.subject.name}
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

      {/* Entry Step - loading state */}
      {currentStep === 'entry' && loadingStudents && (
        <div className="animated-border">
          <div className="animated-border-content p-8 text-center text-muted-foreground">
            Loading students...
          </div>
        </div>
      )}

      {/* Entry Step - no students */}
      {currentStep === 'entry' && !loadingStudents && students.length === 0 && (
        <div className="animated-border">
          <div className="animated-border-content p-8 text-center">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>No students found for the selected class and subject.</AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* Entry Step */}
      {currentStep === 'entry' && !loadingStudents && students.length > 0 && (
        <div className="space-y-4">

          {/* ── Top header bar ── */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            {/* coloured accent strip */}
            <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
            <div className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base leading-tight">
                      {entryMode === 'single' ? getCurrentSubject()?.subject.name : 'Multiple Subjects Entry'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Student <span className="font-medium text-foreground">{currentStudentIndex + 1}</span> of <span className="font-medium text-foreground">{students.length}</span>
                      &nbsp;·&nbsp;
                      <span className="text-green-600 font-medium">{getSavedCount()} saved</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={goBackToSubjects} className="text-muted-foreground">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteAction('all')} disabled={deleting}
                    className="text-destructive border-destructive/30 hover:bg-destructive/5">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>
              {/* progress bar */}
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(getProgress())}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                    style={{ width: `${getProgress()}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Student identity card ── */}
          <div className="rounded-xl border bg-gradient-to-br from-card to-muted/20 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  {getCurrentStudent().full_name.split(' ').map((n: string) => n[0]).slice(0,2).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base">{getCurrentStudent().full_name}</h3>
                    <Badge variant="secondary" className="text-[10px] h-5">#{getCurrentStudent().student_id}</Badge>
                    {savedScores.has(`${getCurrentStudent().id}-${selectedSubject}`) && (
                      <Badge className="text-[10px] h-5 bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />Saved
                      </Badge>
                    )}
                  </div>
                  {entryMode === 'single' && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Subject: <span className="font-semibold text-foreground">{getCurrentSubject()?.subject.name}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`student-${getCurrentStudent().id}`}
                  checked={selectedStudents.includes(getCurrentStudent().id.toString())}
                  onCheckedChange={() => handleStudentSelect(getCurrentStudent().id.toString())}
                />
                <Label htmlFor={`student-${getCurrentStudent().id}`} className="text-xs text-muted-foreground cursor-pointer select-none">Select</Label>
                {entryMode === 'single' && (
                  <Button variant="ghost" size="sm" onClick={() => clearStudentSubjectScore(getCurrentStudent().id, selectedSubject)}
                    disabled={deleting} className="text-muted-foreground hover:text-destructive ml-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            {/* mini student navigator dots */}
            <div className="mt-3 flex gap-1 flex-wrap">
              {students.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStudentIndex(i)}
                  title={s.full_name}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    i === currentStudentIndex
                      ? 'w-6 bg-primary'
                      : savedScores.has(`${s.id}-${selectedSubject}`)
                        ? 'w-2 bg-green-400'
                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                  }`}
                />
              ))}
            </div>
            {selectedStudents.length > 0 && (
              <div className="mt-3 flex items-center justify-between bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                <span className="text-xs text-destructive font-medium">{selectedStudents.length} student(s) selected</span>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteAction('selected')} disabled={deleting}
                  className="text-destructive h-6 text-xs px-2">
                  <Trash2 className="h-3 w-3 mr-1" />Clear Selected
                </Button>
              </div>
            )}
          </div>

          {/* ── Single subject score entry ── */}
          {entryMode === 'single' && getCurrentStudent() && getCurrentSubject() && (() => {
            const studentKey = `${getCurrentStudent().id}-${selectedSubject}`;
            const caTotal = calculateCATotal(getCurrentStudent().id);
            const examVal = Number(scores[studentKey]?.exam_score ?? 0);
            const grandTotal = caTotal + examVal;
            const caPercent = Math.round((caTotal / 50) * 100);
            const examPercent = Math.round((examVal / 50) * 100);
            const totalPercent = Math.round((grandTotal / 100) * 100);

            const caFields: { field: keyof ScoreData; label: string; icon: React.ReactNode }[] = [
              { field: 'task',         label: 'Task / Exercise',     icon: <PenLine className="h-3.5 w-3.5" /> },
              { field: 'homework',     label: 'Homework',            icon: <BookMarked className="h-3.5 w-3.5" /> },
              { field: 'group_work',   label: 'Group Work',          icon: <Users className="h-3.5 w-3.5" /> },
              { field: 'project_work', label: 'Project Work',        icon: <FlaskConical className="h-3.5 w-3.5" /> },
              { field: 'class_test',   label: 'Class Test',          icon: <ClipboardList className="h-3.5 w-3.5" /> },
            ];

            return (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                {/* section header */}
                <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm text-foreground">Continuous Assessment</span>
                    <Badge variant="outline" className="text-xs h-5">50 marks</Badge>
                  </div>
                  <span className={`text-sm font-bold ${caTotal >= 50 ? 'text-green-600' : caTotal >= 35 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {caTotal} / 50
                  </span>
                </div>
                <div className="p-5 space-y-5">
                  {/* CA progress bar */}
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${caPercent}%` }} />
                  </div>

                  {/* CA fields grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {caFields.map(({ field, label, icon }) => {
                      const max = FIELD_MAX[field] ?? 10;
                      const val = Number(scores[studentKey]?.[field] ?? 0);
                      const pct = Math.round((val / max) * 100);
                      const atMax = val >= max;
                      return (
                        <div key={field}
                          className={`group relative rounded-xl border transition-all duration-200 p-4 ${
                            atMax ? 'border-green-300 bg-green-50/50' : 'border-border bg-background hover:border-primary/40 hover:shadow-sm'
                          }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-primary">{icon}</span>
                              <span className="text-xs font-semibold text-foreground">{label}</span>
                            </div>
                            {atMax && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                          </div>
                          <Input
                            type="number" min="0" max={max} step="0.1"
                            className={`h-10 text-center text-lg font-bold rounded-lg ${
                              atMax
                                ? 'border-green-300 bg-green-50 text-green-700'
                                : 'border-border bg-muted/40 text-foreground'
                            }`}
                            value={val === 0 ? '' : val}
                            placeholder="—"
                            onChange={(e) => updateScore(getCurrentStudent().id, field, parseFloat(e.target.value) || 0)}
                          />
                          <div className="mt-2 space-y-1">
                            <div className="h-1 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-300 ${atMax ? 'bg-green-500' : 'bg-primary'}`}
                                style={{ width: `${pct}%` }} />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>0</span>
                              <span className="font-bold text-foreground">{val} / {max}</span>
                              <span>{max}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Divider + Exam */}
                  <div className="rounded-xl border-2 border-dashed border-primary/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm text-foreground">Examination Score</span>
                        <Badge variant="outline" className="text-xs h-5">50 marks</Badge>
                      </div>
                      <span className={`text-sm font-bold ${examVal >= 50 ? 'text-green-600' : 'text-foreground'}`}>
                        {examVal} / 50
                      </span>
                    </div>
                    {(() => {
                      const max = FIELD_MAX['exam_score'] ?? 50;
                      const val = examVal;
                      const atMax = val >= max;
                      const pct = Math.round((val / max) * 100);
                      return (
                        <div className="flex items-center gap-4">
                          <Input
                            type="number" min="0" max={max} step="0.1"
                            className={`h-12 text-center text-xl font-bold w-28 shrink-0 ${
                              atMax ? 'border-green-300 bg-green-50 text-green-700' : 'border-border bg-muted/40 text-foreground'
                            }`}
                            value={val === 0 ? '' : val}
                            placeholder="0"
                            onChange={(e) => updateScore(getCurrentStudent().id, 'exam_score', parseFloat(e.target.value) || 0)}
                          />
                          <div className="flex-1 space-y-1">
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-300 ${atMax ? 'bg-green-500' : 'bg-primary'}`}
                                style={{ width: `${pct}%` }} />
                            </div>
                            <div className="flex justify-between text-xs font-medium text-muted-foreground">
                              <span>0</span><span>{max}</span>
                            </div>
                          </div>
                          {atMax && <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Score summary strip */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'CA Total', value: caTotal, max: 50, pct: caPercent, barColor: 'bg-blue-500' },
                      { label: 'Exam Score', value: examVal, max: 50, pct: examPercent, barColor: 'bg-purple-500' },
                      { label: 'Grand Total', value: grandTotal, max: 100, pct: totalPercent,
                        barColor: grandTotal >= 80 ? 'bg-green-500' : grandTotal >= 50 ? 'bg-primary' : 'bg-destructive' },
                    ].map(({ label, value, max, pct, barColor }) => {
                      const valColor = label === 'CA Total' ? 'text-blue-600'
                        : label === 'Exam Score' ? 'text-purple-600'
                        : value >= 80 ? 'text-green-600' : value >= 50 ? 'text-primary' : 'text-destructive';
                      return (
                        <div key={label} className="rounded-xl border bg-card p-3 text-center shadow-sm">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
                          <div className={`text-2xl font-extrabold ${valColor}`}>{value}</div>
                          <div className="text-xs font-medium text-muted-foreground">out of {max}</div>
                          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                    }
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Multiple subjects entry ── */}
          {entryMode === 'multiple' && getCurrentStudent() && (
            <div className="space-y-3">
              {selectedSubjects.map(subjectId => {
                const subject = classSubjects.find(cs => cs.id.toString() === subjectId);
                if (!subject) return null;
                const studentKey = `${getCurrentStudent().id}-${subjectId}`;
                const caTotal = calculateCATotal(getCurrentStudent().id, subjectId);
                const examVal = Number(scores[studentKey]?.exam_score ?? 0);
                const grandTotal = caTotal + examVal;

                return (
                  <div key={subjectId} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">{subject.subject.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${grandTotal >= 80 ? 'text-green-600' : grandTotal >= 50 ? 'text-primary' : 'text-muted-foreground'}`}>
                          {grandTotal}/100
                        </span>
                        {savedScores.has(`${getCurrentStudent().id}-${subjectId}`) && (
                          <Badge className="text-[10px] h-5 bg-green-100 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />Saved
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {(['task', 'homework', 'group_work', 'project_work', 'class_test'] as (keyof ScoreData)[]).map((field) => {
                          const max = FIELD_MAX[field] ?? 10;
                          const val = Number(scores[studentKey]?.[field] ?? 0);
                          const atMax = val >= max;
                          const labels: Record<string, string> = {
                            task: 'Task', homework: 'HW', group_work: 'Group',
                            project_work: 'Project', class_test: 'Test'
                          };
                          return (
                            <div key={field} className={`rounded-lg border p-2 text-center transition-colors ${atMax ? 'border-green-300 bg-green-50/50' : 'border-border bg-muted/20'}`}>
                              <div className="text-xs font-semibold text-foreground mb-1.5 truncate">{labels[field]}</div>
                              <Input
                                type="number" min="0" max={max} step="0.1"
                                className={`h-8 text-center text-sm font-bold border shadow-none focus-visible:ring-1 px-1 ${
                                  atMax ? 'border-green-300 bg-green-50 text-green-700' : 'border-border bg-background text-foreground'
                                }`}
                                value={val === 0 ? '' : val}
                                placeholder="—"
                                onChange={(e) => updateScore(getCurrentStudent().id, field, parseFloat(e.target.value) || 0, subjectId)}
                              />
                              <div className="text-xs font-medium text-muted-foreground mt-1">/{max}</div>
                            </div>
                          );
                        })}
                        {/* Exam field */}
                        {(() => {
                          const max = FIELD_MAX['exam_score'] ?? 50;
                          const val = examVal;
                          const atMax = val >= max;
                          return (
                            <div className={`rounded-lg border-2 p-2 text-center transition-colors ${atMax ? 'border-green-400 bg-green-50' : 'border-primary/50 bg-primary/5'}`}>
                              <div className="text-xs font-bold text-primary mb-1.5">Exam</div>
                              <Input
                                type="number" min="0" max={max} step="0.1"
                                className={`h-8 text-center text-sm font-bold border shadow-none focus-visible:ring-1 px-1 ${
                                  atMax ? 'border-green-300 bg-green-50 text-green-700' : 'border-primary/40 bg-background text-primary'
                                }`}
                                value={val === 0 ? '' : val}
                                placeholder="—"
                                onChange={(e) => updateScore(getCurrentStudent().id, 'exam_score', parseFloat(e.target.value) || 0, subjectId)}
                              />
                              <div className="text-xs font-medium text-muted-foreground mt-1">/{max}</div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Navigation bar ── */}
          <div className="rounded-xl border bg-card shadow-sm p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Prev */}
              <Button variant="outline" onClick={previousStudent} disabled={isFirstStudent()} className="shrink-0">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {/* Middle actions */}
              <div className="flex items-center gap-2 flex-1 justify-center flex-wrap">
                <Button variant="outline" size="sm" onClick={previewReport} disabled={loadingPreview}>
                  <Eye className="h-4 w-4 mr-1.5" />
                  {loadingPreview ? 'Loading…' : 'Preview'}
                </Button>
                <Button variant="outline" size="sm" onClick={previewAllReports}>
                  <FileText className="h-4 w-4 mr-1.5" />
                  All Reports
                </Button>
                <Button
                  onClick={saveScores}
                  disabled={saving}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {saving ? 'Saving…' : 'Save'}
                </Button>
                <Button
                  onClick={exportAllReports}
                  disabled={exporting}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                >
                  <Upload className="h-4 w-4 mr-1.5" />
                  {exporting ? 'Exporting…' : 'Export'}
                </Button>
              </div>

              {/* Next / Finish */}
              {!isLastStudent() ? (
                <Button onClick={nextStudent} className="shrink-0">
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={saveScores} disabled={saving} className="shrink-0 bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {saving ? 'Saving…' : 'Finish & Save'}
                </Button>
              )}
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