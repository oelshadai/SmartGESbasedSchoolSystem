import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, DollarSign, X } from 'lucide-react';
import { secureApiClient as api } from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';

interface PayrollRecord {
  id: number;
  staff_name: string;
  month: number;
  year: number;
  payroll_frequency?: 'MONTHLY' | 'WEEKLY';
  period_start?: string | null;
  period_end?: string | null;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  status: string;
  payment_date: string | null;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function PayrollManagement() {
  const { toast } = useToast();
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [recordFilter, setRecordFilter] = useState<'ALL' | 'MONTHLY' | 'WEEKLY'>('ALL');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  // inline mark-paid state
  const [markPaidId, setMarkPaidId] = useState<number | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [frequency, setFrequency] = useState<'MONTHLY' | 'WEEKLY'>('MONTHLY');
  const [periodStart, setPeriodStart] = useState(new Date().toISOString().split('T')[0]);
  const [periodEnd, setPeriodEnd] = useState(new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0]);

  useEffect(() => { fetchPayroll(); }, []);
  useEffect(() => {
    api.get('/schools/settings/').then((settings: any) => setFrequency(settings.payroll_frequency || 'MONTHLY')).catch(() => undefined);
  }, []);

  const fetchPayroll = async () => {
    try {
      const response = await api.get('/schools/financial/payroll/');
      setPayroll(Array.isArray(response) ? response : response?.results || []);
    } catch { setPayroll([]); }
  };

  const generatePayroll = async () => {
    setGenerating(true);
    try {
      const result = frequency === 'WEEKLY'
        ? await api.post('/schools/financial/payroll/generate_weekly/', { period_start: periodStart, period_end: periodEnd })
        : await api.post('/schools/financial/payroll/generate_monthly/', { month, year });
      fetchPayroll();
      toast({ title: 'Payroll generated', description: `Created: ${result.created}, Skipped: ${result.skipped}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to generate payroll', variant: 'destructive' });
    } finally { setGenerating(false); }
  };

  const approvePayroll = async (id: number) => {
    try {
      await api.post(`/schools/financial/payroll/${id}/approve/`);
      fetchPayroll();
      toast({ title: 'Approved', description: 'Payroll record approved' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to approve', variant: 'destructive' });
    }
  };

  const confirmMarkPaid = async () => {
    if (!markPaidId) return;
    try {
      await api.post(`/schools/financial/payroll/${markPaidId}/mark_paid/`, {
        payment_date: paymentDate,
        payment_method: paymentMethod,
      });
      fetchPayroll();
      toast({ title: 'Marked as paid', description: `Payment recorded on ${paymentDate}` });
      setMarkPaidId(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to mark as paid', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'APPROVED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-foreground/60';
    }
  };

  const getRecordFrequency = (record: PayrollRecord) =>
    record.payroll_frequency || (record.period_start && record.period_end ? 'WEEKLY' : 'MONTHLY');
  const visiblePayroll = payroll.filter(record => recordFilter === 'ALL' || getRecordFrequency(record) === recordFilter);
  const countByFrequency = (filter: 'MONTHLY' | 'WEEKLY') =>
    payroll.filter(record => getRecordFrequency(record) === filter).length;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="theme-page-title">Payroll Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Generate and manage staff payroll</p>
      </div>

      {/* Mark Paid inline modal */}
      {markPaidId && (
        <Card className="border-blue-500/40 bg-blue-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="theme-card-title text-base">Mark as Paid</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setMarkPaidId(null)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Payment Date</label>
                <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="theme-input" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Payment Method</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 theme-input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                </select>
              </div>
              <Button onClick={confirmMarkPaid} className="theme-button w-full sm:w-auto">
                <CheckCircle className="h-4 w-4 mr-2" /> Confirm Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate card */}
      <Card>
        <CardHeader>
          <CardTitle className="theme-card-title">Generate {frequency === 'WEEKLY' ? 'Weekly' : 'Monthly'} Payroll</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div className="min-w-0">
              <label className="theme-label block mb-1.5 text-sm">Pay frequency</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 theme-input" value={frequency} onChange={async (e) => {
                const value = e.target.value as 'MONTHLY' | 'WEEKLY';
                try { await api.patch('/schools/settings/', { payroll_frequency: value }); setFrequency(value); }
                catch (error: any) { toast({ title: 'Error', description: error.message || 'Failed to save payroll frequency', variant: 'destructive' }); }
              }}>
                <option value="MONTHLY">Monthly</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>
            {frequency === 'WEEKLY' ? (
              <>
                <div className="min-w-0"><label className="theme-label block mb-1.5 text-sm">Period start</label><Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="theme-input min-w-0" /></div>
                <div className="min-w-0"><label className="theme-label block mb-1.5 text-sm">Period end</label><Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="theme-input min-w-0" /></div>
              </>
            ) : (
              <>
                <div className="min-w-0"><label className="theme-label block mb-1.5 text-sm">Month</label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 theme-input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>{monthNames.map((name, idx) => <option key={idx} value={idx + 1}>{name}</option>)}</select></div>
                <div className="min-w-0"><label className="theme-label block mb-1.5 text-sm">Year</label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 theme-input" value={year} onChange={(e) => setYear(Number(e.target.value))}>{[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
              </>
            )}
            <Button onClick={generatePayroll} disabled={generating} className="theme-button w-full min-w-0 sm:col-span-2 lg:col-span-1"><DollarSign className="h-4 w-4 mr-2" />{generating ? 'Generating...' : 'Generate Payroll'}</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter payroll records">
        <span className="text-sm font-semibold text-foreground mr-1">Payroll records:</span>
        {(['ALL', 'MONTHLY', 'WEEKLY'] as const).map(filter => (
          <Button key={filter} size="sm" variant={recordFilter === filter ? 'default' : 'outline'} onClick={() => setRecordFilter(filter)} className={recordFilter === filter ? 'theme-button' : ''}>
            {filter === 'ALL' ? `All (${payroll.length})` : `${filter[0]}${filter.slice(1).toLowerCase()} (${countByFrequency(filter)})`}
          </Button>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="theme-card-title">Payroll Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="theme-table-header text-left p-2">Staff</th>
                  <th className="theme-table-header text-left p-2">Period</th>
                  <th className="theme-table-header text-right p-2">Basic</th>
                  <th className="theme-table-header text-right p-2">Allowances</th>
                  <th className="theme-table-header text-right p-2">Deductions</th>
                  <th className="theme-table-header text-right p-2">Net Salary</th>
                  <th className="theme-table-header text-left p-2">Status</th>
                  <th className="theme-table-header text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payroll.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground text-sm">No payroll records yet.</td></tr>
                ) : visiblePayroll.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground text-sm">No records match this filter.</td></tr>
                ) : visiblePayroll.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="theme-table-cell p-2">{record.staff_name}</td>
                    <td className="theme-table-cell p-2">
                      {getRecordFrequency(record) === 'WEEKLY' && record.period_start && record.period_end
                        ? `${record.period_start} to ${record.period_end}`
                        : `${monthNames[record.month - 1]} ${record.year}`}
                    </td>
                    <td className="theme-table-cell text-right p-2">₵{Number(record.basic_salary).toLocaleString()}</td>
                    <td className="theme-table-cell text-right p-2">₵{Number(record.allowances).toLocaleString()}</td>
                    <td className="theme-table-cell text-right p-2">₵{Number(record.deductions).toLocaleString()}</td>
                    <td className="theme-table-cell text-right p-2 font-bold">₵{Number(record.net_salary).toLocaleString()}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(record.status)}`}>{record.status}</span>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        {record.status === 'DRAFT' && (
                          <Button size="sm" onClick={() => approvePayroll(record.id)} className="theme-button whitespace-normal break-words leading-snug">Approve</Button>
                        )}
                        {record.status === 'APPROVED' && (
                          <Button size="sm" onClick={() => { setMarkPaidId(record.id); setPaymentDate(new Date().toISOString().split('T')[0]); }} className="theme-button whitespace-normal break-words leading-snug">
                            <CheckCircle className="h-4 w-4 mr-1" /> Mark Paid
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">Payroll Records</h2>
        {visiblePayroll.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No payroll records yet.</CardContent></Card>
        ) : visiblePayroll.map((record) => (
          <Card key={record.id}>
            <CardContent className="pt-4 pb-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{record.staff_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getRecordFrequency(record) === 'WEEKLY' && record.period_start && record.period_end
                      ? `${record.period_start} to ${record.period_end}`
                      : `${monthNames[record.month - 1]} ${record.year}`}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 ${getStatusColor(record.status)}`}>{record.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/40 rounded p-2">
                  <p className="text-xs text-muted-foreground">Basic</p>
                  <p className="text-sm font-semibold">₵{Number(record.basic_salary).toLocaleString()}</p>
                </div>
                <div className="bg-muted/40 rounded p-2">
                  <p className="text-xs text-muted-foreground">Allowances</p>
                  <p className="text-sm font-semibold text-green-600">+₵{Number(record.allowances).toLocaleString()}</p>
                </div>
                <div className="bg-muted/40 rounded p-2">
                  <p className="text-xs text-muted-foreground">Deductions</p>
                  <p className="text-sm font-semibold text-red-600">-₵{Number(record.deductions).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Net Salary</span>
                <span className="text-lg font-bold">₵{Number(record.net_salary).toLocaleString()}</span>
              </div>
              {(record.status === 'DRAFT' || record.status === 'APPROVED') && (
                <div className="pt-1">
                  {record.status === 'DRAFT' && (
                    <Button size="sm" onClick={() => approvePayroll(record.id)} className="theme-button w-full">Approve</Button>
                  )}
                  {record.status === 'APPROVED' && (
                    <Button size="sm" onClick={() => { setMarkPaidId(record.id); setPaymentDate(new Date().toISOString().split('T')[0]); }} className="theme-button w-full">
                      <CheckCircle className="h-4 w-4 mr-1" /> Mark Paid
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
