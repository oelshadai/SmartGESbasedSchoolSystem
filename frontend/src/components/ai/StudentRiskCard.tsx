import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import RiskBadge from './RiskBadge';
import ai, { RiskProfile } from '@/services/aiService';

interface Props {
  studentId: number;
  studentName: string;
  termId: number;
}

export default function StudentRiskCard({ studentId, studentName, termId }: Props) {
  const [data, setData] = useState<RiskProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ai.getRiskProfile(studentId, termId);
      setData(result as unknown as RiskProfile);
    } catch (e: any) {
      setError(e.message || 'Failed to load risk profile');
    } finally {
      setLoading(false);
    }
  };

  const scoreBar = (label: string, value: number, color: string) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-foreground/70">
        <span>{label}</span>
        <span>{value.toFixed(0)}%</span>
      </div>
      <Progress value={value} className={`h-2 ${color}`} />
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm font-semibold">{studentName}</CardTitle>
          <div className="flex items-center gap-2">
            {data && <RiskBadge level={data.risk_level} />}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={load} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!data && !loading && (
          <Button variant="outline" size="sm" className="w-full" onClick={load}>
            Analyse Risk
          </Button>
        )}

        {loading && (
          <div className="text-center text-sm text-foreground/60 py-4">Analysing…</div>
        )}

        {error && (
          <div className="text-destructive text-xs bg-destructive/10 rounded-md px-3 py-2">{error}</div>
        )}

        {data && (
          <>
            <div className="space-y-2">
              {scoreBar('Attendance', data.attendance_score, '[&>div]:bg-blue-500')}
              {scoreBar('Academic', data.academic_score, '[&>div]:bg-purple-500')}
              {scoreBar('Fee Status', data.fee_score, '[&>div]:bg-emerald-500')}
            </div>

            {data.risk_factors.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground/70 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" /> Risk Factors
                </p>
                <ul className="space-y-0.5">
                  {data.risk_factors.map((f, i) => (
                    <li key={i} className="text-xs text-foreground/80 pl-4 before:content-['•'] before:-ml-3 before:mr-1">{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.recommendations.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground/70 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" /> Recommendations
                </p>
                <ul className="space-y-0.5">
                  {data.recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-foreground/80 pl-4 before:content-['→'] before:-ml-4 before:mr-1">{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
