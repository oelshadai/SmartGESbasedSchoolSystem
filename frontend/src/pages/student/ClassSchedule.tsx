import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { secureApiClient } from '@/lib/secureApiClient';
import {
  BookOpen, User, RefreshCw, Loader2, AlertCircle,
  GraduationCap, Clock, CalendarDays, ChevronDown, ChevronUp
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Slot {
  id: number;
  day: string;
  day_label: string;
  start_time: string;
  end_time: string;
  subject: string;
  teacher: string | null;
  room: string;
  notes: string;
}

interface DayGroup {
  day: string;
  day_label: string;
  slots: Slot[];
}

interface Subject {
  id: number;
  subject: string;
  code: string;
  teacher: string | null;
}

interface ClassInfo {
  name: string;
  level: string;
  class_teacher: string | null;
}

interface ScheduleData {
  class: ClassInfo | null;
  timetable: DayGroup[];
  subjects: Subject[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TODAY_DAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];

const dayColors: Record<string, string> = {
  MON: 'bg-blue-100 text-blue-700',
  TUE: 'bg-purple-100 text-purple-700',
  WED: 'bg-emerald-100 text-emerald-700',
  THU: 'bg-orange-100 text-orange-700',
  FRI: 'bg-pink-100 text-pink-700',
};

// ── Component ─────────────────────────────────────────────────────────────────

const ClassSchedule = () => {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'timetable' | 'subjects'>('timetable');
  const [expandedDay, setExpandedDay] = useState<string | null>(TODAY_DAY);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await secureApiClient.get('/timetable/student/');
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading schedule…</p>
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

  const cls = data?.class ?? null;
  const timetable = data?.timetable ?? [];
  const subjects = data?.subjects ?? [];
  const totalSlots = timetable.reduce((n, d) => n + d.slots.length, 0);
  const todayGroup = timetable.find(d => d.day === TODAY_DAY);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Class Schedule</h1>
            <p className="text-xs text-foreground">{cls?.name ?? 'No class assigned'}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => fetchData(true)} disabled={refreshing} className="h-9 w-9">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Class info card */}
      {cls && (
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{cls.level}</p>
            <p className="text-xs text-muted-foreground truncate">
              Class Teacher: {cls.class_teacher ?? 'Not assigned'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-primary">{totalSlots}</p>
            <p className="text-[10px] text-muted-foreground">lessons/week</p>
          </div>
        </div>
      )}

      {/* Today's lessons highlight */}
      {todayGroup && todayGroup.slots.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">Today — {todayGroup.day_label}</p>
          <div className="space-y-2">
            {todayGroup.slots.map(slot => (
              <div key={slot.id} className="flex items-center gap-3 bg-background rounded-xl px-3 py-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{slot.subject}</p>
                  <p className="text-xs text-foreground">{slot.teacher ?? 'No teacher'}{slot.room ? ` · ${slot.room}` : ''}</p>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">{slot.start_time}–{slot.end_time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex bg-muted rounded-xl p-1 gap-1">
        {(['timetable', 'subjects'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            {t === 'timetable' ? 'Weekly Timetable' : `Subjects (${subjects.length})`}
          </button>
        ))}
      </div>

      {/* ── Timetable tab ── */}
      {tab === 'timetable' && (
        <>
          {totalSlots === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CalendarDays className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No timetable yet</p>
              <p className="text-xs text-muted-foreground text-center">
                Your class teacher hasn't added any lesson slots yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {timetable.map(dayGroup => {
                const isToday = dayGroup.day === TODAY_DAY;
                const isOpen = expandedDay === dayGroup.day;
                return (
                  <div key={dayGroup.day} className={`bg-card border rounded-2xl overflow-hidden ${isToday ? 'border-primary/40' : 'border-border'}`}>
                    {/* Day header */}
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-muted/30 transition-colors"
                      onClick={() => setExpandedDay(isOpen ? null : dayGroup.day)}
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${dayColors[dayGroup.day] ?? 'bg-muted text-muted-foreground'}`}>
                        {dayGroup.day}
                      </div>
                      <span className={`flex-1 text-sm font-semibold text-left ${isToday ? 'text-primary' : 'text-foreground'}`}>
                        {dayGroup.day_label} {isToday && <span className="text-[10px] font-normal ml-1 text-primary">(Today)</span>}
                      </span>
                      <Badge className="bg-muted text-muted-foreground border-0 text-[10px] shrink-0">
                        {dayGroup.slots.length} {dayGroup.slots.length === 1 ? 'lesson' : 'lessons'}
                      </Badge>
                      {isOpen
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </button>

                    {/* Slots */}
                    {isOpen && dayGroup.slots.length > 0 && (
                      <div className="border-t border-border">
                        {dayGroup.slots.map((slot, i) => (
                          <div
                            key={slot.id}
                            className={`flex items-center gap-3 px-4 py-3 ${i < dayGroup.slots.length - 1 ? 'border-b border-border' : ''}`}
                          >
                            <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground w-20 shrink-0">
                              <Clock className="h-3 w-3" />
                              <span>{slot.start_time}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{slot.subject}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {slot.teacher ?? 'No teacher assigned'}
                                {slot.room ? ` · ${slot.room}` : ''}
                              </p>
                              {slot.notes && <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">{slot.notes}</p>}
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground shrink-0">{slot.end_time}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {isOpen && dayGroup.slots.length === 0 && (
                      <div className="border-t border-border px-4 py-3">
                        <p className="text-xs text-muted-foreground text-center">No lessons scheduled</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Subjects tab ── */}
      {tab === 'subjects' && (
        <>
          {subjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <BookOpen className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No subjects assigned yet</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {subjects.map((s, i) => (
                <div key={s.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < subjects.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{s.subject}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <User className="h-3 w-3 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground truncate">{s.teacher ?? 'No teacher assigned'}</p>
                    </div>
                  </div>
                  <Badge className="bg-muted text-muted-foreground border-0 text-[10px] shrink-0">{s.code}</Badge>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClassSchedule;
