import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Sparkles, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { secureApiClient } from '@/lib/secureApiClient';

interface Analysis {
  strengths: string[];
  weaknesses: string[];
  attendance_status: string;
  overall_trend: string;
  percentage_change: number;
  current_average: number;
  ai_message: string;
  study_tips: string[];
  predicted_grade: string;
}

export default function MyAIAnalysis() {
  const [data, setData] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await secureApiClient.get('/ai/student/my-analysis/') as any;
      setData(res);
    } catch (e: any) {
      setError(e?.message || 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const TrendIcon = data?.overall_trend === 'Improving'
    ? TrendingUp
    : data?.overall_trend === 'Declining'
      ? TrendingDown
      : Minus;

  const trendColor = data?.overall_trend === 'Improving'
    ? 'text-emerald-600'
    : data?.overall_trend === 'Declining'
      ? 'text-red-500'
      : 'text-amber-500';

  const attendanceColor = data?.attendance_status === 'Good'
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : data?.attendance_status === 'Critical'
      ? 'text-red-600 bg-red-50 border-red-200'
      : 'text-amber-600 bg-amber-50 border-amber-200';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="text-base font-bold text-foreground">My AI Analysis</h2>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {!data && !loading && (
        <button
          onClick={load}
          className="w-full rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/50 py-10 flex flex-col items-center gap-3 hover:bg-purple-50 transition-colors"
        >
          <Sparkles className="h-8 w-8 text-purple-400" />
          <p className="text-sm font-medium text-purple-700">Tap to analyse my performance</p>
          <p className="text-xs text-purple-500">AI will review your grades and attendance</p>
        </button>
      )}

      {loading && (
        <div className="rounded-2xl bg-muted/50 py-12 flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
          <p className="text-sm text-muted-foreground">Analysing your performance…</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* AI Message card */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 p-4 text-white">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 shrink-0 mt-0.5 text-purple-200" />
              <p className="text-sm leading-relaxed">{data.ai_message}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-card border border-border p-3 text-center">
              <p className="text-xl font-bold text-foreground">{data.current_average.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Average %</p>
            </div>
            <div className={`rounded-2xl border p-3 text-center ${attendanceColor}`}>
              <p className="text-sm font-bold leading-tight">{data.attendance_status}</p>
              <p className="text-[10px] mt-0.5 opacity-70">Attendance</p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-3 text-center">
              <div className={`flex items-center justify-center gap-1 ${trendColor}`}>
                <TrendIcon className="h-4 w-4" />
                <span className="text-sm font-bold">
                  {data.percentage_change > 0 ? '+' : ''}{data.percentage_change.toFixed(1)}%
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{data.overall_trend}</p>
            </div>
          </div>

          {/* Strengths */}
          {data.strengths.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Strengths
              </p>
              <div className="flex flex-wrap gap-2">
                {data.strengths.map(s => (
                  <span key={s} className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Weaknesses */}
          {data.weaknesses.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Needs Attention
              </p>
              <div className="flex flex-wrap gap-2">
                {data.weaknesses.map(s => (
                  <span key={s} className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Predicted grade */}
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
            <BookOpen className="h-4 w-4 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-700">Predicted Performance</p>
              <p className="text-xs text-amber-600 mt-0.5">{data.predicted_grade}</p>
            </div>
          </div>

          {/* Study tips */}
          {data.study_tips.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Study Tips</p>
              <div className="space-y-2">
                {data.study_tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-card border border-border rounded-xl px-3 py-2.5">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-foreground/80 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
