import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { secureApiClient } from '@/lib/secureApiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText, GraduationCap, RefreshCw, Download, Eye,
  Trophy, TrendingUp, BookOpen, ExternalLink,
} from 'lucide-react';

interface ChildInfo { student_id: string; name: string; relationship: string; }

interface SubjectResult {
  subject_name: string; ca_score: number; exam_score: number;
  total_score: number; grade: string; remark: string;
}
interface TermReport {
  id: number; term_name: string; academic_year: string; class_name: string;
  average_score: number; total_score: number; class_position: number | null;
  total_students: number; subjects_count: number;
  teacher_remarks: string; promoted: boolean; subjects: SubjectResult[];
}
interface PublishedReport {
  id: number; term_name: string; academic_year: string; status: string;
  report_code: string; pdf_url: string | null; published_at: string | null;
}

const gradeColor: Record<string, string> = {
  'A+': 'bg-emerald-100 text-emerald-700', A: 'bg-emerald-100 text-emerald-700',
  B: 'bg-blue-100 text-blue-700', C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-orange-100 text-orange-700', E: 'bg-orange-100 text-orange-700',
  F: 'bg-red-100 text-red-700',
};

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const ParentReports = () => {
  const user = useAuthStore((s) => s.user);
  const children: ChildInfo[] = (user as any)?.children || [];

  const [selectedId, setSelectedId] = useState<string>(children[0]?.student_id ?? '');
  const [reports, setReports] = useState<TermReport[]>([]);
  const [published, setPublished] = useState<PublishedReport[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (id: string) => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const [r, p] = await Promise.all([
        secureApiClient.get<TermReport[]>(`/students/reports/?student_id=${id}`),
        secureApiClient.get<PublishedReport[]>(`/students/published-reports/?student_id=${id}`),
      ]);
      setReports(Array.isArray(r) ? r : []);
      setPublished(Array.isArray(p) ? p : []);
    } catch {
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(selectedId); }, [selectedId]);

  const selected = children.find(c => c.student_id === selectedId);

  return (
    <div className="space-y-6 p-4 sm:p-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">View your child's term reports and report cards</p>
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
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : error ? (
        <Card><CardContent className="py-10 text-center space-y-3">
          <p className="text-red-500 text-sm">{error}</p>
          <Button size="sm" variant="outline" onClick={() => fetchData(selectedId)}>
            <RefreshCw className="h-4 w-4 mr-1" /> Retry
          </Button>
        </CardContent></Card>
      ) : (
        <>
          {/* Published PDFs */}
          {published.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Published Report Cards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {published.map(p => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border px-4 py-3 gap-3">
                      <div>
                        <p className="font-medium text-sm">{p.academic_year} — {p.term_name} Term</p>
                        <p className="text-xs text-muted-foreground">Code: {p.report_code}</p>
                        {p.published_at && (
                          <p className="text-xs text-muted-foreground">
                            Published {new Date(p.published_at).toLocaleDateString('en-GB')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="default" className="text-xs bg-green-600">{p.status}</Badge>
                        {p.pdf_url && (
                          <a href={p.pdf_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="h-8 gap-1">
                              <Download className="h-3.5 w-3.5" /> PDF
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Term reports */}
          {reports.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">
              No term report data found for {selected?.name}.
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {reports.map(r => (
                <Card key={r.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{r.academic_year} — {r.term_name} Term</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.class_name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.promoted && <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Promoted</Badge>}
                        <Button size="sm" variant="ghost" className="h-8"
                          onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                          {expanded === r.id ? 'Hide' : 'Details'}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Average</p>
                        <p className="font-bold text-primary">{r.average_score.toFixed(1)}%</p>
                      </div>
                      {r.class_position && (
                        <div className="text-center border-x">
                          <p className="text-xs text-muted-foreground">Position</p>
                          <p className="font-bold flex items-center justify-center gap-1">
                            <Trophy className="h-3.5 w-3.5 text-amber-500" />
                            {ordinal(r.class_position)}/{r.total_students}
                          </p>
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Subjects</p>
                        <p className="font-bold">{r.subjects_count}</p>
                      </div>
                    </div>
                  </CardHeader>

                  {expanded === r.id && (
                    <CardContent className="pt-0">
                      <div className="space-y-2 border-t pt-3">
                        {r.subjects.map((s, i) => (
                          <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{s.subject_name}</p>
                              <p className="text-xs text-muted-foreground">
                                CA: {s.ca_score} · Exam: {s.exam_score} · Total: {s.total_score}
                              </p>
                            </div>
                            <Badge className={`text-xs font-bold ${gradeColor[s.grade] ?? 'bg-gray-100 text-gray-700'}`}>
                              {s.grade}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      {r.teacher_remarks && (
                        <p className="mt-3 text-xs text-muted-foreground italic border-t pt-3">
                          Teacher: "{r.teacher_remarks}"
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ParentReports;
