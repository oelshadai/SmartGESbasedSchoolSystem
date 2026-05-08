import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Loader2, MessageSquare, Phone, KeyRound, AlertTriangle, CheckCircle2, History, ChevronDown, ChevronUp, RefreshCw, XCircle, CheckCircle, Clock, AlertCircle, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import secureApiClient from '@/lib/secureApiClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SmsSettings {
  sms_enabled: boolean;
  sms_balance: number;
  sms_sender_name: string;
  sms_attendance_enabled: boolean;
  sms_fee_reminder_enabled: boolean;
}

interface SmsLogEntry {
  id: number;
  sms_type: 'fee_reminder' | 'attendance' | 'general';
  status: 'success' | 'partial' | 'failed' | 'pending';
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  no_phone_count: number;
  message_preview: string;
  filters_used: Record<string, unknown>;
  details: Array<{
    student: string;
    student_id?: string;
    guardian_phone: string | null;
    total_balance?: number;
    result: string;
    failure_reason?: string;
    message_preview?: string;
  }>;
  failure_reason: string;
  sent_by_name: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const SmsSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SmsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [balanceRefreshing, setBalanceRefreshing] = useState(false);

  // Editable fields
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [attendanceEnabled, setAttendanceEnabled] = useState(false);
  const [feeReminderEnabled, setFeeReminderEnabled] = useState(false);
  const [senderName, setSenderName] = useState('');

  // History
  const [logs, setLogs] = useState<SmsLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data: SmsSettings = await secureApiClient.get('/schools/sms-settings/');
        setSettings(data);
        setSmsEnabled(data.sms_enabled);
        setAttendanceEnabled(data.sms_attendance_enabled);
        setFeeReminderEnabled(data.sms_fee_reminder_enabled);
        setSenderName(data.sms_sender_name || '');
        // apiKey stays blank — user must type a new key to update it
      } catch {
        toast.error('Failed to load SMS settings');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // ---------------------------------------------------------------------------
  // Refresh balance only (lightweight, no full reload)
  // ---------------------------------------------------------------------------
  const refreshBalance = useCallback(async () => {
    setBalanceRefreshing(true);
    try {
      const data: SmsSettings = await secureApiClient.get('/schools/sms-settings/');
      setSettings(data);
    } catch {
      toast.error('Failed to refresh balance');
    } finally {
      setBalanceRefreshing(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch logs
  // ---------------------------------------------------------------------------
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await secureApiClient.get('/notifications/sms-logs/');
      setLogs(res?.results ?? res ?? []);
    } catch {
      toast.error('Failed to load SMS history');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const handleToggleHistory = () => {
    setShowHistory(v => {
      if (!v && logs.length === 0) fetchLogs();
      return !v;
    });
  };

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------
  const handleSave = async () => {
    if (senderName.length > 11) {
      toast.error('Sender name must be 11 characters or fewer');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        sms_enabled: smsEnabled,
        sms_attendance_enabled: attendanceEnabled,
        sms_fee_reminder_enabled: feeReminderEnabled,
        sms_sender_name: senderName,
      };

      const res = await secureApiClient.patch('/schools/sms-settings/', payload);
      const updated: SmsSettings = res.data ?? res;
      setSettings(updated);
      setSmsEnabled(updated.sms_enabled);
      setAttendanceEnabled(updated.sms_attendance_enabled);
      setFeeReminderEnabled(updated.sms_fee_reminder_enabled);
      setSenderName(updated.sms_sender_name || '');
      toast.success('SMS settings saved');
    } catch {
      toast.error('Failed to save SMS settings');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const balance = settings?.sms_balance ?? 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4 sm:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
          <MessageSquare className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">SMS Notification Settings</h1>
          <p className="text-sm text-muted-foreground">
            Control how and when SMS alerts are sent to parents/guardians
          </p>
        </div>
      </div>

      {/* Credit balance banner */}
      {balance === 0 ? (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/30">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-700">No SMS credits remaining</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Your balance is <strong>0 units</strong>. SMS cannot be sent until you purchase more credits.
                  Toggles below are saved but no messages will be delivered.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={refreshBalance} disabled={balanceRefreshing} title="Refresh balance">
                  <RefreshCw className={`h-3.5 w-3.5 ${balanceRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                  onClick={() => navigate('/school/sms-purchase')}
                >
                  <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                  Buy Credits
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className={balance < 20 ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/20' : 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              {balance < 20 ? (
                <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">
                  SMS Credit Balance:{' '}
                  <span className={balance < 20 ? 'text-orange-600' : 'text-emerald-600'}>{balance} units</span>
                </p>
                <p className="text-xs text-muted-foreground">1 unit = 1 SMS sent to 1 recipient.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={refreshBalance} disabled={balanceRefreshing} title="Refresh balance">
                <RefreshCw className={`h-3.5 w-3.5 ${balanceRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/school/sms-purchase')}>
                Top Up
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Master switch */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Master Switch</CardTitle>
          <CardDescription>Disabling this stops ALL SMS from being sent, regardless of other settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-enabled" className="text-sm font-medium">Enable SMS Notifications</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {smsEnabled ? 'SMS is currently active' : 'SMS is disabled — no messages will be sent'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={smsEnabled ? 'default' : 'secondary'}>
                {smsEnabled ? 'ON' : 'OFF'}
              </Badge>
              <Switch
                id="sms-enabled"
                checked={smsEnabled}
                onCheckedChange={setSmsEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification types */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notification Types</CardTitle>
          <CardDescription>Choose which events trigger an SMS to parents/guardians.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Attendance */}
          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="attendance-sms" className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-500" />
                Attendance Alerts
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                Send a message when a student is marked present, absent, or late.
                Fires automatically when a teacher saves attendance.
              </p>
            </div>
            <Switch
              id="attendance-sms"
              checked={attendanceEnabled}
              onCheckedChange={setAttendanceEnabled}
              disabled={!smsEnabled}
            />
          </div>

          <Separator />

          {/* Fee reminders */}
          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="fee-sms" className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-orange-500" />
                Fee Reminders
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                Allow admins to send fee-reminder SMS to parents of students with unpaid bills.
              </p>
            </div>
            <Switch
              id="fee-sms"
              checked={feeReminderEnabled}
              onCheckedChange={setFeeReminderEnabled}
              disabled={!smsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sender & API key */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Arkesel Configuration</CardTitle>
          <CardDescription>
            SMS is sent via <a href="https://arkesel.com" target="_blank" rel="noopener noreferrer" className="underline">Arkesel</a>.
            This platform uses a shared Arkesel account — no API key setup is required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Platform key notice */}
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-3">
            <KeyRound className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <span className="font-semibold">Platform API key is active.</span> All schools on this platform share the same Arkesel account. SMS credits you purchase are deducted from your school's balance — you do not need to provide your own API key.
            </p>
          </div>

          {/* Sender name */}
          <div className="space-y-1.5">
            <Label htmlFor="sender-name">Sender Name / ID</Label>
            <Input
              id="sender-name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value.slice(0, 11))}
              placeholder="e.g. MySchool"
              maxLength={11}
            />
            <p className="text-xs text-muted-foreground">
              Shown on recipient's phone instead of a number. Max 11 alphanumeric characters.{' '}
              <span className={senderName.length > 10 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}>
                {senderName.length}/11
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-32">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SMS History                                                         */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader className="py-3 px-4">
          <button
            className="flex items-center justify-between w-full"
            onClick={handleToggleHistory}
          >
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">SMS Dispatch History</span>
              {logs.length > 0 && (
                <Badge variant="secondary" className="text-xs">{logs.length}</Badge>
              )}
            </div>
            {showHistory
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
            }
          </button>
        </CardHeader>

        {showHistory && (
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="flex justify-end">
              <Button size="sm" variant="ghost" onClick={fetchLogs} disabled={logsLoading}>
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${logsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {logsLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No SMS dispatches recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {logs.map(log => {
                  const statusConfig: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
                    success: { icon: <CheckCircle className="h-4 w-4 text-green-600" />, cls: 'border-green-200 bg-green-50 dark:bg-green-950/20', label: 'Success' },
                    partial: { icon: <AlertCircle className="h-4 w-4 text-yellow-600" />, cls: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20', label: 'Partial' },
                    failed:  { icon: <XCircle className="h-4 w-4 text-red-600" />, cls: 'border-red-200 bg-red-50 dark:bg-red-950/20', label: 'Failed' },
                    pending: { icon: <Clock className="h-4 w-4 text-blue-600" />, cls: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20', label: 'Pending' },
                  };
                  const cfg = statusConfig[log.status] ?? statusConfig.pending;
                  const isExpanded = expandedLog === log.id;
                  const typeLabel: Record<string, string> = {
                    fee_reminder: 'Fee Reminder',
                    attendance: 'Attendance Alert',
                    general: 'General',
                  };

                  return (
                    <div key={log.id} className={`rounded-lg border ${cfg.cls} overflow-hidden`}>
                      {/* Row header */}
                      <button
                        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:opacity-80"
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      >
                        {cfg.icon}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{typeLabel[log.sms_type] ?? log.sms_type}</span>
                            <Badge variant="outline" className="text-xs">{cfg.label}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                            <span>{new Date(log.created_at).toLocaleString()}</span>
                            {log.sent_by_name && <span>by {log.sent_by_name}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0 text-xs space-y-0.5">
                          <div className="text-green-700 font-medium">{log.sent_count} sent</div>
                          {log.failed_count > 0 && <div className="text-red-600">{log.failed_count} failed</div>}
                          {log.no_phone_count > 0 && <div className="text-muted-foreground">{log.no_phone_count} no phone</div>}
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="border-t px-3 pb-3 pt-2 space-y-3 bg-background/60">
                          {log.message_preview && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Message preview</p>
                              <p className="text-xs italic bg-muted rounded px-2 py-1.5">"{log.message_preview}"</p>
                            </div>
                          )}
                          {log.failure_reason && (
                            <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 rounded px-2 py-1.5 border border-red-200">
                              <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              {log.failure_reason}
                            </div>
                          )}
                          {/* Per-recipient list */}
                          {log.details && log.details.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1.5">Recipients ({log.details.length})</p>
                              <div className="max-h-48 overflow-y-auto space-y-1">
                                {log.details.map((d, i) => {
                                  const resultIcon: Record<string, string> = {
                                    sent: '✓',
                                    would_send: '◉',
                                    failed: '✗',
                                    no_phone: '—',
                                  };
                                  const resultCls: Record<string, string> = {
                                    sent: 'text-green-600',
                                    would_send: 'text-blue-600',
                                    failed: 'text-red-600',
                                    no_phone: 'text-muted-foreground',
                                  };
                                  return (
                                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b last:border-0 gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className={`font-bold shrink-0 ${resultCls[d.result] ?? ''}`}>{resultIcon[d.result] ?? '?'}</span>
                                        <span className="font-medium truncate">{d.student}</span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0 text-right">
                                        {d.total_balance != null && (
                                          <span className="text-muted-foreground">GH₵{Number(d.total_balance).toFixed(2)}</span>
                                        )}
                                        <span className={`${resultCls[d.result] ?? ''}`}>
                                          {d.guardian_phone ?? 'no phone'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default SmsSettings;
