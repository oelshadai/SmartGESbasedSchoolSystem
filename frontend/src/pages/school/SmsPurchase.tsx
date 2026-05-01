import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, CreditCard, CheckCircle2, XCircle, RefreshCw, Loader2, Zap } from 'lucide-react';
import secureApiClient from '@/lib/secureApiClient';

interface Bundle {
  id: number;
  name: string;
  sms_units: number;
  amount_ghs: string;
}

interface PurchaseOrder {
  id: number;
  sms_units: number;
  amount_ghs: string;
  status: string;
  paystack_reference: string;
  requested_by_name: string;
  credited_at: string | null;
  created_at: string;
}

interface PageData {
  sms_balance: number;
  sms_price_per_unit: string;
  bundles: Bundle[];
  orders: PurchaseOrder[];
}

const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid:    'bg-green-100 text-green-800 border-green-200',
  failed:  'bg-red-100 text-red-800 border-red-200',
};

const SmsPurchase = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<number | null>(null);   // bundle id being paid
  const [customUnits, setCustomUnits] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [payingCustom, setPayingCustom] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const PRICE_PER_UNIT = 0.10;

  const handleCustomUnitsChange = (val: string) => {
    setCustomUnits(val);
    const n = parseInt(val);
    if (!isNaN(n) && n > 0) {
      setCustomAmount((n * PRICE_PER_UNIT).toFixed(2));
    } else {
      setCustomAmount('');
    }
  };

  const handleCustomAmountChange = (val: string) => {
    setCustomAmount(val);
    const a = parseFloat(val);
    if (!isNaN(a) && a > 0) {
      setCustomUnits(String(Math.floor(a / PRICE_PER_UNIT)));
    } else {
      setCustomUnits('');
    }
  };

  const handleBuyCustom = async () => {
    const units = parseInt(customUnits);
    if (isNaN(units) || units < 10) {
      setResult({ success: false, message: 'Minimum purchase is 10 SMS units.' });
      return;
    }
    setPayingCustom(true);
    try {
      const res = await secureApiClient.post('/schools/sms-purchase/initiate/', { custom_units: units }) as any;
      if (res?.authorization_url) {
        window.location.href = res.authorization_url;
      } else {
        setResult({ success: false, message: res?.error || 'Could not initiate payment.' });
      }
    } catch (err: any) {
      setResult({ success: false, message: err?.message || 'Payment initiation failed.' });
    } finally {
      setPayingCustom(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await secureApiClient.get('/schools/sms-purchase/') as PageData;
      setData(res);
    } catch {
      // handled below
    } finally {
      setLoading(false);
    }
  };

  // Verify Paystack callback on page load
  useEffect(() => {
    const ref = searchParams.get('paystack_ref');
    if (!ref) {
      fetchData();
      return;
    }
    // Remove param from URL immediately
    setSearchParams({}, { replace: true });
    setVerifying(true);
    (async () => {
      try {
        const res = await secureApiClient.get(`/schools/sms-purchase/verify/?reference=${encodeURIComponent(ref)}`) as any;
        setResult({
          success: !!res.success,
          message: res.message || (res.success ? 'Credits added successfully!' : 'Payment not successful.'),
        });
      } catch {
        setResult({ success: false, message: 'Could not verify payment. Please contact support.' });
      } finally {
        setVerifying(false);
        fetchData();
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBuyBundle = async (bundle: Bundle) => {
    setPaying(bundle.id);
    try {
      const res = await secureApiClient.post('/schools/sms-purchase/initiate/', { bundle_id: bundle.id }) as any;
      if (res?.authorization_url) {
        window.location.href = res.authorization_url;
      } else {
        setResult({ success: false, message: res?.error || 'Could not initiate payment.' });
      }
    } catch (err: any) {
      setResult({ success: false, message: err?.message || 'Payment initiation failed.' });
    } finally {
      setPaying(null);
    }
  };

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground animate-fade-in">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Verifying your payment…</p>
      </div>
    );
  }

  if (loading || !data) {
    return <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Purchase SMS Credits</h1>
        <p className="text-muted-foreground mt-1">
          Buy SMS units to send attendance alerts, fee reminders, and announcements to parents.
          GHS {data.sms_price_per_unit} per SMS unit.
        </p>
      </div>

      {/* Payment result banner */}
      {result && (
        <div className={`rounded-lg border px-4 py-3 flex items-center gap-3 text-sm font-medium ${
          result.success
            ? 'border-green-300 bg-green-50 text-green-800'
            : 'border-red-300 bg-red-50 text-red-800'
        }`}>
          {result.success
            ? <CheckCircle2 className="h-5 w-5 shrink-0" />
            : <XCircle className="h-5 w-5 shrink-0" />}
          {result.message}
          <button className="ml-auto text-xs underline opacity-70" onClick={() => setResult(null)}>Dismiss</button>
        </div>
      )}

      {/* Current balance */}
      <div className="stat-card flex items-center gap-4">
        <div className="p-3 rounded-full bg-info/10">
          <MessageSquare className="h-6 w-6 text-info" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Current SMS Balance</p>
          <p className={`text-3xl font-bold ${data.sms_balance === 0 ? 'text-destructive' : 'text-foreground'}`}>
            {data.sms_balance.toLocaleString()}
            <span className="text-base font-normal text-muted-foreground ml-1">SMS units</span>
          </p>
          {data.sms_balance === 0 && (
            <p className="text-xs text-destructive mt-0.5">Your school has no SMS credits — SMS notifications are paused.</p>
          )}
        </div>
        <Button variant="outline" size="sm" className="ml-auto" onClick={fetchData}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {/* ── PRIMARY: Custom amount entry ─────────────────────────────────── */}
      <div className="stat-card space-y-5 border-primary/30">
        <div>
          <h2 className="text-lg font-semibold">How many SMS units do you need?</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Type the number of SMS units or the GHS amount — the other field updates automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Units input */}
          <div className="space-y-1.5">
            <Label htmlFor="custom-units" className="text-sm font-medium">
              Number of SMS Units
            </Label>
            <Input
              id="custom-units"
              type="number"
              min={10}
              placeholder="e.g. 500"
              value={customUnits}
              onChange={e => handleCustomUnitsChange(e.target.value)}
              className="text-lg h-11"
            />
            <p className="text-xs text-muted-foreground">Minimum: 10 units</p>
          </div>

          {/* GHS input */}
          <div className="space-y-1.5">
            <Label htmlFor="custom-amount" className="text-sm font-medium">
              Amount to Pay (GHS)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">GHS</span>
              <Input
                id="custom-amount"
                type="number"
                min={1}
                step={0.1}
                placeholder="e.g. 50.00"
                value={customAmount}
                onChange={e => handleCustomAmountChange(e.target.value)}
                className="text-lg h-11 pl-12"
              />
            </div>
            <p className="text-xs text-muted-foreground">GHS {PRICE_PER_UNIT.toFixed(2)} per unit</p>
          </div>
        </div>

        {/* Live summary */}
        {customUnits && parseInt(customUnits) >= 10 && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-semibold text-foreground">{parseInt(customUnits).toLocaleString()} SMS units</span>
              <span className="text-muted-foreground mx-2">→</span>
              <span className="font-bold text-primary text-base">GHS {(parseInt(customUnits) * PRICE_PER_UNIT).toFixed(2)}</span>
            </div>
            <Button
              onClick={handleBuyCustom}
              disabled={payingCustom}
              size="sm"
            >
              {payingCustom
                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Redirecting…</>
                : <><CreditCard className="h-3.5 w-3.5 mr-1.5" /> Pay Now</>}
            </Button>
          </div>
        )}
        {customUnits && parseInt(customUnits) < 10 && (
          <p className="text-xs text-destructive">Minimum is 10 SMS units (GHS {(10 * PRICE_PER_UNIT).toFixed(2)}).</p>
        )}
        {!customUnits && (
          <Button
            onClick={handleBuyCustom}
            disabled={true}
            className="w-full sm:w-auto"
          >
            <CreditCard className="h-4 w-4 mr-2" /> Enter units above to proceed
          </Button>
        )}
      </div>

      {/* ── Quick-select bundles ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Quick Select a Bundle</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {data.bundles.map(bundle => (
            <button
              key={bundle.id}
              onClick={() => { handleBuyBundle(bundle); }}
              disabled={paying !== null}
              className="stat-card flex flex-col items-center gap-2 py-4 text-center hover:border-primary/60 hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <p className="text-xl font-bold text-foreground">{bundle.sms_units.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">SMS units</p>
              <p className="text-sm font-semibold text-primary">GHS {bundle.amount_ghs}</p>
              {paying === bundle.id && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Payments are processed securely via Paystack (Card, MoMo, etc.). Credits are added instantly upon successful payment.
        </p>
      </div>

      {/* Purchase history */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Purchase History</h2>
        {data.orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No purchases yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="text-left px-4 py-2 font-medium">Units</th>
                  <th className="text-left px-4 py-2 font-medium">Amount (GHS)</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map(order => (
                  <tr key={order.id} className="border-t hover:bg-muted/20">
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 font-medium">{order.sms_units.toLocaleString()}</td>
                    <td className="px-4 py-2">{order.amount_ghs}</td>
                    <td className="px-4 py-2">
                      <Badge variant="outline" className={statusBadge[order.status] || ''}>
                        {order.status === 'paid' ? 'Paid ✓' : order.status === 'pending' ? 'Pending' : 'Failed'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground font-mono">
                      {order.paystack_reference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmsPurchase;
