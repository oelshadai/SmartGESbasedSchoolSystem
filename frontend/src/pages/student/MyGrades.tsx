import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { secureApiClient } from '@/lib/secureApiClient';
import {
  Award, TrendingUp, BookOpen, Loader2, AlertCircle,
  RefreshCw, ChevronDown, ChevronUp, Trophy, Target,
  BarChart3, MessageSquare
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface SubjectResult {
  id: number;
  subject_name: string;
  ca_score: number;
  exam_score: number;
  total_score: number;
  grade: string;
  remark: string;
  term_id: number;
  term_name: string;
}

interface TermResult {
  id: number;
  term_id: number;
  term_name: string;
  class_name: string;
  total_score: number;
  average_score: number;
  subjects_count: number;
  class_position: number | null;
  total_students: number;
  teacher_remarks: string;
  promoted: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const gradeColor: Record<string, string> = {
  'A+': 'bg-emerald-100 text-emerald-700',
  'A':  'bg-emerald-100 text-emerald-700',
  'B':  'bg-blue-100 text-blue-700',
  'C':  'bg-yellow-100 text-yellow-700',
  'D':  'bg-orange-100 text-orange-700',
  'E':  'bg-orange-100 text-orange-700',
  'F':  'bg-red-100 text-red-700',
};

const scoreBarColor = (score: number) => {
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

// ── Component ────────────────────────────────────────────────────────────────

const MyGrades = () => {
  const [subjectResults, setSubjectResults] = useState<SubjectResult[]>([]);
  const [termResults, setTermResults] = useState<TermResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [subRes, termRes] = await Promise.all([
        secureApiClient.get('/scores/subject-results/my-results/'),
        secureApiClient.get('/scores/term-results/my-term-results/'),
      ]);
      const subjects: SubjectResult[] = Array.isArray(subRes) ? subRes : [];
      const terms: TermResult[] = Array.isArray(termRes) ? termRes : [];
      setSubjectResults(subjects);
      setTermResults(terms);
      // Default to most recent term
      if (terms.length > 0 && !selectedTermId) {
        setSelectedTermId(terms[0].term_id);
      } else if (subjects.length > 0 && !selectedTermId) {
        setSelectedTermId(subjects[0].term_id);
      }
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load grades');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your grades…</p>
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

  // ── Derived ────────────────────────────────────────────────────────────────
  // Unique terms from subject results + term results combined
  const termMap = new Map<number, string>();
  subjectResults.forEach(r => termMap.set(r.term_id, r.term_name));
  termResults.forEach(r => termMap.set(r.term_id, r.term_name));
  const terms = Array.from(termMap.entries()).map(([id, name]) => ({ id, name }));

  const filtered = subjectResults.filter(r => r.term_id === selectedTermId);
  const currentTermResult = termResults.find(r => r.term_id === selectedTermId);

  const bestSubject = filtered.length > 0
    ? filtered.reduce((a, b) => a.total_score > b.total_score ? a : b)
    : null;
  const weakSubject = filtered.length > 0
    ? filtered.reduce((a, b) => a.total_score < b.total_score ? a : b)
    : null;
  const avg = filtered.length > 0
    ? (filtered.reduce((s, r) => s + r.total_score, 0) / filtered.length).toFixed(1)
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">My Grades</h1>
            <p className="text-xs text-muted-foreground">Academic performance</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => fetchData(true)} disabled={refreshing} className="h-9 w-9">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* No data state */}
      {terms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No grades recorded yet</p>
          <p className="text-xs text-muted-foreground text-center">Your grades will appear here once your teacher enters scores</p>
        </div>
      )}

      {terms.length > 0 && (
        <>
          {/* Term selector */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {terms.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTermId(t.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                  selectedTermId === t.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Term summary card */}
          {currentTermResult ? (
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-primary-foreground space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium opacity-80">Term Summary</p>
                {currentTermResult.class_position && (
                  <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
                    <Trophy className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold">
                      {ordinal(currentTermResult.class_position)} of {currentTermResult.total_students}
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold">{currentTermResult.average_score.toFixed(1)}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">Average</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold">{currentTermResult.total_score.toFixed(0)}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">Total</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold">{currentTermResult.subjects_count}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">Subjects</p>
                </div>
              </div>
              {currentTermResult.teacher_remarks && (
                <div className="flex items-start gap-2 bg-white/10 rounded-xl p-3">
                  <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-70" />
                  <p className="text-xs opacity-90 leading-relaxed">{currentTermResult.teacher_remarks}</p>
                </div>
              )}
            </div>
          ) : avg && (
            /* Fallback mini stats if no TermResult computed yet */
            <div className="grid grid-cols-3 gap-3">
              <div className="relative group rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-lg hover:scale-[1.02] transition-all duration-200 overflow-hidden text-center">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -top-4 -right-4 w-14 h-14 bg-blue-500/10 rounded-full blur-xl opacity-60" />
                <div className="relative">
                  <p className="text-xl font-bold text-foreground">{avg}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Average</p>
                </div>
              </div>
              <div className="relative group rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 shadow-lg hover:scale-[1.02] transition-all duration-200 overflow-hidden text-center">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-violet-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -top-4 -right-4 w-14 h-14 bg-purple-500/10 rounded-full blur-xl opacity-60" />
                <div className="relative">
                  <p className="text-xl font-bold text-foreground">{bestSubject?.subject_name.split(' ')[0]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Best</p>
                </div>
              </div>
              <div className="relative group rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-lg hover:scale-[1.02] transition-all duration-200 overflow-hidden text-center">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -top-4 -right-4 w-14 h-14 bg-emerald-500/10 rounded-full blur-xl opacity-60" />
                <div className="relative">
                  <p className="text-xl font-bold text-foreground">{filtered.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Subjects</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick highlights */}
          {filtered.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {bestSubject && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Best Subject</span>
                  </div>
                  <p className="text-sm font-bold text-foreground truncate">{bestSubject.subject_name}</p>
                  <p className="text-xs text-muted-foreground">{bestSubject.total_score}/100 · {bestSubject.grade}</p>
                </div>
              )}
              {weakSubject && weakSubject.id !== bestSubject?.id && (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Target className="h-3.5 w-3.5 text-orange-600" />
                    <span className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">Needs Work</span>
                  </div>
                  <p className="text-sm font-bold text-foreground truncate">{weakSubject.subject_name}</p>
                  <p className="text-xs text-muted-foreground">{weakSubject.total_score}/100 · {weakSubject.grade}</p>
                </div>
              )}
            </div>
          )}

          {/* Subject results list */}
          {filtered.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No results for this term yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Subject Results
              </p>
              {filtered.map(r => {
                const isExpanded = expandedSubject === r.id;
                const caPercent = (r.ca_score / 50) * 100;
                const examPercent = (r.exam_score / 50) * 100;
                const totalPercent = r.total_score;

                return (
                  <div
                    key={r.id}
                    className="bg-card border border-border rounded-2xl overflow-hidden"
                  >
                    {/* Main row — always visible */}
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer active:bg-muted/30 transition-colors"
                      onClick={() => setExpandedSubject(isExpanded ? null : r.id)}
                    >
                      {/* Score circle */}
                      <div className={`h-11 w-11 rounded-xl flex flex-col items-center justify-center shrink-0 ${gradeColor[r.grade] ?? 'bg-gray-100 text-gray-700'}`}>
                        <span className="text-sm font-bold leading-none">{r.grade}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{r.subject_name}</p>
                        {/* score bar */}
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded-full transition-all ${scoreBarColor(r.total_score)}`}
                            style={{ width: `${totalPercent}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{r.remark}</p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-base font-bold text-foreground">{r.total_score}</p>
                        <p className="text-[10px] text-muted-foreground">/ 100</p>
                      </div>

                      <div className="shrink-0">
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        }
                      </div>
                    </div>

                    {/* Expanded CA breakdown */}
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score Breakdown</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-card rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-muted-foreground">CA Score</span>
                              <span className="text-xs font-bold text-foreground">{r.ca_score}/50</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${scoreBarColor(caPercent)}`} style={{ width: `${caPercent}%` }} />
                            </div>
                          </div>
                          <div className="bg-card rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-muted-foreground">Exam Score</span>
                              <span className="text-xs font-bold text-foreground">{r.exam_score}/50</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${scoreBarColor(examPercent)}`} style={{ width: `${examPercent}%` }} />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-card rounded-xl p-3">
                          <span className="text-xs font-semibold text-foreground">Total</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{r.total_score}/100</span>
                            <Badge className={`text-[10px] border-0 ${gradeColor[r.grade] ?? 'bg-gray-100 text-gray-700'}`}>
                              {r.grade}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyGrades;
