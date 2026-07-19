import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ai, { AlertType } from '@/services/aiService';

interface Props {
  studentId: number;
  studentName: string;
  termId: number;
  /** Pre-fill data for the selected alert type */
  contextData?: Record<string, unknown>;
}

const ALERT_OPTIONS: { value: AlertType; label: string }[] = [
  { value: 'ATTENDANCE_LOW',    label: 'Low Attendance' },
  { value: 'EXAM_POOR',         label: 'Poor Exam Performance' },
  { value: 'FEE_REMINDER',      label: 'Fee Reminder' },
  { value: 'RISK_ALERT',        label: 'General Risk Alert' },
  { value: 'POSITIVE_FEEDBACK', label: 'Positive Feedback' },
];

export default function SmartSmsComposer({ studentId, studentName, termId, contextData = {} }: Props) {
  const [alertType, setAlertType] = useState<AlertType>('RISK_ALERT');
  const [preview, setPreview] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handlePreview = async () => {
    setLoading(true);
    setPreview(null);
    try {
      const res = await ai.previewSmartSms(studentId, termId, alertType, contextData) as any;
      setPreview(res.message);
      setRecipient(res.recipient || '');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to generate SMS', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await ai.sendSmartSms(studentId, termId, alertType, contextData) as any;
      toast({
        title: res.status === 'SENT' ? 'SMS Sent' : 'SMS Failed',
        description: res.status === 'SENT'
          ? `Message sent to ${res.recipient}`
          : 'SMS could not be delivered. Check SMS balance.',
        variant: res.status === 'SENT' ? 'default' : 'destructive',
      });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to send SMS', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-foreground/60" />
          Smart SMS — {studentName}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <Select value={alertType} onValueChange={v => { setAlertType(v as AlertType); setPreview(null); }}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALERT_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="w-full gap-2" onClick={handlePreview} disabled={loading}>
          <Eye className="h-3.5 w-3.5" />
          {loading ? 'Generating…' : 'Preview Message'}
        </Button>

        {preview && (
          <div className="space-y-2">
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-foreground leading-relaxed border border-border">
              {preview}
            </div>
            <div className="flex items-center justify-between text-xs text-foreground/50">
              <span>To: {recipient || 'Guardian phone'}</span>
              <span>{preview.length}/160 chars</span>
            </div>
            <Button size="sm" className="w-full gap-2" onClick={handleSend} disabled={sending}>
              <Send className="h-3.5 w-3.5" />
              {sending ? 'Sending…' : 'Send SMS'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
