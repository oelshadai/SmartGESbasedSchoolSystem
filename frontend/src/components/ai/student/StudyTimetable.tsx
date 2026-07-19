import { useState } from 'react';
import { Calendar, Sparkles, Printer, RefreshCw, Clock, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { secureApiClient } from '@/lib/secureApiClient';
import { useToast } from '@/components/ui/use-toast';

interface Session { subject: string; topic: string; duration_mins: number; tips: string; }
interface Day { day: string; date: string; sessions: Session[]; }
interface Timetable { days: Day[]; }

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: 'bg-blue-100 text-blue-700 border-blue-200',
  English: 'bg-purple-100 text-purple-700 border-purple-200',
  Science: 'bg-green-100 text-green-700 border-green-200',
  'Social Studies': 'bg-amber-100 text-amber-700 border-amber-200',
  ICT: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  French: 'bg-pink-100 text-pink-700 border-pink-200',
  RME: 'bg-orange-100 text-orange-700 border-orange-200',
};
const getColor = (subj: string) =>
  SUBJECT_COLORS[subj] ?? 'bg-slate-100 text-slate-700 border-slate-200';

const COMMON_SUBJECTS = ['Mathematics', 'English', 'Science', 'Social Studies', 'ICT', 'French', 'RME', 'Creative Arts'];

export default function StudyTimetable() {
  const [examDate, setExamDate] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [hoursPerDay, setHoursPerDay] = useState('2');
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [daysUntil, setDaysUntil] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const { toast } = useToast();

  const toggleSubject = (s: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(s) ? list.filter(x => x !== s) : [...list, s]);
  };

  const generate = async () => {
    if (!examDate || subjects.length === 0) {
      toast({ title: 'Missing info', description: 'Select exam date and at least one subject.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setTimetable(null);
    try {
      const res = await secureApiClient.post('/ai/student/study-timetable/', {
        exam_date: examDate,
        subjects,
        weak_subjects: weakSubjects,
        study_hours_per_day: parseFloat(hoursPerDay) || 2,
      }) as any;
      setTimetable(res.timetable);
      setDaysUntil(res.days_until_exam);
      setExpandedDay(0);
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to generate timetable', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-blue-500" />
        <h2 className="text-base font-bold text-foreground">Study Timetable Generator</h2>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-medium text-foreground/70 mb-1 block">Exam Date *</label>
            <Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]} className="h-9 text-sm" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-medium text-foreground/70 mb-1 block">Study Hours / Day</label>
            <Input type="number" value={hoursPerDay} onChange={e => setHoursPerDay(e.target.value)}
              min="0.5" max="8" step="0.5" className="h-9 text-sm" />
          </div>
        </div>

        {/* Subject picker */}
        <div>
          <label className="text-xs font-medium text-foreground/70 mb-2 block">Subjects to Study *</label>
          <div className="flex flex-wrap gap-2">
            {COMMON_SUBJECTS.map(s => (
              <button key={s} onClick={() => toggleSubject(s, subjects, setSubjects)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  subjects.includes(s) ? getColor(s) : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Weak subjects */}
        {subjects.length > 0 && (
          <div>
            <label className="text-xs font-medium text-foreground/70 mb-2 block">
              Weak Subjects <span className="text-muted-foreground">(will get more time)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {subjects.map(s => (
                <button key={s} onClick={() => toggleSubject(s, weakSubjects, setWeakSubjects)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    weakSubjects.includes(s) ? 'bg-red-100 text-red-700 border-red-200' : 'bg-muted text-muted-foreground border-border'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button className="w-full gap-2" onClick={generate} disabled={loading}>
          {loading
            ? <><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</>
            : <><Sparkles className="h-4 w-4" /> Generate Timetable</>
          }
        </Button>
      </div>

      {/* Timetable output */}
      {timetable && (
        <div className="space-y-3 print:space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Your Study Plan</p>
              {daysUntil !== null && (
                <p className="text-xs text-muted-foreground">{daysUntil} days until exams · {timetable.days.length} days planned</p>
              )}
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs print:hidden" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          </div>

          <div className="space-y-2">
            {timetable.days.map((day, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Day header */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedDay(expandedDay === i ? null : i)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{i + 1}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-foreground">{day.day}</p>
                      {day.date && <p className="text-xs text-muted-foreground">{new Date(day.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {day.sessions.slice(0, 3).map((s, j) => (
                        <span key={j} className={`text-[10px] px-2 py-0.5 rounded-full border ${getColor(s.subject)}`}>{s.subject.split(' ')[0]}</span>
                      ))}
                    </div>
                    {expandedDay === i ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Sessions */}
                {expandedDay === i && (
                  <div className="border-t border-border divide-y divide-border">
                    {day.sessions.map((session, j) => (
                      <div key={j} className="px-4 py-3 flex items-start gap-3">
                        <Badge variant="outline" className={`text-[10px] shrink-0 mt-0.5 ${getColor(session.subject)}`}>
                          {session.subject}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{session.topic}</p>
                          {session.tips && <p className="text-xs text-muted-foreground mt-0.5">{session.tips}</p>}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <Clock className="h-3 w-3" />
                          <span>{session.duration_mins}m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
