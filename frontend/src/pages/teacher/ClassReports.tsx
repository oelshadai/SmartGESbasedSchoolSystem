import { useState, useEffect } from 'react';
import StatCard from '@/components/shared/StatCard';
import { BarChart3, Award, Users, TrendingUp, FileText, Calendar, Download, Eye, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { secureApiClient } from '@/lib/secureApiClient';
import { toast } from 'sonner';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  student_id: string;
}

interface TermResult {
  id: number;
  student: Student;
  total_score: number;
  average_score: number;
  class_position: number;
  grade: string;
  term: {
    id: number;
    name: string;
    year: string;
  };
}

interface SubjectResult {
  id: number;
  student: Student;
  class_subject: {
    subject: {
      name: string;
      code: string;
    };
  };
  total_score: number;
  grade: string;
}

interface Assignment {
  id: number;
  title: string;
  assignment_type: string;
  max_score: number;
  due_date: string;
  status: string;
  created_at: string;
}

interface ClassData {
  id: number;
  name: string;
  level: string;
  section?: string;
}

interface Term {
  id: number;
  name: string;
  display_name: string;
  year: string;
}

const ClassReports = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  
  // Real data states
  const [termResults, setTermResults] = useState<TermResult[]>([]);
  const [subjectResults, setSubjectResults] = useState<SubjectResult[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classMetrics, setClassMetrics] = useState({
    classAverage: 0,
    passRate: 0,
    totalStudents: 0,
    reportsGenerated: 0
  });
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  // Preview / download state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewStudentName, setPreviewStudentName] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Fetch teacher's classes
  const fetchClasses = async () => {
    try {
      const data = await secureApiClient.get('/schools/classes/');
      setClasses(data.results || []);
      if (data.results?.length > 0) {
        setSelectedClass(data.results[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  // Fetch terms
  const fetchTerms = async () => {
    try {
      const data = await secureApiClient.get('/schools/terms/');
      setTerms(data.results || []);
      if (data.results?.length > 0) {
        setSelectedTerm(data.results[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
    }
  };

  // Fetch term results for selected class and term
  const fetchTermResults = async () => {
    if (!selectedClass || !selectedTerm) return;
    
    try {
      const data = await secureApiClient.get(`/scores/term-results/?class_id=${selectedClass}&term_id=${selectedTerm}`);
      setTermResults(data.results || []);
      calculateMetrics(data.results || []);
    } catch (error) {
      console.error('Error fetching term results:', error);
    }
  };

  // Fetch subject results
  const fetchSubjectResults = async () => {
    if (!selectedTerm) return;
    
    try {
      const data = await secureApiClient.get(`/scores/subject-results/?term_id=${selectedTerm}`);
      setSubjectResults(data.results || []);
      calculateSubjectPerformance(data.results || []);
    } catch (error) {
      console.error('Error fetching subject results:', error);
    }
  };

  // Fetch assignments
  const fetchAssignments = async () => {
    try {
      const data = await secureApiClient.get('/assignments/teacher/');
      setAssignments(data.results || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  // Calculate class metrics from term results
  const calculateMetrics = (results: TermResult[]) => {
    if (results.length === 0) {
      setClassMetrics({ classAverage: 0, passRate: 0, totalStudents: 0, reportsGenerated: 0 });
      setTopStudents([]);
      setGradeDistribution([]);
      setRecentReports([]);
      return;
    }

    const totalStudents = results.length;
    const totalScore = results.reduce((sum, result) => sum + result.average_score, 0);
    const classAverage = totalScore / totalStudents;
    const passCount = results.filter(result => result.average_score >= 50).length;
    const passRate = (passCount / totalStudents) * 100;

    setClassMetrics({
      classAverage: Math.round(classAverage * 10) / 10,
      passRate: Math.round(passRate),
      totalStudents,
      reportsGenerated: results.filter(r => r.grade).length
    });

    // Top 5 students
    const sortedResults = [...results].sort((a, b) => b.average_score - a.average_score);
    const top5 = sortedResults.slice(0, 5).map((result, index) => ({
      name: `${result.student.first_name} ${result.student.last_name}`,
      studentId: result.student.student_id,
      score: result.average_score,
      grade: result.grade,
      position: index + 1
    }));
    setTopStudents(top5);

    // Grade distribution
    const gradeCount = results.reduce((acc, result) => {
      const grade = result.grade || 'F';
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const gradeOrder = ['A+', 'A', 'B', 'C', 'D', 'F'];
    const gradeColors = {
      'A+': 'bg-green-500',
      'A': 'bg-green-400',
      'B': 'bg-blue-400',
      'C': 'bg-yellow-400',
      'D': 'bg-orange-400',
      'F': 'bg-red-400'
    };

    const distribution = gradeOrder.map(grade => ({
      grade,
      count: gradeCount[grade] || 0,
      percentage: Math.round(((gradeCount[grade] || 0) / totalStudents) * 100),
      color: gradeColors[grade as keyof typeof gradeColors]
    }));
    setGradeDistribution(distribution);

    // Recent reports (using term results as proxy)
    const recentReportsData = sortedResults.slice(0, 10).map(result => ({
      id: result.id,                               // TermResult ID (for preview)
      studentDbId: result.student.id,              // DB student ID (for PDF download)
      termDbId: result.term?.id || parseInt(selectedTerm), // DB term ID (for PDF download)
      studentName: `${result.student.first_name} ${result.student.last_name}`,
      studentId: result.student.student_id,
      term: result.term?.name || 'Current Term',
      year: result.term?.year || selectedYear,
      status: result.grade ? 'Generated' : 'Pending',
      date: new Date().toISOString().split('T')[0],
      average: result.average_score
    }));
    setRecentReports(recentReportsData);
  };

  // Calculate subject performance
  const calculateSubjectPerformance = (results: SubjectResult[]) => {
    const subjectStats = results.reduce((acc, result) => {
      const subjectName = result.class_subject.subject.name;
      if (!acc[subjectName]) {
        acc[subjectName] = { scores: [], passCount: 0 };
      }
      acc[subjectName].scores.push(result.total_score);
      if (result.total_score >= 50) {
        acc[subjectName].passCount++;
      }
      return acc;
    }, {} as Record<string, { scores: number[], passCount: number }>);

    const performance = Object.entries(subjectStats).map(([subject, stats]) => ({
      subject,
      average: Math.round((stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length) * 10) / 10,
      students: stats.scores.length,
      passRate: Math.round((stats.passCount / stats.scores.length) * 100)
    }));

    setSubjectPerformance(performance);
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchClasses(),
        fetchTerms()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedTerm) {
      fetchTermResults();
      fetchSubjectResults();
      fetchAssignments();
    }
  }, [selectedClass, selectedTerm]);

  const handleGenerateReport = (studentId: string) => {
    toast.info('Please enter scores and save first, then use the View/Download buttons.');
  };

  const handleViewReport = async (report: any) => {
    setPreviewStudentName(report.studentName);
    setPreviewHtml('');
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const html = await secureApiClient.get<string>(
        `/reports/report-cards/preview_report/?student_id=${report.studentDbId}&term_id=${report.termDbId}`,
        { responseType: 'text' as any }
      );
      setPreviewHtml(typeof html === 'string' ? html : JSON.stringify(html));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load report preview');
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadReport = async (report: any) => {
    setDownloadingId(report.id);
    try {
      const blob = await secureApiClient.post<Blob>(
        '/reports/report-cards/generate_pdf_report/',
        { student_id: report.studentDbId, term_id: report.termDbId },
        { responseType: 'blob' as any }
      );
      const url = URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob as any]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.studentId}_${report.term}_${report.year}_Report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Report downloaded for ${report.studentName}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to download PDF. Ensure scores are saved first.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading class reports...</span>
      </div>
    );
  }

  const metricsData = [
    { 
      label: 'Class Average', 
      value: `${classMetrics.classAverage}%`, 
      icon: <Award className="h-5 w-5" />, 
      color: 'text-success' 
    },
    { 
      label: 'Pass Rate', 
      value: `${classMetrics.passRate}%`, 
      icon: <TrendingUp className="h-5 w-5" />, 
      color: 'text-info' 
    },
    { 
      label: 'Total Students', 
      value: classMetrics.totalStudents.toString(), 
      icon: <Users className="h-5 w-5" />, 
      color: 'text-secondary' 
    },
    { 
      label: 'Reports Generated', 
      value: classMetrics.reportsGenerated.toString(), 
      icon: <FileText className="h-5 w-5" />, 
      color: 'text-accent' 
    },
  ];

  return (
    <>
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Class Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Generate and manage student reports for your classes</p>
        </div>
        <Button className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Bulk Download
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a class" />
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
            <div>
              <Label className="text-sm font-medium">Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id.toString()}>
                      {term.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Academic Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsData.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Performing Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topStudents.length > 0 ? (
                topStudents.map((student) => (
                  <div key={student.studentId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {student.position}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.studentId}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{student.score}%</p>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        {student.grade}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No student data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Grade Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gradeDistribution.map((grade) => (
                <div key={grade.grade} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground w-8">{grade.grade}</span>
                  <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full ${grade.color} rounded-full flex items-center px-3 transition-all duration-300`}
                      style={{ width: `${Math.max(grade.percentage, 10)}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        {grade.count} students
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {grade.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Subject Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjectPerformance.length > 0 ? (
              subjectPerformance.map((subject) => (
                <div key={subject.subject} className="p-4 rounded-lg border bg-card">
                  <h4 className="font-medium text-foreground mb-2">{subject.subject}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Average:</span>
                      <span className="font-medium">{subject.average}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pass Rate:</span>
                      <span className="font-medium">{subject.passRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Students:</span>
                      <span className="font-medium">{subject.students}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No subject performance data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Report Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Student</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">ID</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Term</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Average</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.length > 0 ? (
                  recentReports.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{report.studentName}</td>
                      <td className="py-3 px-2 text-muted-foreground">{report.studentId}</td>
                      <td className="py-3 px-2">{report.term} {report.year}</td>
                      <td className="py-3 px-2 font-medium">{report.average}%</td>
                      <td className="py-3 px-2">
                        <Badge 
                          variant={report.status === 'Generated' ? 'default' : 'secondary'}
                          className={report.status === 'Generated' ? 'bg-success text-success-foreground' : ''}
                        >
                          {report.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {new Date(report.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            title="Preview report"
                            onClick={() => handleViewReport(report)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            title="Download PDF"
                            onClick={() => handleDownloadReport(report)}
                            disabled={downloadingId === report.id}
                            className="h-8 w-8 p-0"
                          >
                            {downloadingId === report.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <Download className="h-3 w-3" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No report data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Report Preview Dialog */}
    <Dialog open={previewOpen} onOpenChange={(open) => { if (!open) { setPreviewOpen(false); setPreviewHtml(''); } }}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-3 border-b flex-shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-semibold">
            Report Preview — {previewStudentName}
          </DialogTitle>
          <div className="flex gap-2 items-center">
            {!previewLoading && previewHtml && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const report = recentReports.find(r => r.studentName === previewStudentName);
                  if (report) handleDownloadReport(report);
                }}
                disabled={downloadingId !== null}
              >
                {downloadingId !== null
                  ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Downloading...</>
                  : <><Download className="h-4 w-4 mr-1" />Download PDF</>}
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setPreviewOpen(false); setPreviewHtml(''); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {previewLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading report...</span>
            </div>
          ) : (
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full border-0"
              title="Report Preview"
              sandbox="allow-same-origin"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>    </>  );
};

export default ClassReports;