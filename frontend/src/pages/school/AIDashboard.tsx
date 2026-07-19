import { useEffect, useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';
import secureApiClient from '@/lib/secureApiClient';
import ClassRiskSummaryCard from '@/components/ai/ClassRiskSummaryCard';
import StudentRiskCard from '@/components/ai/StudentRiskCard';
import SmartSmsComposer from '@/components/ai/SmartSmsComposer';
import LessonPlanGenerator from '@/components/ai/LessonPlanGenerator';
import ai from '@/services/aiService';
import { useToast } from '@/components/ui/use-toast';

export default function AIDashboard() {
  const [terms, setTerms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [classInsights, setClassInsights] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    secureApiClient.get('/schools/terms/').then((r: any) => {
      const list = Array.isArray(r) ? r : r.results || [];
      setTerms(list);
      const current = list.find((t: any) => t.is_current);
      if (current) setSelectedTerm(String(current.id));
    }).catch(() => {});

    secureApiClient.get('/schools/classes/').then((r: any) => {
      const list = Array.isArray(r) ? r : r.results || [];
      setClasses(list);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass) { setStudents([]); setSelectedStudent(''); return; }
    secureApiClient.get(`/students/?class_id=${selectedClass}`).then((r: any) => {
      const list = Array.isArray(r) ? r : r.results || [];
      setStudents(list);
      setSelectedStudent('');
    }).catch(() => {});
  }, [selectedClass]);

  const handleClassInsights = async () => {
    if (!selectedClass || !selectedTerm) return;
    setInsightsLoading(true);
    setClassInsights(null);
    try {
      const res = await ai.generateClassInsights(parseInt(selectedClass), parseInt(selectedTerm)) as any;
      setClassInsights(res.insights);
    } catch (e: any) {
      const msg = e.message || '';
      toast({
        title: msg.includes('not installed') || msg.includes('not set') ? 'AI Unavailable' : 'Error',
        description: msg.includes('not installed') ? 'Gemini AI is not configured on this server.' : msg || 'Failed to generate insights',
        variant: 'destructive',
      });
    } finally {
      setInsightsLoading(false);
    }
  };

  const selectedStudentObj = students.find(s => String(s.id) === selectedStudent);
  const selectedClassObj = classes.find(c => String(c.id) === selectedClass);

  return (
    <div className="min-h-full w-full max-w-full overflow-x-hidden">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <PageHeader
          title="AI Intelligence Centre"
          description="Risk analysis, attendance patterns, academic trends and smart SMS"
          action={
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-foreground/60">Powered by SmartGES AI</span>
            </div>
          }
        />

        {/* Global selectors */}
        <div className="flex flex-wrap gap-3">
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue placeholder="Select Term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((t: any) => (
                <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                  {t.name}{t.is_current ? ' (Current)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c: any) => (
                <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                  {c.full_name || `${c.level_display || c.level}${c.section ? ` ${c.section}` : ''}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {students.length > 0 && (
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-52 h-8 text-xs">
                <SelectValue placeholder="Select Student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s: any) => (
                  <SelectItem key={s.id} value={String(s.id)} className="text-xs">
                    {s.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Tabs defaultValue="risk" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="risk" className="text-xs">Risk Analysis</TabsTrigger>
            <TabsTrigger value="student" className="text-xs">Student Detail</TabsTrigger>
            <TabsTrigger value="sms" className="text-xs">Smart SMS</TabsTrigger>
            <TabsTrigger value="lessons" className="text-xs">Lesson Plans</TabsTrigger>
          </TabsList>

          {/* ── Risk Analysis Tab ── */}
          <TabsContent value="risk" className="mt-4 space-y-4">
            {!selectedTerm && (
              <div className="text-sm text-foreground/60 text-center py-8">Select a term to begin analysis.</div>
            )}

            {selectedTerm && !selectedClass && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map(c => (
                  <ClassRiskSummaryCard
                    key={c.id}
                    classId={c.id}
                    className={c.full_name || `${c.level_display || c.level}${c.section ? ` ${c.section}` : ''}`}
                    termId={parseInt(selectedTerm)}
                  />
                ))}
              </div>
            )}

            {selectedTerm && selectedClass && (
              <div className="space-y-4">
                <ClassRiskSummaryCard
                  classId={parseInt(selectedClass)}
                  className={selectedClassObj?.full_name || 'Selected Class'}
                  termId={parseInt(selectedTerm)}
                />

                {/* Class AI Insights */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                        AI Teaching Recommendations
                      </CardTitle>
                      <Button size="sm" variant="outline" className="gap-2 h-8 text-xs" onClick={handleClassInsights} disabled={insightsLoading}>
                        <RefreshCw className={`h-3.5 w-3.5 ${insightsLoading ? 'animate-spin' : ''}`} />
                        {insightsLoading ? 'Analysing…' : 'Generate Insights'}
                      </Button>
                    </div>
                  </CardHeader>
                  {classInsights && (
                    <CardContent>
                      <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">{classInsights}</p>
                    </CardContent>
                  )}
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ── Student Detail Tab ── */}
          <TabsContent value="student" className="mt-4">
            {!selectedTerm || !selectedStudent ? (
              <div className="text-sm text-foreground/60 text-center py-8">
                Select a term, class and student to view detailed analysis.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <StudentRiskCard
                  studentId={parseInt(selectedStudent)}
                  studentName={selectedStudentObj?.full_name || 'Student'}
                  termId={parseInt(selectedTerm)}
                />

                {/* Academic Trends */}
                <AcademicTrendsCard
                  studentId={parseInt(selectedStudent)}
                  termId={parseInt(selectedTerm)}
                />

                {/* Fee Risk */}
                <FeeRiskCard
                  studentId={parseInt(selectedStudent)}
                  termId={parseInt(selectedTerm)}
                />

                {/* Attendance Patterns */}
                <AttendancePatternsCard
                  studentId={parseInt(selectedStudent)}
                  termId={parseInt(selectedTerm)}
                />
              </div>
            )}
          </TabsContent>

          {/* ── Smart SMS Tab ── */}
          <TabsContent value="sms" className="mt-4">
            {!selectedTerm || !selectedStudent ? (
              <div className="text-sm text-foreground/60 text-center py-8">
                Select a term, class and student to compose a smart SMS.
              </div>
            ) : (
              <div className="max-w-md">
                <SmartSmsComposer
                  studentId={parseInt(selectedStudent)}
                  studentName={selectedStudentObj?.full_name || 'Student'}
                  termId={parseInt(selectedTerm)}
                />
              </div>
            )}
          </TabsContent>

          {/* ── Lesson Plans Tab ── */}
          <TabsContent value="lessons" className="mt-4">
            <div className="max-w-xl">
              <LessonPlanGenerator />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ── Inline sub-components (small enough to keep in same file) ─────────────────

function AcademicTrendsCard({ studentId, termId }: { studentId: number; termId: number }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setData(await ai.getAcademicTrends(studentId, termId)); }
    catch { /* silent */ }
    finally { setLoading(false); }
  };

  const trendColor = (t: string) =>
    t === 'IMPROVING' ? 'text-green-600' : t === 'DECLINING' ? 'text-red-600' : 'text-foreground/60';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Academic Trends</CardTitle>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!data && !loading && <Button variant="outline" size="sm" className="w-full" onClick={load}>Load Trends</Button>}
        {loading && <div className="text-center text-sm text-foreground/60 py-4">Loading…</div>}
        {data && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/60">Overall Trend</span>
              <span className={`text-sm font-semibold ${trendColor(data.overall_trend)}`}>
                {data.overall_trend} ({data.percentage_change > 0 ? '+' : ''}{data.percentage_change.toFixed(1)}%)
              </span>
            </div>
            {data.best_subject && (
              <div className="flex justify-between text-xs">
                <span className="text-foreground/60">Best Subject</span>
                <span className="text-green-600 font-medium">{data.best_subject}</span>
              </div>
            )}
            {data.worst_subject && (
              <div className="flex justify-between text-xs">
                <span className="text-foreground/60">Needs Attention</span>
                <span className="text-red-600 font-medium">{data.worst_subject}</span>
              </div>
            )}
            {data.alert_needed && data.alert_reason && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                <span className="text-xs text-red-700">{data.alert_reason}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FeeRiskCard({ studentId, termId }: { studentId: number; termId: number }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setData(await ai.getFeeRisk(studentId, termId)); }
    catch { /* silent */ }
    finally { setLoading(false); }
  };

  const riskColor = (r: string) =>
    r === 'HIGH' ? 'text-red-600' : r === 'MEDIUM' ? 'text-amber-600' : 'text-green-600';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Fee Default Risk</CardTitle>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!data && !loading && <Button variant="outline" size="sm" className="w-full" onClick={load}>Load Fee Risk</Button>}
        {loading && <div className="text-center text-sm text-foreground/60 py-4">Loading…</div>}
        {data && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-foreground/60">Risk Level</span>
              <span className={`font-semibold ${riskColor(data.default_risk)}`}>{data.default_risk}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-foreground/60">Balance</span>
              <span className="font-medium">GH₵{data.balance_remaining.toFixed(2)}</span>
            </div>
            {data.days_until_due !== null && (
              <div className="flex justify-between text-xs">
                <span className="text-foreground/60">Due In</span>
                <span className={`font-medium ${data.days_until_due <= 3 ? 'text-red-600' : ''}`}>
                  {data.days_until_due} days
                </span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-foreground/60">Best SMS Day</span>
              <span className="font-medium">{data.best_sms_day}</span>
            </div>
            <div className="bg-muted/50 rounded-md px-3 py-2 text-xs text-foreground/70 mt-1">
              {data.recommended_action}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AttendancePatternsCard({ studentId, termId }: { studentId: number; termId: number }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setData(await ai.getAttendancePatterns(studentId, termId)); }
    catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Attendance Patterns</CardTitle>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!data && !loading && <Button variant="outline" size="sm" className="w-full" onClick={load}>Detect Patterns</Button>}
        {loading && <div className="text-center text-sm text-foreground/60 py-4">Loading…</div>}
        {data && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-foreground/60">Pattern</span>
              <span className="font-medium">{data.pattern_type.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-foreground/60">Trend</span>
              <span className={`font-medium ${data.trend === 'IMPROVING' ? 'text-green-600' : data.trend === 'DECLINING' ? 'text-red-600' : ''}`}>
                {data.trend}
              </span>
            </div>
            {data.absent_day && (
              <div className="flex justify-between text-xs">
                <span className="text-foreground/60">Often Absent On</span>
                <span className="font-medium text-amber-600">{data.absent_day}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-foreground/60">Max Consecutive Absences</span>
              <span className={`font-medium ${data.consecutive_absences >= 3 ? 'text-red-600' : ''}`}>
                {data.consecutive_absences}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-foreground/60">Late Arrivals</span>
              <span className="font-medium">{data.late_count}</span>
            </div>
            {data.alert_needed && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="text-xs text-amber-700">Attendance alert recommended</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
