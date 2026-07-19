import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ai from '@/services/aiService';

interface LessonPlan {
  objectives: string[];
  introduction: string;
  main_activities: string[];
  assessment: string;
  homework: string;
  resources_needed: string[];
  _note?: string;
}

export default function LessonPlanGenerator() {
  const [form, setForm] = useState({ subject: '', topic: '', class_level: '', duration_minutes: '40' });
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const { toast } = useToast();

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleGenerate = async () => {
    if (!form.subject || !form.topic || !form.class_level) {
      toast({ title: 'Missing fields', description: 'Subject, topic and class level are required.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setPlan(null);
    try {
      const res = await ai.generateLessonPlan(form.subject, form.topic, form.class_level, parseInt(form.duration_minutes) || 40) as any;
      setPlan(res.lesson_plan);
    } catch (e: any) {
      const msg = e.message || '';
      toast({
        title: msg.includes('not installed') || msg.includes('not set') ? 'AI Unavailable' : 'Error',
        description: msg.includes('not installed') ? 'Gemini AI is not configured on this server.' : msg || 'Failed to generate lesson plan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-foreground/60" />
            AI Lesson Plan Generator
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setExpanded(v => !v)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Subject (e.g. Maths)" value={form.subject} onChange={e => set('subject', e.target.value)} className="h-8 text-xs" />
            <Input placeholder="Topic (e.g. Fractions)" value={form.topic} onChange={e => set('topic', e.target.value)} className="h-8 text-xs" />
            <Input placeholder="Class Level (e.g. B4)" value={form.class_level} onChange={e => set('class_level', e.target.value)} className="h-8 text-xs" />
            <Input placeholder="Duration (mins)" type="number" value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} className="h-8 text-xs" />
          </div>

          <Button className="w-full gap-2" size="sm" onClick={handleGenerate} disabled={loading}>
            <Sparkles className="h-3.5 w-3.5" />
            {loading ? 'Generating…' : 'Generate Lesson Plan'}
          </Button>

          {plan && (
            <div className="space-y-3 pt-1">
              {plan._note && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  {plan._note}
                </div>
              )}

              <Section title="Learning Objectives">
                <ol className="list-decimal list-inside space-y-0.5">
                  {plan.objectives.map((o, i) => <li key={i} className="text-xs text-foreground/80">{o}</li>)}
                </ol>
              </Section>

              <Section title="Introduction">
                <p className="text-xs text-foreground/80">{plan.introduction}</p>
              </Section>

              <Section title="Main Activities">
                <ol className="list-decimal list-inside space-y-0.5">
                  {plan.main_activities.map((a, i) => <li key={i} className="text-xs text-foreground/80">{a}</li>)}
                </ol>
              </Section>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Section title="Assessment">
                  <p className="text-xs text-foreground/80">{plan.assessment}</p>
                </Section>
                <Section title="Homework">
                  <p className="text-xs text-foreground/80">{plan.homework}</p>
                </Section>
              </div>

              <Section title="Resources Needed">
                <div className="flex flex-wrap gap-1">
                  {plan.resources_needed.map((r, i) => (
                    <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full text-foreground/70">{r}</span>
                  ))}
                </div>
              </Section>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}
