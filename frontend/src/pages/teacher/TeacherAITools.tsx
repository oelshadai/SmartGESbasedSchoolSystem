import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { secureApiClient } from '@/lib/secureApiClient';
import { toast } from 'sonner';
import {
  Sparkles,
  Loader2,
  BookOpen,
  Target,
  ClipboardList,
  CheckSquare,
  Home,
  Wrench,
  Copy,
  RefreshCw,
} from 'lucide-react';

interface LessonPlan {
  objectives: string[];
  introduction: string;
  main_activities: string[];
  assessment: string;
  homework: string;
  resources_needed: string[];
}

const DURATION_OPTIONS = [30, 40, 45, 60, 80, 90];

const TeacherAITools = () => {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [duration, setDuration] = useState(40);
  const [extraNotes, setExtraNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<LessonPlan | null>(null);

  const handleGenerate = async () => {
    if (!subject.trim() || !topic.trim() || !classLevel.trim()) {
      toast.error('Subject, topic, and class level are required');
      return;
    }
    setLoading(true);
    setPlan(null);
    try {
      const res = await secureApiClient.post('/ai/lesson-plan/', {
        subject: subject.trim(),
        topic: topic.trim(),
        class_level: classLevel.trim(),
        duration_minutes: duration,
        extra_notes: extraNotes.trim() || undefined,
      });
      setPlan(res?.lesson_plan ?? res);
      toast.success('Lesson plan generated');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Failed to generate lesson plan');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!plan) return;
    const text = [
      `LESSON PLAN — ${subject} | ${topic}`,
      `Class: ${classLevel}  |  Duration: ${duration} mins`,
      '',
      '🎯 OBJECTIVES',
      ...(plan.objectives ?? []).map((o, i) => `  ${i + 1}. ${o}`),
      '',
      '📖 INTRODUCTION',
      `  ${plan.introduction}`,
      '',
      '📋 MAIN ACTIVITIES',
      ...(plan.main_activities ?? []).map((a, i) => `  ${i + 1}. ${a}`),
      '',
      '✅ ASSESSMENT',
      `  ${plan.assessment}`,
      '',
      '🏠 HOMEWORK',
      `  ${plan.homework}`,
      '',
      '🔧 RESOURCES NEEDED',
      ...(plan.resources_needed ?? []).map((r) => `  • ${r}`),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Lesson plan copied to clipboard');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">AI Lesson Planner</h1>
          <p className="text-xs text-muted-foreground">
            Enter your topic and get a full GES-format lesson plan instantly.
          </p>
        </div>
      </div>

      {/* Input form */}
      <div className="rounded-3xl border border-border bg-card p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Mathematics"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="class-level" className="text-sm font-medium">Class / Level</Label>
            <Input
              id="class-level"
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              placeholder="e.g. Basic 5 / JHS 2"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="topic" className="text-sm font-medium">Topic</Label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Fractions and Decimals"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-medium">Duration (minutes)</Label>
          <div className="mt-1 flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                  duration === d
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-slate-700'
                }`}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="extra-notes" className="text-sm font-medium">
            Extra notes <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="extra-notes"
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
            placeholder="e.g. Focus on real-life examples, include group work, students have limited textbooks…"
            rows={3}
            className="mt-1"
          />
        </div>

        <Button
          className="w-full gap-2"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Generate Lesson Plan</>
          )}
        </Button>
      </div>

      {/* Result */}
      {plan && (
        <div className="ai-lesson-plan-card rounded-3xl border p-5 space-y-5">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-base font-bold text-foreground">{subject} — {topic}</p>
              <p className="text-xs text-muted-foreground">{classLevel} · {duration} minutes · GES Format</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-2" onClick={handleCopy}>
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={handleGenerate} disabled={loading}>
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
              </Button>
            </div>
          </div>

          {/* Objectives */}
          <Section icon={<Target className="h-4 w-4 text-blue-400" />} title="Learning Objectives">
            <ol className="list-decimal list-inside space-y-1">
              {(plan.objectives ?? []).map((o, i) => (
                <li key={i} className="text-sm text-foreground">{o}</li>
              ))}
            </ol>
          </Section>

          {/* Introduction */}
          <Section icon={<BookOpen className="h-4 w-4 text-green-400" />} title="Introduction">
            <p className="text-sm text-foreground">{plan.introduction}</p>
          </Section>

          {/* Main Activities */}
          <Section icon={<ClipboardList className="h-4 w-4 text-purple-400" />} title="Main Activities">
            <ol className="list-decimal list-inside space-y-2">
              {(plan.main_activities ?? []).map((a, i) => (
                <li key={i} className="text-sm text-foreground">{a}</li>
              ))}
            </ol>
          </Section>

          {/* Assessment */}
          <Section icon={<CheckSquare className="h-4 w-4 text-yellow-400" />} title="Assessment">
            <p className="text-sm text-foreground">{plan.assessment}</p>
          </Section>

          {/* Homework */}
          <Section icon={<Home className="h-4 w-4 text-orange-400" />} title="Homework">
            <p className="text-sm text-foreground">{plan.homework}</p>
          </Section>

          {/* Resources */}
          <Section icon={<Wrench className="h-4 w-4 text-slate-400" />} title="Resources Needed">
            <ul className="flex flex-wrap gap-2">
              {(plan.resources_needed ?? []).map((r, i) => (
                <li
                  key={i}
                  className="ai-lesson-resource rounded-full px-3 py-1 text-xs"
                >
                  {r}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      )}
    </div>
  );
};

const Section = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="ai-lesson-section rounded-2xl border p-4 space-y-2">
    <div className="flex items-center gap-2">
      {icon}
      <p className="text-sm font-semibold text-foreground">{title}</p>
    </div>
    {children}
  </div>
);

export default TeacherAITools;
