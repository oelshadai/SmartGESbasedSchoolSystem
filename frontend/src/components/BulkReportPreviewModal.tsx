import { X, Printer, Download, ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { SecureTokenStorage } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { secureApiClient } from '@/lib/secureApiClient';

interface BulkReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: any[];
  termId?: number;
  allScores: Record<string, any>;
}

const BulkReportPreviewModal = ({ 
  isOpen, 
  onClose, 
  students,
  termId,
  allScores
}: BulkReportPreviewModalProps) => {
  const { accessToken: authAccessToken } = useAuthStore();
  const storageToken = (typeof window !== 'undefined') ? SecureTokenStorage.getAccessToken() : null;
  const accessToken = authAccessToken || storageToken || null;
  const { toast } = useToast();
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  
  if (!isOpen) return null;

  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const currentStudent = students[currentStudentIndex];
  const isFirstStudent = currentStudentIndex === 0;
  const isLastStudent = currentStudentIndex === students.length - 1;

  const nextStudent = () => {
    if (!isLastStudent) {
      setCurrentStudentIndex(prev => prev + 1);
    }
  };

  const previousStudent = () => {
    if (!isFirstStudent) {
      setCurrentStudentIndex(prev => prev - 1);
    }
  };

  const handlePublishReports = async () => {
    if (!termId) {
      toast({
        title: 'Error',
        description: 'Term information is missing. Cannot publish reports.',
        variant: 'destructive'
      });
      return;
    }

    setPublishing(true);
    try {
      const studentIds = students.map(student => student.id);
      
      const response = await secureApiClient.post('/reports/report-cards/publish_bulk/', {
        student_ids: studentIds,
        term_id: termId,
        scores_data: allScores
      });

      toast({
        title: 'Reports Published Successfully!',
        description: `${studentIds.length} student reports have been published. Students can now access their reports.`,
        duration: 5000
      });
      
    } catch (error: any) {
      console.error('Failed to publish reports:', error);
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.error || error?.message || 'Failed to publish reports';
      
      toast({
        title: 'Publish Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setPublishing(false);
    }
  };

  const handlePrint = () => {
    const src = getIframeSrc();
    const printUrl = src.includes('#') ? src : `${src}#print`;
    const popup = window.open(printUrl, '_blank', 'width=900,height=700');
    if (!popup) {
      toast({
        title: 'Print Error',
        description: 'Pop-up was blocked. Please allow pop-ups for this site and try again.',
        variant: 'destructive',
      });
      return;
    }
    popup.onload = () => {
      try { popup.print(); } catch { /* leave window open for manual print */ }
    };
  };

  const handleSavePDF = async () => {
    if (!currentStudent || !termId) {
      toast({
        title: 'PDF Error',
        description: 'Student or term is missing.',
        variant: 'destructive'
      });
      return;
    }

    setDownloadingPdf(true);
    try {
      const currentStudentScores = allScores[currentStudent.id] || {};
      const currentScoresParam = encodeURIComponent(JSON.stringify(currentStudentScores));
      
      const pdfUrl = accessToken && accessToken.length > 0
        ? `${apiBase}/reports/template-preview-public/?student_id=${currentStudent.id}&term_id=${termId}&current_scores=${currentScoresParam}&token=${encodeURIComponent(accessToken)}&format=pdf`
        : `${apiBase}/reports/preview-iframe/?student_id=${currentStudent.id}&term_id=${termId}&current_scores=${currentScoresParam}&format=pdf`;

      const response = await fetch(pdfUrl, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${currentStudent.student_id || currentStudent.full_name}_${termId}_Report.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'PDF Downloaded',
        description: `PDF for ${currentStudent.full_name} has been downloaded.`,
      });
    } catch {
      toast({
        title: 'PDF Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getIframeSrc = () => {
    if (!currentStudent) return '';
    
    const currentStudentScores = allScores[currentStudent.id] || {};
    const currentScoresParam = encodeURIComponent(JSON.stringify(currentStudentScores));
    
    return accessToken && accessToken.length > 0
      ? `${apiBase}/reports/template-preview-public/?student_id=${currentStudent.id}&term_id=${termId}&current_scores=${currentScoresParam}&token=${encodeURIComponent(accessToken)}`
      : `${apiBase}/reports/preview-iframe/?student_id=${currentStudent.id}&term_id=${termId}&current_scores=${currentScoresParam}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[95vw] h-[95vh] flex flex-col max-w-7xl">
        <div className="flex flex-wrap justify-between items-center gap-2 p-3 border-b">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-base font-semibold">
              Reports ({currentStudentIndex + 1}/{students.length})
            </h3>
            {currentStudent && (
              <span className="text-sm text-gray-600 hidden sm:inline truncate">
                {currentStudent.full_name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={previousStudent} disabled={isFirstStudent} className="px-2">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextStudent} disabled={isLastStudent} className="px-2">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="px-2">
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Print</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSavePDF} className="px-2" disabled={downloadingPdf}>
              {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline ml-1">PDF</span>
            </Button>
            <Button
              onClick={handlePublishReports}
              disabled={publishing}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3"
              size="sm"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="hidden sm:inline">{publishing ? 'Publishing...' : 'Publish All'}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="px-2 text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 p-4">
          <iframe 
            id="bulk-reports-iframe"
            src={getIframeSrc()}
            className="w-full h-full border rounded" 
            frameBorder="0"
            title={`Report Preview - ${currentStudent?.full_name || 'Student'}`}
            key={currentStudentIndex}
          />
        </div>
      </div>
    </div>
  );
};

export default BulkReportPreviewModal;