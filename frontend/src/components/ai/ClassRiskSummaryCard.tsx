import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, RefreshCw } from 'lucide-react';
import RiskBadge from './RiskBadge';
import ai, { ClassRiskSummary as Summary } from '@/services/aiService';

interface Props {
  classId: number;
  className: string;
  termId: number;
}

const LEVELS = ['HIGH', 'MEDIUM', 'LOW', 'EXCELLING'] as const;
const COLORS = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-green-500',
  EXCELLING: 'bg-blue-500',
} as const;

export default function ClassRiskSummaryCard({ classId, className, termId }: Props) {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ai.getClassRiskSummary(classId, termId);
      setData(result as unknown as Summary);
    } catch (e: any) {
      setError(e.message || 'Failed to load class risk summary');
    } finally {
      setLoading(false);
    }
  };

  const total = data ? data.students.length : 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-foreground/60" />
            {className} — Risk Overview
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!data && !loading && (
          <Button variant="outline" size="sm" className="w-full" onClick={load}>
            Analyse Class
          </Button>
        )}

        {loading && <div className="text-center text-sm text-foreground/60 py-4">Analysing {className}…</div>}
        {error && <div className="text-destructive text-xs bg-destructive/10 rounded-md px-3 py-2">{error}</div>}

        {data && (
          <>
            {/* Summary bar */}
            <div className="grid grid-cols-4 gap-2">
              {LEVELS.map(level => (
                <div key={level} className="text-center">
                  <div className={`text-lg font-bold ${data[level] > 0 ? 'text-foreground' : 'text-foreground/30'}`}>
                    {data[level]}
                  </div>
                  <div className={`h-1 rounded-full mt-1 ${data[level] > 0 ? COLORS[level] : 'bg-muted'}`} />
                  <div className="text-xs text-foreground/60 mt-1 leading-tight">
                    {level === 'EXCELLING' ? 'Excel' : level.charAt(0) + level.slice(1).toLowerCase()}
                  </div>
                </div>
              ))}
            </div>

            {/* Stacked progress bar */}
            {total > 0 && (
              <div className="flex h-2 rounded-full overflow-hidden gap-px">
                {LEVELS.map(level => data[level] > 0 && (
                  <div
                    key={level}
                    className={COLORS[level]}
                    style={{ width: `${(data[level] / total) * 100}%` }}
                  />
                ))}
              </div>
            )}

            {/* Student list toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs h-7"
              onClick={() => setExpanded(v => !v)}
            >
              {expanded ? 'Hide' : 'Show'} student breakdown ({total})
            </Button>

            {expanded && (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {data.students
                  .sort((a, b) => {
                    const order = { HIGH: 0, MEDIUM: 1, LOW: 2, EXCELLING: 3 };
                    return (order[a.risk_level as keyof typeof order] ?? 4) - (order[b.risk_level as keyof typeof order] ?? 4);
                  })
                  .map(s => (
                    <div key={s.id} className="flex items-center justify-between gap-2 py-1 px-2 rounded-md hover:bg-muted/50">
                      <span className="text-xs text-foreground truncate">{s.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-foreground/50">{s.academic_score.toFixed(0)}%</span>
                        <RiskBadge level={s.risk_level} />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
