import { useEffect, useState } from 'react';
import StatCard from '@/components/shared/StatCard';
import { BarChart3, TrendingUp, Users, Award, FileText, Download, Eye, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import secureApiClient from '@/lib/secureApiClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const ReportsDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');

  // Generate Report Modal State
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showBulkGenerateDialog, setShowBulkGenerateDialog] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    student_id: 'select-student',
    term_id: 'select-term',
  });
  const [bulkGenerateForm, setBulkGenerateForm] = useState({
    class_id: 'select-class',
    term_id: 'select-term-bulk',
  });
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Preview / download state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewStudentName, setPreviewStudentName] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchDashboardData = async () => {
    try {
      const response = await secureApiClient.get('/schools/dashboard/');
      setDashboardData(response);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  const fetchReportCards = async () => {
    try {
      let url = '/reports/report-cards/';
      const params = new URLSearchParams();
      if (selectedClass && selectedClass !== 'all') params.append('class_id', selectedClass);
      if (selectedTerm && selectedTerm !== 'all') params.append('term_id', selectedTerm);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await secureApiClient.get(url);
      setReportCards(Array.isArray(response) ? response : response.results || response.data || []);
    } catch (err: any) {
      console.error('Failed to load report cards:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      let url = '/students/';
      if (selectedClass && selectedClass !== 'all') url += `?class_id=${selectedClass}`;
      
      const response = await secureApiClient.get(url);
      setStudents(Array.isArray(response) ? response : response.results || response.data || []);
    } catch (err: any) {
      console.error('Failed to load students:', err);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await secureApiClient.get('/schools/classes/');
      setClasses(Array.isArray(response) ? response : response.results || response.data || []);
    } catch (err: any) {
      console.error('Failed to load classes:', err);
    }
  };

  const fetchTerms = async () => {
    try {
      const response = await secureApiClient.get('/schools/terms/');
      setTerms(Array.isArray(response) ? response : response.results || response.data || []);
    } catch (err: any) {
      console.error('Failed to load terms:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchDashboardData(),
          fetchClasses(),
          fetchTerms()
        ]);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Refetch data when filters change
  useEffect(() => {
    if (!loading) {
      fetchReportCards();
      fetchStudents();
    }
  }, [selectedClass, selectedTerm]);

  const handleBulkGenerate = async () => {
    setGenerating(true);
    setGenerateError(null);
    
    try {
      if (!bulkGenerateForm.class_id || bulkGenerateForm.class_id === 'select-class' || !bulkGenerateForm.term_id || bulkGenerateForm.term_id === 'select-term-bulk') {
        setGenerateError('Please select both class and term.');
        return;
      }
      
      await secureApiClient.post('/reports/report-cards/bulk_generate/', {
        class_id: bulkGenerateForm.class_id,
        term_id: bulkGenerateForm.term_id,
      });
      
      setShowBulkGenerateDialog(false);
      await fetchReportCards();
      alert('Bulk reports generated successfully!');
    } catch (err: any) {
      setGenerateError(err.message || 'Failed to generate reports');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    setGenerateError(null);
    
    try {
      if (!generateForm.student_id || generateForm.student_id === 'select-student' || !generateForm.term_id || generateForm.term_id === 'select-term') {
        setGenerateError('Please select both student and term.');
        return;
      }
      
      await secureApiClient.post('/reports/report-cards/generate_report/', {
        student_id: generateForm.student_id,
        term_id: generateForm.term_id,
      });
      
      setShowGenerateDialog(false);
      await fetchReportCards();
      toast.success('Report generated successfully!');
    } catch (err: any) {
      setGenerateError(err.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewReport = async (report: any) => {
    const studentName = report.student_name || 'Student';
    setPreviewStudentName(studentName);
    setPreviewHtml('');
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      // report.student is the DB student PK, report.term is the DB term PK
      const html = await secureApiClient.get<string>(
        `/reports/report-cards/preview_report/?student_id=${report.student}&term_id=${report.term}`,
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
    const studentLabel = report.student_id || report.student_name || 'student';
    const termLabel = report.term_name || 'term';
    try {
      const blob = await secureApiClient.post<Blob>(
        '/reports/report-cards/generate_pdf_report/',
        { student_id: report.student, term_id: report.term },
        { responseType: 'blob' as any }
      );
      const url = URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob as any]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${studentLabel}_${termLabel}_Report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Report downloaded for ${report.student_name || 'student'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to download PDF. Ensure scores are saved first.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground">Loading reports data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">{error}</div>
      </div>
    );
  }

  const metrics = [
    { 
      label: 'Total Students', 
      value: dashboardData?.counts?.students?.toString() || '0', 
      icon: <Users className="h-5 w-5" />, 
      color: 'text-info' 
    },
    { 
      label: 'Total Classes', 
      value: dashboardData?.counts?.classes?.toString() || '0', 
      icon: <BarChart3 className="h-5 w-5" />, 
      color: 'text-secondary' 
    },
    { 
      label: 'Total Subjects', 
      value: dashboardData?.counts?.subjects?.toString() || '0', 
      icon: <Award className="h-5 w-5" />, 
      color: 'text-success' 
    },
    { 
      label: 'Reports Generated', 
      value: dashboardData?.counts?.reports?.toString() || '0', 
      icon: <FileText className="h-5 w-5" />, 
      color: 'text-accent' 
    },
  ];

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Academic performance analysis and report generation</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowBulkGenerateDialog(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Bulk Generate
          </Button>
          <Button onClick={() => setShowGenerateDialog(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => <StatCard key={m.label} {...m} />)}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Filter by Class</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="bg-background text-foreground">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border">
              <SelectItem value="all" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                All Classes
              </SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id.toString()} className="text-foreground hover:bg-accent hover:text-accent-foreground">
                  {cls.full_name || `${cls.level} ${cls.section || ''}`.trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Filter by Term</label>
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="bg-background text-foreground">
              <SelectValue placeholder="All Terms" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border">
              <SelectItem value="all" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                All Terms
              </SelectItem>
              {terms.map((term) => (
                <SelectItem key={term.id} value={term.id.toString()} className="text-foreground hover:bg-accent hover:text-accent-foreground">
                  {term.academic_year_name} - {term.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="font-semibold text-foreground mb-4">Class Performance</h3>
          <div className="space-y-3">
            {dashboardData?.charts?.students_by_class?.map((c: any) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground w-20">{c.name}</span>
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: `${Math.min(c.students * 4, 100)}%` }} />
                  </div>
                </div>
                <span className="text-sm text-foreground w-12 text-right">{c.students}</span>
              </div>
            )) || (
              <div className="text-muted-foreground text-sm">No class data available</div>
            )}
          </div>
        </div>

        <div className="stat-card">
          <h3 className="font-semibold text-foreground mb-4">Recent Report Cards</h3>
          <div className="space-y-3">
            {reportCards.slice(0, 5).map((report: any) => (
              <div key={report.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <span className="text-sm font-medium text-foreground">{report.student_name || 'Unknown Student'}</span>
                  <div className="text-xs text-muted-foreground">{report.term_name || 'Unknown Term'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={report.status === 'PUBLISHED' ? 'bg-success/10 text-success border-success/20' : report.status === 'GENERATED' ? 'bg-info/10 text-info border-info/20' : 'bg-muted text-muted-foreground'}>
                    {report.status}
                  </Badge>
                  {report.pdf_file && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" title="Download PDF">
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )) || (
              <div className="text-muted-foreground text-sm">No reports generated yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Generate Report Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Report Card</DialogTitle>
            <DialogDescription>
              Select a student and term to generate a report card.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-1">Student *</label>
              <Select value={generateForm.student_id} onValueChange={value => setGenerateForm(prev => ({...prev, student_id: value}))}>
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="select-student" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                    Select Student
                  </SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()} className="text-foreground hover:bg-accent hover:text-accent-foreground">
                      {student.full_name} ({student.student_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Term *</label>
              <Select value={generateForm.term_id} onValueChange={value => setGenerateForm(prev => ({...prev, term_id: value}))}>
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue placeholder="Select Term" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="select-term" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                    Select Term
                  </SelectItem>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id.toString()} className="text-foreground hover:bg-accent hover:text-accent-foreground">
                      {term.academic_year_name} - {term.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {generateError && <div className="text-destructive text-sm">{generateError}</div>}
          </div>
          <DialogFooter>
            <Button onClick={handleGenerateReport} disabled={generating}>
              {generating ? 'Generating...' : 'Generate Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Generate Dialog */}
      <Dialog open={showBulkGenerateDialog} onOpenChange={setShowBulkGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Generate Reports</DialogTitle>
            <DialogDescription>
              Generate report cards for all students in a class and term.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-1">Class *</label>
              <Select value={bulkGenerateForm.class_id} onValueChange={value => setBulkGenerateForm(prev => ({...prev, class_id: value}))}>
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="select-class" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                    Select Class
                  </SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()} className="text-foreground hover:bg-accent hover:text-accent-foreground">
                      {cls.full_name || `${cls.level} ${cls.section || ''}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Term *</label>
              <Select value={bulkGenerateForm.term_id} onValueChange={value => setBulkGenerateForm(prev => ({...prev, term_id: value}))}>
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue placeholder="Select Term" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="select-term-bulk" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                    Select Term
                  </SelectItem>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id.toString()} className="text-foreground hover:bg-accent hover:text-accent-foreground">
                      {term.academic_year_name} - {term.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {generateError && <div className="text-destructive text-sm">{generateError}</div>}
          </div>
          <DialogFooter>
            <Button onClick={handleBulkGenerate} disabled={generating}>
              {generating ? 'Generating...' : 'Generate All Reports'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    {/* Report Preview Dialog */}
    <Dialog open={previewOpen} onOpenChange={(open) => { if (!open) { setPreviewOpen(false); setPreviewHtml(''); } }}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0 gap-0">
        <div className="px-6 py-3 border-b flex-shrink-0 flex flex-row items-center justify-between">
          <h2 className="text-base font-semibold">Report Preview — {previewStudentName}</h2>
          <div className="flex gap-2 items-center">
            {!previewLoading && previewHtml && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const report = reportCards.find(r => (r.student_name || '') === previewStudentName);
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
        </div>
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
    </Dialog>
    </>
  );
};

export default ReportsDashboard;
