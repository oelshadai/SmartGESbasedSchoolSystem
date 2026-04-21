import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { secureApiClient } from '@/lib/secureApiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, BookOpen, GraduationCap, Loader2, RefreshCw, Trophy } from 'lucide-react';

interface ChildInfo { student_id: string; name: string; relationship: string; }

interface SubjectResult {
  id: number; subject_name: string; ca_score: number;
  exam_score: number; total_score: number; grade: string;
  remark: string; term_id: number; term_name: string;
}
interface TermResult {
  id: number; term_id: number; term_name: string; class_name: string;
  total_score: number; average_score: number; subjects_count: number;
  class_position: number | null; total_students: number;
  teacher_remarks: string; promoted: boolean;
}

const gradeColor: Record<string, string> = {
  'A+': 'bg-emerald-100 text-emerald-700', A: 'bg-emerald-100 text-emerald-700',
  B: 'bg-blue-100 text-blue-700', C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-orange-100 text-orange-700', E: 'bg-orange-100 text-orange-700',
  F: 'bg-red-100 text-red-700',
};

const scoreBar = (score: number) => {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 70) return 'bg-blue-500';
  if (score >= 60) return 'bg-yellow-400';
  if (score >= 50) return 'bg-orange-400';
  return 'bg-red-400';
};

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const ParentGrades = () => {
  const user = useAuthStore((s) => s.user);
  const children: ChildInfo[] = (user as any)?.children || [];

  const [selectedId, setSelectedId] = useState<string>(children[0]?.student_id ?? '');
  const [subjects, setSubjects] = useState<SubjectResult[]>([]);
  const [termResults, setTermResults] = useState<TermResult[]>([]);
  const [activeTerm, setActiveTerm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (id: string) => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const [sr, tr] = await Promise.all([
        secureApiClient.get<SubjectResult[]>(`/scores/subject-results/my-results/?student_id=${id}`),
        secureApiClient.get<TermResult[]>(`/scores/term-results/my-term-results/?student_id=${id}`),
      ]);
      const srArr = Array.isArray(sr) ? sr : [];
      const trArr = Array.isArray(tr) ? tr : [];
      setSubjects(srArr);
      setTermResults(trArr);
      if (trArr.length > 0) setActiveTerm(trArr[0].term_id);
    } catch {
      setError('Failed to load grades. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(selectedId); }, [selectedId]);

  const terms = [...new Map(subjects.map(s => [s.term_id, s.term_name])).entries()];
  const visibleSubjects = activeTerm ? subjects.filter(s => s.term_id === activeTerm) : subjects;
  const activeTermResult = termResults.find(t => t.term_id === activeTerm) ?? null;

  return (
    <div className="space-y-6 p-4 sm:p-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Grades</h1>
        <p className="text-muted-foreground text-sm mt-1">View your child's academic results</p>
      </div>

      {/* Child selector */}
      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {children.map(c => (
            <Button key={c.student_id} size="sm"
              variant={selectedId === c.student_id ? 'default' : 'outline'}
              onClick={() => setSelectedId(c.student_id)}
            >
              <GraduationCap className="h-3.5 w-3.5 mr-1" /> {c.name}
            </Button>
          ))}
        </div>
      )}

      {children.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">No children linked.</CardContent></Card>
      ) : loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : error ? (
        <Card><CardContent className="py-10 text-center space-y-3">
          <p className="text-red-500 text-sm">{error}</p>
          <Button size="sm" variant="outline" onClick={() => fetchData(selectedId)}>
            <RefreshCw className="h-4 w-4 mr-1" /> Retry
          </Button>
        </CardContent></Card>
      ) : subjects.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">No grade records found.</CardContent></Card>
      ) : (
        <>
          {/* Term tabs */}
          {terms.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {terms.map(([id, name]) => (
                <Button key={id} size="sm" variant={activeTerm === id ? 'default' : 'outline'}
                  onClick={() => setActiveTerm(id)}>{name}</Button>
              ))}
            </div>
          )}

          {/* Term summary */}
          {activeTermResult && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Class</p>
                    <p className="font-semibold text-sm">{activeTermResult.class_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Average</p>
                    <p className="font-bold text-lg text-primary">{activeTermResult.average_score.toFixed(1)}%</p>
                  </div>
                  {activeTermResult.class_position && (
                    <div>
                      <p className="text-xs text-muted-foreground">Position</p>
                      <p className="font-bold text-lg flex items-center justify-center gap-1">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        {ordinal(activeTermResult.class_position)} / {activeTermResult.total_students}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Subjects</p>
                    <p className="font-semibold">{activeTermResult.subjects_count}</p>
                  </div>
                </div>
                {activeTermResult.teacher_remarks && (
                  <p className="mt-3 text-xs text-muted-foreground border-t pt-3 italic">
                    "{activeTermResult.teacher_remarks}"
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Subject results */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Subject Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {visibleSubjects.map(r => (
                  <div key={r.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{r.subject_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.term_name}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>CA: <strong className="text-foreground">{r.ca_score}</strong></span>
                          <span>Exam: <strong className="text-foreground">{r.exam_score}</strong></span>
                          <span>Total: <strong className="text-foreground">{r.total_score}</strong></span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${scoreBar(r.total_score)}`}
                            style={{ width: `${Math.min(100, r.total_score)}%` }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge className={`text-base font-bold px-3 py-1 ${gradeColor[r.grade] ?? 'bg-gray-100 text-gray-700'}`}>
                          {r.grade}
                        </Badge>
                        {r.remark && <p className="text-xs text-muted-foreground mt-1 max-w-[80px] text-right">{r.remark}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ParentGrades;
