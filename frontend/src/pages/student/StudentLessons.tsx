import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { secureApiClient } from '@/lib/secureApiClient';
import { toast } from 'sonner';
import {
  BookOpen,
  Clock,
  GraduationCap,
  Loader2,
  Link2,
  RefreshCw,
  CalendarDays,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

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

const TODAY_DAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];

const sanitizeRoomName = (value: string) =>
  value
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9\-_]/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();

const buildMeetingRoom = (className: string, slot: Slot) => {
  return sanitizeRoomName(
    `SmartSchool-${className}-${slot.subject}-${slot.day}-${slot.start_time}`
  );
};

const StudentLessons = () => {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'timetable' | 'subjects' | 'join'>('timetable');
  const [expandedDay, setExpandedDay] = useState<string | null>(TODAY_DAY);
  const [activeMeetingSlot, setActiveMeetingSlot] = useState<Slot | null>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await secureApiClient.get('/timetable/student/');
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load lessons');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const className = data?.class?.name || 'class';
  const lessonSlots = data?.timetable?.flatMap((day) => day.slots) ?? [];

  const upcomingSession = useMemo(() => {
    const now = new Date();
    const currentDay = ['SUN','MON','TUE','WED','THU','FRI','SAT'][now.getDay()];
    const filtered = lessonSlots.filter((slot) => slot.day === currentDay);
    if (!filtered.length) return null;
    return filtered.reduce((closest, slot) => {
      if (!closest) return slot;
      return slot.start_time < closest.start_time ? slot : closest;
    }, null as Slot | null);
  }, [lessonSlots]);

  const meetingUrl = activeMeetingSlot ? `https://meet.jit.si/${buildMeetingRoom(className, activeMeetingSlot)}` : null;

  const handleJoinVideo = (slot: Slot) => {
    setActiveMeetingSlot(slot);
    setTab('join');
  };

  const handleOpenExternalMeeting = () => {
    if (!activeMeetingSlot) return;
    window.open(meetingUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMeetingLink = async () => {
    if (!activeMeetingSlot) return;
    try {
      await navigator.clipboard.writeText(meetingUrl || '');
      toast.success('Meeting link copied');
    } catch {
      toast.error('Unable to copy link');
    }
  };

  const handleCopyLink = async (slot: Slot) => {
    const room = buildMeetingRoom(className, slot);
    const url = `https://meet.jit.si/${room}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Meeting link copied');
    } catch {
      toast.error('Unable to copy link');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading lessons…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <BookOpen className="h-12 w-12 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => fetchData()}>Try again</Button>
      </div>
    );
  }

  const totalSlots = data?.timetable?.reduce((count, day) => count + day.slots.length, 0) ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24 space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Student Lessons</h1>
            <p className="text-xs text-muted-foreground">Join live lessons and review class notes.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={() => {
            if (upcomingSession) setActiveMeetingSlot(upcomingSession);
            setTab('join');
          }}>
            <Link2 className="h-4 w-4" /> Join Live
          </Button>
        </div>
      </div>

      {data?.class && (
        <div className="bg-card border border-border rounded-2xl p-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Class</p>
            <p className="text-base font-semibold text-foreground">{data.class.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Teacher</p>
            <p className="text-base font-semibold text-foreground">{data.class.class_teacher || 'Not assigned'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Lessons this week</p>
            <p className="text-base font-semibold text-foreground">{totalSlots}</p>
          </div>
        </div>
      )}

      <div className="flex rounded-2xl bg-muted p-1 text-sm">
        {(['timetable', 'subjects', 'join'] as const).map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`flex-1 rounded-2xl px-4 py-3 transition ${
              tab === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {value === 'timetable' ? 'Timetable' : value === 'subjects' ? 'Subjects' : 'Join Lesson'}
          </button>
        ))}
      </div>

      {tab === 'join' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Live lesson session</p>
                <p className="text-sm text-muted-foreground">
                  Select a lesson and join the live Jitsi room right inside the app.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="gap-2" disabled={!activeMeetingSlot} onClick={handleOpenExternalMeeting}>
                  <Link2 className="h-4 w-4" /> Open in new tab
                </Button>
                <Button size="sm" variant="outline" className="gap-2" disabled={!activeMeetingSlot} onClick={handleCopyMeetingLink}>
                  <Link2 className="h-4 w-4" /> Copy room link
                </Button>
              </div>
            </div>
          </div>

          {activeMeetingSlot ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-border bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{activeMeetingSlot.subject} — {activeMeetingSlot.day} {activeMeetingSlot.start_time}</p>
                    <p className="text-xs text-muted-foreground">Room: {buildMeetingRoom(className, activeMeetingSlot)}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="gap-2" onClick={() => setActiveMeetingSlot(null)}>
                    Leave in-app meeting
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-border bg-black">
                <iframe
                  title="Live Lesson Meeting"
                  src={meetingUrl || ''}
                  className="h-[560px] w-full"
                  allow="camera; microphone; fullscreen; display-capture"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Select a lesson from the timetable to start a shared live lesson room.
            </div>
          )}
        </div>
      )}

      {tab === 'timetable' && (
        <div className="space-y-3">
          {totalSlots === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">No lessons found</p>
              <p className="text-xs text-muted-foreground">Your teacher may add timetable slots soon.</p>
            </div>
          ) : (
            data?.timetable?.map((dayGroup) => {
              const isToday = dayGroup.day === TODAY_DAY;
              const isOpen = expandedDay === dayGroup.day;
              return (
                <div key={dayGroup.day} className={`rounded-3xl border overflow-hidden ${isToday ? 'border-primary/40' : 'border-border'} bg-card`}>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-slate-800/50"
                    onClick={() => setExpandedDay(isOpen ? null : dayGroup.day)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-2xl flex items-center justify-center text-sm font-semibold ${isToday ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {dayGroup.day}
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>{dayGroup.day_label}</p>
                        {isToday && <p className="text-[10px] text-primary">Today</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-muted text-muted-foreground">{dayGroup.slots.length}</Badge>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="divide-y divide-border">
                      {dayGroup.slots.map((slot, idx) => (
                        <div key={slot.id} className={`px-4 py-4 ${idx < dayGroup.slots.length - 1 ? 'border-t border-border' : ''}`}>
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className="rounded-full bg-slate-800/70 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                                  {slot.start_time} — {slot.end_time}
                                </span>
                                <Badge className="bg-primary/10 text-primary border-primary/20">{slot.room || 'No room'}</Badge>
                              </div>
                              <div className="mt-3">
                                <p className="text-base font-semibold text-foreground">{slot.subject}</p>
                                <p className="text-sm text-muted-foreground">{slot.teacher ?? 'Teacher not assigned'}</p>
                                {slot.notes && <p className="mt-2 rounded-2xl bg-slate-900/80 p-3 text-sm text-slate-200">{slot.notes}</p>}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0 text-right">
                              <Button size="sm" variant="secondary" className="gap-2" onClick={() => handleJoinVideo(slot)}>
                                <Link2 className="h-4 w-4" /> Join lesson
                              </Button>
                              <Button size="sm" variant="outline" className="gap-2" onClick={() => handleCopyLink(slot)}>
                                <Link2 className="h-4 w-4" /> Copy link
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'subjects' && (
        <div className="rounded-3xl border border-border bg-card p-4">
          {data?.subjects.length ? (
            <div className="space-y-3">
              {data.subjects.map((subject) => (
                <div key={subject.id} className="flex items-center gap-3 rounded-2xl border border-border bg-slate-950/60 px-4 py-3">
                  <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{subject.subject}</p>
                    <p className="text-xs text-muted-foreground">{subject.teacher ?? 'Teacher not assigned'}</p>
                  </div>
                  <Badge className="bg-muted text-muted-foreground">{subject.code}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No subjects available yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentLessons;
