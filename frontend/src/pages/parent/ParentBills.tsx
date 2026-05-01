import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, DollarSign, ArrowRight, CheckCircle2, AlertCircle, TrendingDown, Loader2, Receipt } from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';

interface ChildInfo { student_id: string; name: string; relationship: string; }

interface FeeSummary {
  total_billed: number;
  total_paid_bills: number;
  total_balance: number;
  total_daily_paid: number;
  grand_total_paid: number;
}

const fmt = (n: number) => `GH₵ ${n.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;

const ParentBills = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const children: ChildInfo[] = (user as any)?.children || [];
  const [feeSummaries, setFeeSummaries] = useState<Record<string, FeeSummary>>({});
  const [loadingFees, setLoadingFees] = useState(true);

  useEffect(() => {
    if (children.length === 0) { setLoadingFees(false); return; }
    Promise.all(
      children.map(async (c) => {
        try {
          const data = await secureApiClient.get<any>(`/fees/term-bills/my-bills/?student_id=${c.student_id}`);
          return { id: c.student_id, summary: data?.summary as FeeSummary | undefined };
        } catch { return { id: c.student_id, summary: undefined }; }
      })
    ).then((results) => {
      const map: Record<string, FeeSummary> = {};
      results.forEach(r => { if (r.summary) map[r.id] = r.summary; });
      setFeeSummaries(map);
    }).finally(() => setLoadingFees(false));
  }, []);

  if (children.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Bills</h1>
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">
          No children linked to your account.
        </CardContent></Card>
      </div>
    );
  }

  if (children.length === 1) {
    navigate(`/parent/bills/${children[0].student_id}`, { replace: true });
    return null;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Receipt className="h-6 w-6 text-amber-500" /> Bills &amp; Fees</h1>
        <p className="text-muted-foreground text-sm mt-1">Fee overview for all your children</p>
      </div>

      {/* Overall summary */}
      {!loadingFees && Object.keys(feeSummaries).length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: 'Total Paid',
              value: fmt(Object.values(feeSummaries).reduce((s, f) => s + f.grand_total_paid, 0)),
              color: 'text-green-600',
              icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
            },
            {
              label: 'Total Billed',
              value: fmt(Object.values(feeSummaries).reduce((s, f) => s + f.total_billed, 0)),
              color: 'text-blue-600',
              icon: <DollarSign className="h-4 w-4 text-blue-500" />,
            },
            {
              label: 'Outstanding',
              value: fmt(Object.values(feeSummaries).reduce((s, f) => s + f.total_balance, 0)),
              color: Object.values(feeSummaries).reduce((s, f) => s + f.total_balance, 0) > 0 ? 'text-red-600' : 'text-green-600',
              icon: <TrendingDown className={`h-4 w-4 ${Object.values(feeSummaries).reduce((s, f) => s + f.total_balance, 0) > 0 ? 'text-red-500' : 'text-green-500'}`} />,
            },
          ].map(c => (
            <Card key={c.label}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">{c.icon} {c.label}</div>
                <div className={`text-sm sm:text-base font-bold ${c.color}`}>{c.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {children.map(c => {
          const fees = feeSummaries[c.student_id];
          const hasBalance = fees && fees.total_balance > 0;
          return (
            <Card key={c.student_id}
              className={`hover:border-primary/50 transition-colors cursor-pointer ${hasBalance ? 'border-red-300/50' : ''}`}
              onClick={() => navigate(`/parent/bills/${c.student_id}`)}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <GraduationCap className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{c.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{c.student_id}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">{c.relationship}</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {loadingFees ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading fees…
                  </div>
                ) : fees ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-center rounded-lg bg-muted/40 p-2">
                      <div>
                        <div className="text-xs text-muted-foreground">Billed</div>
                        <div className="text-xs font-semibold text-foreground">{fmt(fees.total_billed)}</div>
                      </div>
                      <div className="border-x">
                        <div className="text-xs text-muted-foreground">Paid</div>
                        <div className="text-xs font-semibold text-green-600">{fmt(fees.grand_total_paid)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Balance</div>
                        <div className={`text-xs font-semibold ${hasBalance ? 'text-red-600' : 'text-green-600'}`}>{fmt(fees.total_balance)}</div>
                      </div>
                    </div>
                    {hasBalance && (
                      <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        Outstanding balance. Tap to view details.
                      </div>
                    )}
                    {!hasBalance && fees.total_billed > 0 && (
                      <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        All fees cleared!
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground py-2">Fee information not available.</div>
                )}
                <Button size="sm" variant="outline" className="w-full gap-1 mt-3 h-8 text-xs">
                  <DollarSign className="h-3.5 w-3.5" /> View Full Bills <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ParentBills;
