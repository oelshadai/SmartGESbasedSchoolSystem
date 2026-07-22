import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { secureApiClient } from '@/lib/secureApiClient';
import { toast } from 'sonner';
import {
  CalendarDays,
  BookOpen,
  Clock,
  Link2,
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
  Trash2,
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

interface ClassOption {
  id: number;
  name: string;
}

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

const TeacherLessons = () => {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [timetable, setTimetable] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [expandedDay, setExpandedDay] = useState<string | null>('MON');
  const [activeMeetingSlot, setActiveMeetingSlot] = useState<Slot | null>(null);


  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await secureApiClient.get('/timetable/teacher/');
      const list: ClassOption[] = Array.isArray(res) ? res : res?.results ?? [];
      setClasses(list);
      if (list.length > 0) setSelectedClass((prev) => prev ?? list[0].id);
    } catch {
      toast.error('Unable to load your classes.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async (classId: number, silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const res = await secureApiClient.get(`/timetable/teacher/?class_id=${classId}`);
      setTimetable(res?.timetable ?? []);
      setNoteDrafts(
        (res?.timetable ?? []).reduce((acc: Record<number, string>, day: DayGroup) => {
          day.slots.forEach((slot) => {
            acc[slot.id] = slot.notes || '';
          });
          return acc;
        }, {})
      );
    } catch {
      toast.error('Unable to load timetable for this class.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) fetchTimetable(selectedClass);
  }, [selectedClass]);

  const selectedClassName = useMemo(() => {
    return classes.find((cls) => cls.id === selectedClass)?.name || '';
  }, [classes, selectedClass]);

  const meetingUrl = activeMeetingSlot
    ? `https://meet.jit.si/${buildMeetingRoom(selectedClassName, activeMeetingSlot)}#config.defaultLanguage="en"&config.lang="en"`
    : null;

  const handleSaveNotes = async (slotId: number) => {
    const notes = noteDrafts[slotId] ?? '';
    setRefreshing(true);
    try {
      await secureApiClient.put(`/timetable/teacher/${slotId}/`, { notes });
      toast.success('Lesson notes updated');
      if (selectedClass) fetchTimetable(selectedClass, true);
    } catch {
      toast.error('Failed to save lesson notes');
    } finally {
      setRefreshing(false);
    }
  };

  const handleJoinVideo = (slot: Slot) => {
    setActiveMeetingSlot(slot);
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
      toast.error('Could not copy the meeting link');
    }
  };

  const handleCopyLink = async (slot: Slot) => {
    const room = buildMeetingRoom(selectedClassName, slot);
    const url = `https://meet.jit.si/${room}#config.defaultLanguage="en"&config.lang="en"`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Lesson link copied');
    } catch {
      toast.error('Could not copy the meeting link');
    }
  };

  const totalLessons = timetable.reduce((total, day) => total + day.slots.length, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24 space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Teacher Lessons</h1>
            <p className="text-xs text-muted-foreground">Review your lesson notes and start video sessions.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="icon" onClick={() => selectedClass && fetchTimetable(selectedClass, true)} disabled={refreshing}>
            <Loader2 className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={() => setExpandedDay(null)}>
            <BookOpen className="h-4 w-4" /> Reset view
          </Button>
        </div>
      </div>

      {classes.length > 1 && (
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
          {classes.map((cls) => (
            <button
              key={cls.id}
              type="button"
              onClick={() => setSelectedClass(cls.id)}
              className={`shrink-0 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                selectedClass === cls.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-slate-800'
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Selected class</p>
          <p className="text-base font-semibold text-foreground">{selectedClassName || 'No class selected'}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-2xl bg-muted p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Lessons this week</p>
            <p className="text-2xl font-bold text-foreground">{totalLessons}</p>
          </div>
          <div className="rounded-2xl bg-muted p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Teacher notes</p>
            <p className="text-2xl font-bold text-foreground">{Object.values(noteDrafts).filter(Boolean).length}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Live lesson room</p>
            <p className="text-sm text-muted-foreground">Start a shared Jitsi session inside the app so students and colleagues join the same room.</p>
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
        {activeMeetingSlot ? (
          <div className="mt-4 rounded-3xl overflow-hidden border border-border bg-black">
            <iframe
              title="Live Lesson Meeting"
              src={meetingUrl || ''}
              className="h-[540px] w-full"
              allow="camera; microphone; fullscreen; display-capture"
            />
          </div>
        ) : (
          <div className="mt-4 rounded-3xl border border-dashed border-border bg-slate-950/70 p-6 text-center text-sm text-muted-foreground">
            Select a lesson below to embed the live video meeting inside the app.
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading lessons…</p>
        </div>
      ) : totalLessons === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-8 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm font-semibold text-foreground">No lessons available</p>
          <p className="mt-2 text-xs text-muted-foreground">Add or manage timetable slots from the timetable page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {timetable.map((dayGroup) => {
            const isOpen = expandedDay === dayGroup.day;
            return (
              <div key={dayGroup.day} className="rounded-3xl border border-border overflow-hidden bg-card">
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-800/50"
                  onClick={() => setExpandedDay(isOpen ? null : dayGroup.day)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {dayGroup.day}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{dayGroup.day_label}</p>
                      <p className="text-xs text-muted-foreground">{dayGroup.slots.length} lessons</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-muted text-muted-foreground">{dayGroup.slots.length}</Badge>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="divide-y divide-border">
                    {dayGroup.slots.map((slot, index) => (
                      <div key={slot.id} className={`px-4 py-4 ${index < dayGroup.slots.length - 1 ? 'border-t border-border' : ''}`}>
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="rounded-full bg-slate-800/70 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                                {slot.start_time} — {slot.end_time}
                              </span>
                              <Badge className="bg-primary/10 text-primary border-primary/20">{slot.room || 'No room'}</Badge>
                            </div>
                            <div className="mt-3 flex flex-col gap-2">
                              <p className="text-base font-semibold text-foreground">{slot.subject}</p>
                              <p className="text-sm text-muted-foreground">{slot.teacher ?? 'Teacher not assigned'}</p>
                              {slot.notes ? (
                                <p className="rounded-2xl bg-slate-900/80 p-3 text-sm text-slate-200">{slot.notes}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground">No notes yet.</p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 shrink-0 text-right">
                            <Button variant="secondary" size="sm" className="gap-2" onClick={() => handleJoinVideo(slot)}>
                              <Link2 className="h-4 w-4" /> Start Video
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleCopyLink(slot)}>
                              <Link2 className="h-4 w-4" /> Copy Link
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                          <div>
                            <Label className="text-xs text-muted-foreground">Lesson notes</Label>
                            <Textarea
                              value={noteDrafts[slot.id] ?? ''}
                              onChange={(event) => setNoteDrafts((prev) => ({ ...prev, [slot.id]: event.target.value }))}
                              placeholder="Write notes for this lesson"
                              maxLength={255}
                              className="mt-1 min-h-[3rem] bg-slate-900/80"
                            />
                          </div>
                          <div className="flex flex-col gap-2 justify-end">
                            <Button
                              size="sm"
                              className="gap-2"
                              onClick={() => handleSaveNotes(slot.id)}
                              disabled={refreshing}
                            >
                              <Save className="h-4 w-4" /> Save notes
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-2"
                              onClick={() => setNoteDrafts((prev) => ({ ...prev, [slot.id]: slot.notes || '' }))}
                            >
                              <Trash2 className="h-4 w-4" /> Reset
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherLessons;
