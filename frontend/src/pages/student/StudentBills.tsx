import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { secureApiClient } from '@/lib/secureApiClient';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign, CalendarDays, TrendingDown, CheckCircle2,
  AlertCircle, Clock, Loader2, ChevronDown, ChevronUp, Receipt,
} from 'lucide-react';

// ─── types ────────────────────────────────────────────────────────────────────

interface TermBillItem {
  id: number;
  fee_type: string;
  fee_type_id: number;
  collection_frequency: string;
  term: string;
  term_id: number;
  academic_year: string;
  amount_billed: number;
  amount_paid: number;
  balance: number;
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'WAIVED';
  due_date: string | null;
}

interface DailyFeeItem {
  fee_type: string;
  fee_type_id: number;
  collection_frequency: string;
  days_paid: number;
  amount_per_day: number;
  total_paid: number;
  recent_payments: { date: string; amount: number }[];
}

interface BillsData {
  student: { id: number; name: string; student_id: string; class: string };
  term_bills: TermBillItem[];
  daily_fees: DailyFeeItem[];
  summary: {
    total_billed: number;
    total_paid_bills: number;
    total_balance: number;
    total_daily_paid: number;
    grand_total_paid: number;
  };
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `GH₵ ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_STYLE: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700 border-green-200',
  PARTIAL: 'bg-amber-100 text-amber-700 border-amber-200',
  UNPAID: 'bg-red-100 text-red-700 border-red-200',
  WAIVED: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_ICON: Record<string, JSX.Element> = {
  PAID: <CheckCircle2 className="h-3.5 w-3.5" />,
  PARTIAL: <Clock className="h-3.5 w-3.5" />,
  UNPAID: <AlertCircle className="h-3.5 w-3.5" />,
  WAIVED: <CheckCircle2 className="h-3.5 w-3.5" />,
};

// ─── component ────────────────────────────────────────────────────────────────

const StudentBills = ({ studentIdOverride }: { studentIdOverride?: string }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [data, setData] = useState<BillsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDaily, setExpandedDaily] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const params = studentIdOverride ? `?student_id=${studentIdOverride}` : '';
    secureApiClient
      .get<BillsData>(`/fees/term-bills/my-bills/${params}`)
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load bills'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate, studentIdOverride]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-red-500">
        {error || 'Failed to load bills'}
      </div>
    );
  }

  const { term_bills, daily_fees, summary } = data;

  // Group term bills by academic_year + term
  const grouped: Record<string, TermBillItem[]> = {};
  term_bills.forEach((b) => {
    const key = `${b.academic_year} — ${b.term} Term`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(b);
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 animate-fade-in">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold">My Bills &amp; Fees</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {data.student.name} · {data.student.class}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Billed', value: fmt(summary.total_billed), icon: <DollarSign className="h-4 w-4" />, color: 'text-blue-600' },
          { label: 'Total Paid', value: fmt(summary.grand_total_paid), icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-green-600' },
          { label: 'Balance Owing', value: fmt(summary.total_balance), icon: <TrendingDown className="h-4 w-4" />, color: summary.total_balance > 0 ? 'text-red-600' : 'text-green-600' },
          { label: 'Daily Fees Paid', value: fmt(summary.total_daily_paid), icon: <CalendarDays className="h-4 w-4" />, color: 'text-indigo-600' },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="p-3 sm:p-4">
              <div className={`flex items-center gap-1.5 text-xs text-muted-foreground mb-1`}>
                <span className={c.color}>{c.icon}</span>
                {c.label}
              </div>
              <div className={`text-lg font-bold ${c.color}`}>{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Term Bills grouped by period */}
      {Object.keys(grouped).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-500" /> Term / Year Fees
          </h2>
          {Object.entries(grouped).map(([period, bills]) => {
            const periodBilled = bills.reduce((s, b) => s + b.amount_billed, 0);
            const periodPaid = bills.reduce((s, b) => s + b.amount_paid, 0);
            const periodBalance = bills.reduce((s, b) => s + b.balance, 0);
            return (
              <Card key={period}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-sm font-semibold">{period}</CardTitle>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>Billed: <strong className="text-foreground">{fmt(periodBilled)}</strong></span>
                      <span>Paid: <strong className="text-green-600">{fmt(periodPaid)}</strong></span>
                      {periodBalance > 0 && (
                        <span>Due: <strong className="text-red-600">{fmt(periodBalance)}</strong></span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="space-y-2">
                    {bills.map((bill) => (
                      <div
                        key={bill.id}
                        className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{bill.fee_type}</div>
                          {bill.due_date && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Due: {new Date(bill.due_date).toLocaleDateString()}
                            </div>
                          )}
                          {/* Progress bar */}
                          <div className="mt-2 w-full max-w-xs bg-muted rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-green-500 transition-all"
                              style={{ width: `${bill.amount_billed > 0 ? Math.min(100, (bill.amount_paid / bill.amount_billed) * 100) : 0}%` }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {fmt(bill.amount_paid)} paid of {fmt(bill.amount_billed)}
                          </div>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <Badge className={`text-xs border ${STATUS_STYLE[bill.status]} flex items-center gap-1`}>
                            {STATUS_ICON[bill.status]} {bill.status}
                          </Badge>
                          {bill.balance > 0 && (
                            <div className="text-sm font-semibold text-red-600">{fmt(bill.balance)} owing</div>
                          )}
                          {bill.balance <= 0 && bill.status !== 'WAIVED' && (
                            <div className="text-xs text-green-600 font-medium">Fully paid</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Daily fees section */}
      {daily_fees.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-indigo-500" /> Daily Fees
          </h2>
          {daily_fees.map((df) => (
            <Card key={df.fee_type}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{df.fee_type}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {df.days_paid} day{df.days_paid !== 1 ? 's' : ''} paid · {fmt(df.amount_per_day)}/day
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-indigo-600">{fmt(df.total_paid)}</div>
                      <div className="text-xs text-muted-foreground">total paid</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setExpandedDaily(expandedDaily === df.fee_type ? null : df.fee_type)}
                    >
                      {expandedDaily === df.fee_type
                        ? <ChevronUp className="h-4 w-4" />
                        : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded recent payments */}
                {expandedDaily === df.fee_type && df.recent_payments.length > 0 && (
                  <div className="mt-3 border-t pt-3 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Recent payments</div>
                    {df.recent_payments.map((p, i) => (
                      <div key={i} className="flex justify-between text-xs text-muted-foreground px-1">
                        <span>{new Date(p.date).toLocaleDateString()}</span>
                        <span className="font-medium text-foreground">{fmt(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {term_bills.length === 0 && daily_fees.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center text-muted-foreground">
            <DollarSign className="h-10 w-10 opacity-30" />
            <p>No fee bills have been generated for you yet.</p>
            <p className="text-sm">Contact your school admin if you think this is a mistake.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentBills;
