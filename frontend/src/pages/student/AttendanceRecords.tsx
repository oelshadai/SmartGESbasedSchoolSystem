import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { secureApiClient } from '@/lib/secureApiClient';
import { toast } from 'sonner';
import {
  CalendarDays, Check, X, Clock, TrendingUp,
  Loader2, AlertCircle, RefreshCw, MessageSquare,
  ChevronDown, ChevronUp, Send
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface AttendanceRecord {
  id: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  reason: string;
  marked_by: string;
}

interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  total: number;
  rate: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const statusCfg = {
  present: { label: 'Present', icon: <Check className="h-3.5 w-3.5" />, cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', cardCls: 'border-emerald-500/20 bg-emerald-500/5', barCls: 'from-emerald-500 to-teal-400', glowCls: 'bg-emerald-500/10' },
  absent:  { label: 'Absent',  icon: <X className="h-3.5 w-3.5" />,     cls: 'bg-red-100 text-red-700',     dot: 'bg-red-500',     cardCls: 'border-red-500/20 bg-red-500/5',     barCls: 'from-red-500 to-rose-400',     glowCls: 'bg-red-500/10'     },
  late:    { label: 'Late',    icon: <Clock className="h-3.5 w-3.5" />,  cls: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', cardCls: 'border-amber-500/20 bg-amber-500/5', barCls: 'from-amber-500 to-yellow-400', glowCls: 'bg-amber-500/10' },
} as const;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

const isThisWeek = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return d >= weekAgo;
};

// ── Component ────────────────────────────────────────────────────────────────

const AttendanceRecords = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reason modal state
  const [reasonRecord, setReasonRecord] = useState<AttendanceRecord | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [sending, setSending] = useState(false);

  // Expanded record
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await secureApiClient.get('/students/my-attendance/');
      setRecords(Array.isArray(res?.records) ? res.records : []);
      setSummary(res?.summary ?? null);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSendReason = async () => {
    if (!reasonRecord || !reasonText.trim()) return;
    setSending(true);
    try {
      await secureApiClient.post('/students/my-attendance/send-reason/', {
        date: reasonRecord.date,
        reason: reasonText.trim(),
      });
      toast.success('Reason sent to your class teacher');
      setReasonRecord(null);
      setReasonText('');
      fetchData(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to send reason');
    } finally {
      setSending(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading attendance…</p>
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

  const safe = summary ?? { present: 0, absent: 0, late: 0, total: 0, rate: 0 };
  const rateColor = safe.rate >= 80 ? 'bg-emerald-500' : safe.rate >= 60 ? 'bg-yellow-400' : 'bg-red-400';
  const rateText  = safe.rate >= 80 ? 'text-emerald-600' : safe.rate >= 60 ? 'text-yellow-600' : 'text-red-500';

  const thisWeek = records.filter(r => isThisWeek(r.date));
  const absences = records.filter(r => r.status === 'absent' || r.status === 'late');

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">My Attendance</h1>
            <p className="text-xs text-muted-foreground">Last 90 days</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => fetchData(true)} disabled={refreshing} className="h-9 w-9">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Attendance rate card */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Attendance Rate</span>
          </div>
          <span className={`text-2xl font-bold ${rateText}`}>{safe.rate.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${rateColor}`} style={{ width: `${safe.rate}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">{safe.present} present out of {safe.total} school days</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        {(['present', 'absent', 'late'] as const).map(s => {
          const cfg = statusCfg[s];
          const count = safe[s];
          return (
            <div key={s} className={`relative group rounded-2xl border ${cfg.cardCls} p-4 shadow-lg hover:scale-[1.02] transition-all duration-200 overflow-hidden text-center space-y-1`}>
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${cfg.barCls} opacity-60 group-hover:opacity-100 transition-opacity`} />
              <div className={`absolute -top-4 -right-4 w-14 h-14 ${cfg.glowCls} rounded-full blur-xl opacity-60`} />
              <div className="relative">
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center mx-auto ${cfg.cls}`}>
                  {cfg.icon}
                </div>
                <p className="text-xl font-bold text-foreground">{count}</p>
                <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* This week */}
      {thisWeek.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">This Week</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {thisWeek.map((r, i) => {
              const cfg = statusCfg[r.status] ?? statusCfg.absent;
              return (
                <div key={r.id} className={`flex items-center gap-3 px-4 py-3 ${i < thisWeek.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />
                  <span className="text-sm text-foreground flex-1">{formatDate(r.date)}</span>
                  <Badge className={`text-[10px] border-0 ${cfg.cls}`}>{cfg.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Absences — with send reason */}
      {absences.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Absences & Late ({absences.length})
          </p>
          <div className="space-y-2">
            {absences.map(r => {
              const cfg = statusCfg[r.status] ?? statusCfg.absent;
              const isOpen = expanded === r.id;
              return (
                <div key={r.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer active:bg-muted/30 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                  >
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.cls}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{formatDate(r.date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.reason ? `Reason sent ✓` : 'No reason sent yet'}
                      </p>
                    </div>
                    <Badge className={`text-[10px] border-0 shrink-0 ${cfg.cls}`}>{cfg.label}</Badge>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </div>

                  {isOpen && (
                    <div className="border-t border-border bg-muted/30 p-4 space-y-3">
                      {r.reason && (
                        <div className="bg-card rounded-xl p-3">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Your reason</p>
                          <p className="text-sm text-foreground">{r.reason}</p>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant={r.reason ? 'outline' : 'default'}
                        className="w-full gap-2"
                        onClick={() => { setReasonRecord(r); setReasonText(r.reason || ''); }}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {r.reason ? 'Update reason' : 'Send reason to teacher'}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full history */}
      {records.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full History</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {records.slice(0, 30).map((r, i) => {
              const cfg = statusCfg[r.status] ?? statusCfg.absent;
              return (
                <div key={r.id} className={`flex items-center gap-3 px-4 py-3 ${i < Math.min(records.length, 30) - 1 ? 'border-b border-border' : ''}`}>
                  <div className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />
                  <span className="text-sm text-foreground flex-1">{formatDate(r.date)}</span>
                  <span className="text-xs text-muted-foreground mr-2">{r.marked_by}</span>
                  <Badge className={`text-[10px] border-0 ${cfg.cls}`}>{cfg.label}</Badge>
                </div>
              );
            })}
            {records.length > 30 && (
              <div className="px-4 py-3 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">Showing 30 of {records.length} records</p>
              </div>
            )}
          </div>
        </div>
      )}

      {records.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <CalendarDays className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No attendance records yet</p>
          <p className="text-xs text-muted-foreground text-center">Your attendance will appear here once your class teacher starts marking</p>
        </div>
      )}

      {/* Reason modal — bottom sheet style */}
      {reasonRecord && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setReasonRecord(null)}>
          <div
            className="bg-background w-full max-w-lg rounded-t-3xl p-6 space-y-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-muted rounded-full mx-auto" />
            <div>
              <h3 className="text-base font-bold text-foreground">Send Reason to Teacher</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {reasonRecord.status === 'absent' ? 'Absent' : 'Late'} on {formatDate(reasonRecord.date)}
              </p>
            </div>
            <textarea
              className="w-full bg-muted rounded-xl p-3 text-sm text-foreground resize-none outline-none focus:ring-2 focus:ring-primary"
              rows={4}
              placeholder="Explain why you were absent or late…"
              value={reasonText}
              onChange={e => setReasonText(e.target.value)}
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground text-right">{reasonText.length}/500</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setReasonRecord(null)}>Cancel</Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleSendReason}
                disabled={sending || !reasonText.trim()}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceRecords;
