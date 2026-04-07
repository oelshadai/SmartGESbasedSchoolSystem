import { X, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { SecureTokenStorage } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: number;
  termId?: number;
  previewType?: 'template' | 'student-report';
  currentScores?: Record<string, any>;
}

const ReportPreviewModal = ({ 
  isOpen, 
  onClose, 
  studentId, 
  termId, 
  previewType = 'template',
  currentScores = {}
}: ReportPreviewModalProps) => {
  const { accessToken: authAccessToken } = useAuthStore();
  const storageToken = (typeof window !== 'undefined') ? SecureTokenStorage.getAccessToken() : null;
  const accessToken = authAccessToken || storageToken || null;
  const { toast } = useToast();
  
  if (!isOpen) return null;

  const apiBase = import.meta.env.VITE_API_URL || '/api';

  // Determine iframe source based on preview type
  const getIframeSrc = () => {
    if (previewType === 'student-report' && studentId && termId) {
      // Use existing template preview with student context parameters and current scores
      const currentScoresParam = encodeURIComponent(JSON.stringify(currentScores));
      return accessToken && accessToken.length > 0
        ? `${apiBase}/reports/template-preview-public/?student_id=${studentId}&term_id=${termId}&current_scores=${currentScoresParam}&token=${encodeURIComponent(accessToken)}`
        : `${apiBase}/reports/preview-iframe/?student_id=${studentId}&term_id=${termId}&current_scores=${currentScoresParam}`;
    } else {
      // General template preview
      return accessToken && accessToken.length > 0
        ? `${apiBase}/reports/template-preview-public/?token=${encodeURIComponent(accessToken)}`
        : `${apiBase}/reports/preview-iframe/`;
    }
  };

  const getTitle = () => {
    return previewType === 'student-report' 
      ? 'Student Terminal Report Preview'
      : 'Report Template Preview';
  };

  const handlePrint = () => {
    // Browsers block cross-origin iframe.contentWindow.print().
    // Open the report URL in a new popup so we own the window and can call print().
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
      try {
        popup.print();
      } catch {
        // If print() is still blocked (rare), just leave the window open for manual print
      }
    };
  };

  const handleSavePDF = async () => {
    try {
      if (previewType === 'student-report' && studentId && termId) {
        // Use the dedicated PDF generation endpoint for student reports
        const response = await fetch(`${apiBase}/reports/report-cards/generate_pdf_report/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            student_id: studentId,
            term_id: termId
          })
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `student_${studentId}_term_${termId}_report.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          toast({
            title: 'PDF Downloaded',
            description: 'Report PDF has been downloaded successfully.',
          });
        } else {
          throw new Error('Failed to generate PDF');
        }
      } else {
        // For template preview, use the same endpoint with format=pdf
        const pdfUrl = accessToken && accessToken.length > 0
          ? `${apiBase}/reports/template-preview-public/?token=${encodeURIComponent(accessToken)}&format=pdf`
          : `${apiBase}/reports/preview-iframe/?format=pdf`;
        
        window.open(pdfUrl, '_blank');
        
        toast({
          title: 'PDF Generated',
          description: 'PDF opened in new tab successfully.',
        });
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'PDF Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[90vw] h-[90vh] flex flex-col max-w-6xl">
        <div className="flex flex-wrap justify-between items-center gap-2 p-3 border-b">
          <h3 className="text-base font-semibold truncate max-w-[60%] sm:max-w-none">{getTitle()}</h3>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-1 px-2 sm:px-3"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSavePDF}
              className="flex items-center gap-1 px-2 sm:px-3"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Save PDF</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 px-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 p-4">
          <iframe 
            src={getIframeSrc()}
            className="w-full h-full border rounded" 
            frameBorder="0"
            title={getTitle()}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportPreviewModal;