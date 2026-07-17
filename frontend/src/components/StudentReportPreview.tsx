import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Download } from 'lucide-react';
import secureApiClient from '@/lib/secureApiClient';

interface StudentReportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  termId: number;
  studentName: string;
}

const StudentReportPreview = ({ isOpen, onClose, studentId, termId, studentName }: StudentReportPreviewProps) => {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generatePreview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await secureApiClient.post('/reports/report-cards/preview_terminal_report/', {
        student_id: studentId,
        term_id: termId
      });
      
      if (response.success && response.preview_url) {
        // Add authentication token to preview URL
        const token = localStorage.getItem('access_token');
        const urlWithToken = `${response.preview_url}?token=${token}`;
        setPreviewUrl(urlWithToken);
      } else {
        setError('Failed to generate preview');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    try {
      const response = await secureApiClient.post('/reports/report-cards/generate_terminal_report/', {
        student_id: studentId,
        term_id: termId
      });
      
      if (response.success) {
        // Download or open PDF
        window.open(response.template_url, '_blank');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate PDF');
    }
  };

  const handleOpen = () => {
    if (isOpen && !previewUrl && !loading) {
      generatePreview();
    }
  };

  // Generate preview when dialog opens
  if (isOpen && !previewUrl && !loading && !error) {
    generatePreview();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Terminal Report Preview - {studentName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col">
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Generating report preview...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={generatePreview} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {previewUrl && (
            <>
              <div className="flex-1 border rounded-lg overflow-hidden">
                <iframe
                  src={previewUrl}
                  className="w-full h-full"
                  title="Report Preview"
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button onClick={generatePDF} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Generate PDF
                </Button>
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentReportPreview;