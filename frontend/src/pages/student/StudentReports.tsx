import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { secureApiClient } from '@/lib/secureApiClient';
import { useAuthStore } from '@/stores/authStore';
import { SecureTokenStorage } from '@/services/authService';
import {
  FileText, Loader2, AlertCircle, RefreshCw, Download, Eye,
  Trophy, TrendingUp, BookOpen, MessageSquare, ExternalLink
} from 'lucide-react';

interface SubjectResult {
  subject_name: string;
  ca_score: number;
  exam_score: number;
  total_score: number;
  grade: string;
  remark: string;
}

interface TermReport {
  id: number;
  student_id: number;
  term_id: number;
  term_name: string;
  academic_year: string;
  class_name: string;
  average_score: number;
  total_score: number;
  class_position: number | null;
  total_students: number;
  subjects_count: number;
  teacher_remarks: string;
  promoted: boolean;
  subjects: SubjectResult[];
}

interface PublishedReport {
  id: number;
  student_id: number;
  term_id: number;
  term_name: string;
  academic_year: string;
  status: string;
  generated_at: string;
  published_at: string | null;
  report_code: string;
  pdf_url: string | null;
}

const gradeColor: Record<string, string> = {
  'A+': 'bg-emerald-100 text-emerald-700',
  'A':  'bg-emerald-100 text-emerald-700',
  'B':  'bg-blue-100 text-blue-700',
  'C':  'bg-yellow-100 text-yellow-700',
  'D':  'bg-orange-100 text-orange-700',
  'E':  'bg-orange-100 text-orange-700',
  'F':  'bg-red-100 text-red-700',
};

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const StudentReports = () => {
  const [reports, setReports] = useState<TermReport[]>([]);
  const [publishedReports, setPublishedReports] = useState<PublishedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { accessToken: storeToken, user } = useAuthStore();
  const token = storeToken || SecureTokenStorage.getAccessToken() || '';

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [reportsRes, publishedRes] = await Promise.all([
        secureApiClient.get('/students/reports/'),
        secureApiClient.get('/students/published-reports/')
      ]);
      
      const reportsList: TermReport[] = Array.isArray(reportsRes) ? reportsRes : [];
      const publishedList: PublishedReport[] = Array.isArray(publishedRes) ? publishedRes : [];
      
      setReports(reportsList);
      setPublishedReports(publishedList);
      
      // Set initial term from either regular reports OR published reports
      if (!selectedTermId) {
        if (reportsList.length > 0) {
          setSelectedTermId(reportsList[0].term_id);
        } else if (publishedList.length > 0) {
          setSelectedTermId(publishedList[0].term_id);
        }
      }
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const current = reports.find(r => r.term_id === selectedTermId);
  const currentPublished = publishedReports.find(r => r.term_id === selectedTermId);
  
  // If no regular report but we have a published report, create a mock current report for UI
  const currentReport = current || (currentPublished ? {
    id: currentPublished.id,
    student_id: 0, // Will be filled from user context
    term_id: currentPublished.term_id,
    term_name: currentPublished.term_name,
    academic_year: currentPublished.academic_year,
    class_name: 'Unknown Class', // We don't have class info from published reports
    average_score: 0,
    total_score: 0,
    class_position: null,
    total_students: 0,
    subjects_count: 0,
    teacher_remarks: '',
    promoted: false,
    subjects: []
  } : null);

  const handleViewReport = (termId: number) => {
    // Use direct server URL with token in query param — exactly like the teacher's preview.
    // This ensures the iframe loads CSS, images and fonts from the server correctly
    // (a blob: URL would break all relative resource paths).
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const tokenValue = token || '';
    const src = `${apiBase}/students/published-reports/${termId}/view/?token=${encodeURIComponent(tokenValue)}`;
    setPreviewUrl(src);
    setShowPreview(true);
  };

  const handleDownloadPDF = async (termId: number) => {
    const studentId = currentReport?.student_id || currentPublished?.student_id;
    if (!studentId) return;

    try {
      // Try server-side PDF generation first
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiBase}/reports/report-cards/generate_pdf_report/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ student_id: studentId, term_id: termId })
      });

      if (!response.ok) {
        // Fallback: open the report view in a new tab for browser Print → Save as PDF
        const tokenValue = token || '';
        const printUrl = `${apiBase}/students/published-reports/${termId}/view/?token=${encodeURIComponent(tokenValue)}`;
        const win = window.open(printUrl, '_blank');
        if (win) {
          win.addEventListener('load', () => { try { win.print(); } catch {} });
        }
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${currentReport?.term_name || currentPublished?.term_name || 'report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download failed:', err);
      // Fallback: open in new tab for printing
      try {
        const apiBase = import.meta.env.VITE_API_URL || '/api';
        const tokenValue = token || '';
        const printUrl = `${apiBase}/students/published-reports/${termId}/view/?token=${encodeURIComponent(tokenValue)}`;
        window.open(printUrl, '_blank');
      } catch {
        setError('Failed to download PDF. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading reports…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-center text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => fetchData()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">My Reports</h1>
            <p className="text-xs text-muted-foreground">Term report cards</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => fetchData(true)} disabled={refreshing} className="h-9 w-9">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {reports.length === 0 && publishedReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <FileText className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No reports available yet</p>
          <p className="text-xs text-muted-foreground text-center">
            Your term reports will appear here once your class teacher publishes them
          </p>
        </div>
      ) : (
        <>
          {/* Term selector */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {/* Show terms from both regular reports and published reports */}
            {[...reports, ...publishedReports.filter(pr => !reports.find(r => r.term_id === pr.term_id))].map(r => (
              <button
                key={r.term_id}
                onClick={() => setSelectedTermId(r.term_id)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                  selectedTermId === r.term_id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {r.term_name}
              </button>
            ))}
          </div>

          {currentReport && (
            <>
              {/* Summary card */}
              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-primary-foreground space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium opacity-80">{currentReport.academic_year}</p>
                    <p className="text-sm font-bold">{currentReport.term_name} — {currentReport.class_name}</p>
                  </div>
                  {currentReport.class_position && (
                    <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
                      <Trophy className="h-3.5 w-3.5" />
                      <span className="text-xs font-bold">
                        {ordinal(currentReport.class_position)} of {currentReport.total_students}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold">{currentReport.average_score.toFixed(1)}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">Average</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold">{currentReport.total_score.toFixed(0)}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">Total</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold">{currentReport.subjects_count}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">Subjects</p>
                  </div>
                </div>

                {currentReport.promoted && (
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                    <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                    <p className="text-xs font-medium">Promoted to next class</p>
                  </div>
                )}

                {currentReport.teacher_remarks && (
                  <div className="flex items-start gap-2 bg-white/10 rounded-xl p-3">
                    <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-70" />
                    <p className="text-xs opacity-90 leading-relaxed">{currentReport.teacher_remarks}</p>
                  </div>
                )}

                {/* Action buttons - show if published */}
                {currentPublished && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => handleViewReport(selectedTermId!)}
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Report
                    </Button>
                    <Button
                      onClick={() => handleDownloadPDF(selectedTermId!)}
                      size="sm"
                      className="flex-1 bg-white text-primary hover:bg-white/90"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                )}

                {/* Status message */}
                {!currentPublished && (
                  <div className="bg-yellow-500/20 border border-yellow-300/30 rounded-xl p-3 mt-4">
                    <p className="text-xs text-yellow-100">
                      📋 Report not yet published by your teacher
                    </p>
                  </div>
                )}
              </div>

              {/* Subject results */}
              {currentReport.subjects && currentReport.subjects.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject Results</p>
                  <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    {currentReport.subjects.map((s, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 px-4 py-3.5 ${i < currentReport.subjects.length - 1 ? 'border-b border-border' : ''}`}
                      >
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{s.subject_name}</p>
                          <p className="text-xs text-muted-foreground">
                            CA: {s.ca_score} · Exam: {s.exam_score} · {s.remark}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground">{s.total_score}</p>
                          <Badge className={`text-[10px] border-0 ${gradeColor[s.grade] ?? 'bg-gray-100 text-gray-700'}`}>
                            {s.grade}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Report View</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(previewUrl, '_blank')}
                  variant="outline"
                  size="sm"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
                <Button
                  onClick={() => {
                    setShowPreview(false);
                    if (previewUrl && previewUrl.startsWith('blob:')) {
                      URL.revokeObjectURL(previewUrl);
                    }
                    setPreviewUrl(null);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={previewUrl}
                className="w-full h-full border rounded"
                title="Report View"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentReports;