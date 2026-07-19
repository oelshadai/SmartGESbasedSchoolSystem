import { useState } from 'react';
import { Sparkles, RefreshCw, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { secureApiClient } from '@/lib/secureApiClient';
import { useToast } from '@/components/ui/use-toast';

interface Question {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  answer: string;
  explanation: string;
}

const SUBJECTS = ['Mathematics', 'English', 'Science', 'Social Studies', 'ICT', 'French', 'RME'];

export default function PracticeQuestions() {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState('5');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    if (!subject || !topic) {
      toast({ title: 'Missing info', description: 'Select a subject and enter a topic.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setQuestions([]);
    setCurrent(0); setSelected(null); setRevealed(false); setScore(0); setDone(false);
    try {
      const res = await secureApiClient.post('/ai/student/practice-questions/', {
        subject, topic, difficulty, count: parseInt(count) || 5,
      }) as any;
      setQuestions(res.questions || []);
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to generate questions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (opt: string) => {
    if (revealed) return;
    setSelected(opt);
  };

  const handleReveal = () => {
    if (!selected) return;
    setRevealed(true);
    if (selected === questions[current].answer) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) { setDone(true); return; }
    setCurrent(c => c + 1);
    setSelected(null);
    setRevealed(false);
  };

  const restart = () => {
    setCurrent(0); setSelected(null); setRevealed(false); setScore(0); setDone(false);
  };

  const q = questions[current];
  const optionStyle = (opt: string) => {
    if (!revealed) return selected === opt ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/50';
    if (opt === q.answer) return 'border-emerald-500 bg-emerald-50';
    if (opt === selected && opt !== q.answer) return 'border-red-400 bg-red-50';
    return 'border-border opacity-50';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <h2 className="text-base font-bold text-foreground">Practice Questions</h2>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy" className="text-xs">Easy</SelectItem>
              <SelectItem value="medium" className="text-xs">Medium</SelectItem>
              <SelectItem value="hard" className="text-xs">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Input placeholder="Topic (e.g. Fractions)" value={topic} onChange={e => setTopic(e.target.value)} className="h-9 text-sm" />
          </div>
          <Select value={count} onValueChange={setCount}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[3,5,8,10].map(n => <SelectItem key={n} value={String(n)} className="text-xs">{n} Qs</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button className="w-full gap-2" onClick={generate} disabled={loading}>
          {loading ? <><RefreshCw className="h-4 w-4 animate-spin" />Generating…</> : <><Sparkles className="h-4 w-4" />Generate Questions</>}
        </Button>
      </div>

      {/* Quiz */}
      {questions.length > 0 && !done && q && (
        <div className="space-y-4">
          {/* Progress */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Question {current + 1} of {questions.length}</span>
            <span className="font-semibold text-foreground">{score}/{current + (revealed ? 1 : 0)} correct</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((current) / questions.length) * 100}%` }} />
          </div>

          {/* Question card */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <p className="text-sm font-semibold text-foreground leading-relaxed">{q.question}</p>

            <div className="space-y-2">
              {(['A','B','C','D'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${optionStyle(opt)}`}
                >
                  <span className={`h-6 w-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${
                    revealed && opt === q.answer ? 'border-emerald-500 text-emerald-600 bg-emerald-100'
                    : revealed && opt === selected && opt !== q.answer ? 'border-red-400 text-red-600 bg-red-100'
                    : selected === opt ? 'border-primary text-primary bg-primary/10'
                    : 'border-border text-muted-foreground'
                  }`}>{opt}</span>
                  <span className="text-sm text-foreground">{q.options[opt]}</span>
                  {revealed && opt === q.answer && <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto shrink-0" />}
                  {revealed && opt === selected && opt !== q.answer && <XCircle className="h-4 w-4 text-red-400 ml-auto shrink-0" />}
                </button>
              ))}
            </div>

            {/* Explanation */}
            {revealed && (
              <div className="bg-muted/50 rounded-xl px-3 py-2.5 text-xs text-foreground/80 leading-relaxed border border-border">
                <span className="font-semibold text-foreground">Explanation: </span>{q.explanation}
              </div>
            )}

            <div className="flex gap-2">
              {!revealed
                ? <Button className="flex-1" size="sm" onClick={handleReveal} disabled={!selected}>Check Answer</Button>
                : <Button className="flex-1 gap-1" size="sm" onClick={handleNext}>
                    {current + 1 >= questions.length ? 'See Results' : 'Next'} <ChevronRight className="h-4 w-4" />
                  </Button>
              }
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {done && (
        <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-4">
          <div className={`h-16 w-16 rounded-full mx-auto flex items-center justify-center text-2xl font-bold ${
            score / questions.length >= 0.7 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {score}/{questions.length}
          </div>
          <div>
            <p className="text-base font-bold text-foreground">
              {score / questions.length >= 0.8 ? '🎉 Excellent!' : score / questions.length >= 0.6 ? '👍 Good effort!' : '📚 Keep practising!'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              You got {score} out of {questions.length} correct ({Math.round((score / questions.length) * 100)}%)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" size="sm" onClick={restart}>Try Again</Button>
            <Button className="flex-1" size="sm" onClick={generate}>New Questions</Button>
          </div>
        </div>
      )}
    </div>
  );
}
