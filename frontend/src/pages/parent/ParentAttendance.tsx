import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { secureApiClient } from '@/lib/secureApiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarDays, Check, X, Clock, Loader2, RefreshCw, GraduationCap,
} from 'lucide-react';

interface ChildInfo { student_id: string; name: string; relationship: string; }

interface AttendanceRecord {
  id: number; date: string; status: 'present' | 'absent' | 'late';
  reason: string; marked_by: string;
}
interface AttendanceSummary { present: number; absent: number; late: number; total: number; rate: number; }

const statusCfg = {
  present: { label: 'Present', icon: <Check className="h-3.5 w-3.5" />, cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  absent:  { label: 'Absent',  icon: <X className="h-3.5 w-3.5" />,     cls: 'bg-red-100 text-red-700',         dot: 'bg-red-500'     },
  late:    { label: 'Late',    icon: <Clock className="h-3.5 w-3.5" />,  cls: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500'   },
} as const;

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const ParentAttendance = () => {
  const user = useAuthStore((s) => s.user);
  const children: ChildInfo[] = (user as any)?.children || [];

  const [selectedId, setSelectedId] = useState<string>(children[0]?.student_id ?? '');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (id: string) => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const res = await secureApiClient.get<any>(
        `/students/my-attendance/?student_id=${id}`
      );
      setRecords(res.records || []);
      setSummary(res.summary || null);
    } catch {
      setError('Failed to load attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(selectedId); }, [selectedId]);

  const selected = children.find(c => c.student_id === selectedId);

  return (
    <div className="space-y-6 p-4 sm:p-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-muted-foreground text-sm mt-1">View your child's attendance records</p>
      </div>

      {/* Child selector */}
      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {children.map(c => (
            <Button
              key={c.student_id}
              size="sm"
              variant={selectedId === c.student_id ? 'default' : 'outline'}
              onClick={() => setSelectedId(c.student_id)}
            >
              <GraduationCap className="h-3.5 w-3.5 mr-1" /> {c.name}
            </Button>
          ))}
        </div>
      )}

      {children.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">
          No children linked to your account.
        </CardContent></Card>
      ) : loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : error ? (
        <Card><CardContent className="py-10 text-center space-y-3">
          <p className="text-red-500 text-sm">{error}</p>
          <Button size="sm" variant="outline" onClick={() => fetchData(selectedId)}>
            <RefreshCw className="h-4 w-4 mr-1" /> Retry
          </Button>
        </CardContent></Card>
      ) : (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Attendance Rate', value: `${summary.rate}%`, cls: 'text-emerald-600' },
                { label: 'Present', value: summary.present, cls: 'text-emerald-600' },
                { label: 'Absent', value: summary.absent, cls: 'text-red-500' },
                { label: 'Late', value: summary.late, cls: 'text-amber-500' },
              ].map(s => (
                <Card key={s.label}>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Records */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {selected?.name} — Last 90 Days
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={() => fetchData(selectedId)} disabled={loading}>
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No attendance records found.</p>
              ) : (
                <div className="space-y-2">
                  {records.map(r => {
                    const cfg = statusCfg[r.status] ?? statusCfg.absent;
                    return (
                      <div key={r.id} className="flex items-center justify-between rounded-lg border px-4 py-2.5 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{fmt(r.date)}</p>
                            {r.reason && <p className="text-xs text-muted-foreground truncate">{r.reason}</p>}
                          </div>
                        </div>
                        <Badge className={`text-xs flex items-center gap-1 shrink-0 ${cfg.cls}`}>
                          {cfg.icon} {cfg.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ParentAttendance;
