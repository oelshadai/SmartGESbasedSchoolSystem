import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { secureApiClient } from '@/lib/secureApiClient';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DollarSign, CalendarDays, TrendingDown, CheckCircle2,
  AlertCircle, Clock, Loader2, ArrowLeft, ExternalLink,
  XCircle, CreditCard, Wallet,
} from 'lucide-react';

// ─── types ────────────────────────────────────────────────────────────────────

interface BillItem {
  id: number;
  type: 'term' | 'weekly';
  fee_type: string;
  fee_type_id: number;
  collection_frequency: string;
  period: string;
  amount_billed: number;
  amount_paid: number;
  balance: number;
  status: string;
  due_date: string | null;
}

interface BillsResponse {
  student: { id: number; name: string; student_id: string; class: string };
  bills: BillItem[];
  summary: {
    total_outstanding: number;
    total_paid: number;
    online_payments_enabled: boolean;
  };
}

interface PaymentResponse {
  authorization_url: string;
  reference: string;
  amount: number;
  bill_type: string;
  public_key: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `GH₵ ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_STYLE: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700 border-green-200',
  PARTIAL: 'bg-amber-100 text-amber-700 border-amber-200',
  UNPAID: 'bg-red-100 text-red-700 border-red-200',
  WAIVED: 'bg-gray-100 text-foreground border-gray-200',
};

const STATUS_ICON: Record<string, JSX.Element> = {
  PAID: <CheckCircle2 className="h-3.5 w-3.5" />,
  PARTIAL: <Clock className="h-3.5 w-3.5" />,
  UNPAID: <AlertCircle className="h-3.5 w-3.5" />,
  WAIVED: <CheckCircle2 className="h-3.5 w-3.5" />,
};

// ─── component ────────────────────────────────────────────────────────────────

const StudentPaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<BillsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingBillId, setPayingBillId] = useState<number | null>(null);
  const [payingBillType, setPayingBillType] = useState<string>('');
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [paymentResult, setPaymentResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchBills = () =>
    secureApiClient
      .get<BillsResponse>('/fees/student-payments/my-bills/')
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load bills'));

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchBills().finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  // Handle Paystack callback
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (!ref || !isAuthenticated) return;
    setSearchParams((prev) => { prev.delete('ref'); return prev; }, { replace: true });
    secureApiClient
      .get<{ success?: boolean; already_recorded?: boolean; bill_status?: string; amount_paid?: number }>(
        `/fees/student-payments/verify/?reference=${encodeURIComponent(ref)}`
      )
      .then((r) => {
        if (r.success || r.already_recorded) {
          setPaymentResult({ success: true, message: 'Payment successful! Your bill has been updated.' });
          fetchBills();
        } else {
          setPaymentResult({ success: false, message: 'Payment could not be verified. Please contact your school.' });
        }
      })
      .catch(() => {
        setPaymentResult({ success: false, message: 'Payment verification failed. Please contact your school.' });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePay = async (bill: BillItem) => {
    setPayingBillId(bill.id);
    setPayingBillType(bill.type);
    try {
      const amountStr = customAmounts[`${bill.type}-${bill.id}`];
      const amount = amountStr ? parseFloat(amountStr) : undefined;
      const body: Record<string, unknown> = {
        bill_id: bill.id,
        bill_type: bill.type,
      };
      if (amount && amount > 0 && amount <= bill.balance) {
        body.amount = amount;
      }
      const result = await secureApiClient.post<PaymentResponse>(
        '/fees/student-payments/pay/',
        body
      );
      window.location.href = result.authorization_url;
    } catch (e: any) {
      setPaymentResult({
        success: false,
        message: e?.response?.data?.error || e.message || 'Payment initiation failed.',
      });
      setPayingBillId(null);
      setPayingBillType('');
    }
  };

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
        <div className="mt-4">
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">Retry</Button>
        </div>
      </div>
    );
  }

  const { bills, summary } = data;
  const outstandingBills = bills.filter(b => b.status !== 'PAID' && b.status !== 'WAIVED');
  const paidBills = bills.filter(b => b.status === 'PAID' || b.status === 'WAIVED');

  return (
    <div className="min-w-0 w-full max-w-full space-y-5 p-3 sm:p-6 animate-fade-in overflow-x-hidden">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/student/bills')} className="h-8 gap-1 shrink-0">
          <ArrowLeft className="h-4 w-4" /> Back to Bills
        </Button>
      </div>

      {/* Payment result banner */}
      {paymentResult && (
        <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
          paymentResult.success
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {paymentResult.success
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <XCircle className="h-4 w-4 shrink-0" />}
          <span className="flex-1 min-w-0 break-words">{paymentResult.message}</span>
          <button onClick={() => setPaymentResult(null)} className="opacity-60 hover:opacity-100 shrink-0">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Page heading */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold break-words">Pay Fees Online</h1>
        <p className="text-sm text-muted-foreground mt-0.5 break-words">
          {data.student.name} · {data.student.class}
        </p>
      </div>

      {/* Online payments disabled */}
      {!summary.online_payments_enabled && (
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="min-w-0">Online payments are not enabled for students at your school. Please contact the school office to pay your fees.</span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4 text-blue-600" /> Total Outstanding
            </div>
            <div className="text-lg font-bold text-red-600">{fmt(summary.total_outstanding)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Total Paid
            </div>
            <div className="text-lg font-bold text-green-600">{fmt(summary.total_paid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <CreditCard className="h-4 w-4 text-indigo-600" /> Bills
            </div>
            <div className="text-lg font-bold">{bills.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding bills */}
      {outstandingBills.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4 text-amber-500" /> Outstanding Bills
          </h2>
          <div className="space-y-3">
            {outstandingBills.map((bill) => (
              <Card key={`${bill.type}-${bill.id}`} className="border-l-4 border-l-amber-400">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm flex items-center gap-2">
                        {bill.fee_type}
                        <Badge className={`text-xs border ${STATUS_STYLE[bill.status]}`}>
                          {STATUS_ICON[bill.status]} {bill.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {bill.period}
                        {bill.collection_frequency === 'WEEKLY' && ' · Weekly Fee'}
                        {bill.collection_frequency === 'TERM' && ' · Term Fee'}
                        {bill.collection_frequency === 'YEAR' && ' · Annual Fee'}
                      </div>
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
                    </div>
                    <div className="text-right shrink-0 space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Balance: </span>
                        <span className="font-bold text-red-600">{fmt(bill.balance)}</span>
                      </div>

                      {/* Custom amount input */}
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">GH₵</span>
                          <Input
                            className="h-8 w-28 pl-8 text-sm"
                            type="number"
                            min={1}
                            max={bill.balance}
                            step={0.5}
                            placeholder={`${bill.balance}`}
                            value={customAmounts[`${bill.type}-${bill.id}`] || ''}
                            onChange={(e) => setCustomAmounts(prev => ({
                              ...prev,
                              [`${bill.type}-${bill.id}`]: e.target.value,
                            }))}
                          />
                        </div>
                        <Button
                          size="sm"
                          className="h-8 gap-1"
                          disabled={payingBillId === bill.id || !summary.online_payments_enabled}
                          onClick={() => handlePay(bill)}
                        >
                          {payingBillId === bill.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <ExternalLink className="h-3 w-3" />}
                          Pay
                        </Button>
                      </div>
                      {customAmounts[`${bill.type}-${bill.id}`] && (
                        <div className="text-[10px] text-muted-foreground">
                          Custom amount entered
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Paid bills */}
      {paidBills.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" /> Paid / Waived Bills
          </h2>
          <div className="space-y-2">
            {paidBills.map((bill) => (
              <Card key={`${bill.type}-${bill.id}`} className="opacity-60">
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm">{bill.fee_type}</div>
                    <div className="text-xs text-muted-foreground">{bill.period}</div>
                  </div>
                  <Badge className={`text-xs border ${STATUS_STYLE[bill.status]}`}>
                    {STATUS_ICON[bill.status]} {bill.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {bills.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center text-muted-foreground">
            <DollarSign className="h-10 w-10 opacity-30" />
            <p>No fee bills found for your account.</p>
            <p className="text-sm">Contact your school admin if you think this is a mistake.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentPaymentPage;