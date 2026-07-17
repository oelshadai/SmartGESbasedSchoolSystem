import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { secureApiClient } from '@/lib/secureApiClient';
import { toast } from 'sonner';
import {
  CalendarDays, Plus, Trash2, Loader2, AlertCircle,
  RefreshCw, Clock, BookOpen, ChevronDown, ChevronUp, X
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

interface ClassSubject {
  id: number;
  subject_name: string;
  teacher_name: string | null;
}

interface ClassOption {
  id: number;
  name: string;
}

const DAYS = [
  { value: 'MON', label: 'Monday' },
  { value: 'TUE', label: 'Tuesday' },
  { value: 'WED', label: 'Wednesday' },
  { value: 'THU', label: 'Thursday' },
  { value: 'FRI', label: 'Friday' },
];

const dayColors: Record<string, string> = {
  MON: 'bg-blue-100 text-blue-700',
  TUE: 'bg-purple-100 text-purple-700',
  WED: 'bg-emerald-100 text-emerald-700',
  THU: 'bg-orange-100 text-orange-700',
  FRI: 'bg-pink-100 text-pink-700',
};

// ── Component ─────────────────────────────────────────────────────────────────

const TimetableManagement = () => {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [timetable, setTimetable] = useState<DayGroup[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>('MON');
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState({
    day: 'MON',
    class_subject_id: '',
    start_time: '',
    end_time: '',
    room: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Load teacher's classes
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await secureApiClient.get('/timetable/teacher/');
      const list: ClassOption[] = Array.isArray(res) ? res : (res?.results ?? []);
      setClasses(list);
      if (list.length > 0) setSelectedClass(list[0].id);
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  // Load timetable + subjects for selected class
  const fetchTimetable = async (classId: number, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [ttRes, csRes] = await Promise.all([
        secureApiClient.get(`/timetable/teacher/?class_id=${classId}`),
        secureApiClient.get(`/schools/class-subjects/?class_instance=${classId}`),
      ]);
      setTimetable(ttRes?.timetable ?? []);
      const subjects = Array.isArray(csRes) ? csRes : (csRes?.results ?? []);
      setClassSubjects(subjects.map((cs: any) => ({
        id: cs.id,
        subject_name: cs.subject_name ?? cs.subject?.name ?? cs.subject,
        teacher_name: cs.teacher_name ?? cs.teacher?.get_full_name ?? null,
      })));
    } catch {
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchClasses(); }, []);
  useEffect(() => { if (selectedClass) fetchTimetable(selectedClass); }, [selectedClass]);

  const handleAddSlot = async () => {
    if (!form.class_subject_id || !form.start_time || !form.end_time) {
      toast.error('Subject, start time and end time are required');
      return;
    }
    setSaving(true);
    try {
      await secureApiClient.post('/timetable/teacher/', {
        class_id: selectedClass,
        class_subject_id: Number(form.class_subject_id),
        day: form.day,
        start_time: form.start_time,
        end_time: form.end_time,
        room: form.room,
        notes: form.notes,
      });
      toast.success('Lesson slot added');
      setShowForm(false);
      setForm({ day: 'MON', class_subject_id: '', start_time: '', end_time: '', room: '', notes: '' });
      fetchTimetable(selectedClass!, true);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to add slot');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slotId: number) => {
    setDeleting(slotId);
    try {
      await secureApiClient.delete(`/timetable/teacher/${slotId}/`);
      toast.success('Lesson slot removed');
      fetchTimetable(selectedClass!, true);
    } catch {
      toast.error('Failed to delete slot');
    } finally {
      setDeleting(null);
    }
  };

  if (loading && classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading timetable…</p>
      </div>
    );
  }

  const totalSlots = timetable.reduce((n, d) => n + d.slots.length, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Timetable</h1>
            <p className="text-xs text-muted-foreground">Manage lesson schedule</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => selectedClass && fetchTimetable(selectedClass, true)} disabled={refreshing} className="h-9 w-9">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Add Slot
          </Button>
        </div>
      </div>

      {/* Class selector */}
      {classes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedClass(c.id)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                selectedClass === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      {selectedClass && (
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Total lessons this week</p>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{totalSlots}</p>
          </div>
        </div>
      )}

      {/* Timetable days */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {timetable.map(dayGroup => {
            const isOpen = expandedDay === dayGroup.day;
            return (
              <div key={dayGroup.day} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-muted/30 transition-colors"
                  onClick={() => setExpandedDay(isOpen ? null : dayGroup.day)}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${dayColors[dayGroup.day] ?? 'bg-muted text-muted-foreground'}`}>
                    {dayGroup.day}
                  </div>
                  <span className="flex-1 text-sm font-semibold text-foreground text-left">{dayGroup.day_label}</span>
                  <Badge className="bg-muted text-muted-foreground border-0 text-[10px] shrink-0">
                    {dayGroup.slots.length} {dayGroup.slots.length === 1 ? 'lesson' : 'lessons'}
                  </Badge>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>

                {isOpen && (
                  <div className="border-t border-border">
                    {dayGroup.slots.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No lessons — tap "Add Slot" to add one</p>
                    ) : (
                      dayGroup.slots.map((slot, i) => (
                        <div key={slot.id} className={`flex items-center gap-3 px-4 py-3 ${i < dayGroup.slots.length - 1 ? 'border-b border-border' : ''}`}>
                          <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground w-20 shrink-0">
                            <Clock className="h-3 w-3" />
                            {slot.start_time}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{slot.subject}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {slot.teacher ?? 'No teacher'}{slot.room ? ` · ${slot.room}` : ''}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0 mr-2">{slot.end_time}</span>
                          <button
                            onClick={() => handleDelete(slot.id)}
                            disabled={deleting === slot.id}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                          >
                            {deleting === slot.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add slot bottom sheet */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-background w-full max-w-lg rounded-t-3xl p-6 space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-muted rounded-full mx-auto" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Add Lesson Slot</h3>
              <button onClick={() => setShowForm(false)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Day */}
              <div>
                <Label className="text-xs text-muted-foreground">Day</Label>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {DAYS.map(d => (
                    <button
                      key={d.value}
                      onClick={() => setForm(f => ({ ...f, day: d.value }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        form.day === d.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {d.label.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <select
                  className="w-full mt-1 bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                  value={form.class_subject_id}
                  onChange={e => setForm(f => ({ ...f, class_subject_id: e.target.value }))}
                >
                  <option value="">Select subject…</option>
                  {classSubjects.map(cs => (
                    <option key={cs.id} value={cs.id}>{cs.subject_name}</option>
                  ))}
                </select>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Start Time</Label>
                  <Input type="time" className="mt-1" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">End Time</Label>
                  <Input type="time" className="mt-1" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
                </div>
              </div>

              {/* Room */}
              <div>
                <Label className="text-xs text-muted-foreground">Room (optional)</Label>
                <Input className="mt-1" placeholder="e.g. Room 101, Lab 2" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} />
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
                <Input className="mt-1" placeholder="Any extra info…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="flex-1 gap-2" onClick={handleAddSlot} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {saving ? 'Saving…' : 'Add Slot'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableManagement;
