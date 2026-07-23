import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, TrendingUp } from 'lucide-react';
import { secureApiClient as api } from '@/lib/secureApiClient';

interface Income {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  received_from: string;
  payment_method: string;
}

export default function IncomeTracking() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: 'TUITION',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    received_from: '',
    payment_method: 'CASH',
  });

  useEffect(() => { fetchIncomes(); }, []);

  const fetchIncomes = async () => {
    try {
      const response = await api.get('/schools/financial/income/');
      setIncomes(Array.isArray(response) ? response : response?.results || response?.data || []);
    } catch { setIncomes([]); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/schools/financial/income/', formData);
      fetchIncomes();
      resetForm();
    } catch (error) { console.error('Failed to create income:', error); }
  };

  const resetForm = () => {
    setFormData({ category: 'TUITION', description: '', amount: '', date: new Date().toISOString().split('T')[0], received_from: '', payment_method: 'CASH' });
    setShowForm(false);
  };

  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="theme-page-title">Income Tracking</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor all revenue sources</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="theme-button w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Income
        </Button>
      </div>

      {/* KPI */}
      <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
          <div className="p-2 bg-green-500/10 rounded-full">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-green-600">₵{totalIncome.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">{incomes.length} record{incomes.length !== 1 ? 's' : ''}</p>
        </CardContent>
      </Card>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="theme-card-title">Add New Income</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 theme-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="TUITION">Tuition Fees</option>
                <option value="REGISTRATION">Registration</option>
                <option value="DONATIONS">Donations</option>
                <option value="GRANTS">Grants</option>
                <option value="OTHER">Other</option>
              </select>
              <Input placeholder="Received From" value={formData.received_from} onChange={(e) => setFormData({ ...formData, received_from: e.target.value })} className="theme-input" />
              <Input type="number" placeholder="Amount" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="theme-input" required />
              <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="theme-input" required />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 theme-input"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
              </select>
              <Input placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="theme-input sm:col-span-2" required />
              <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="theme-button w-full sm:w-auto">Save</Button>
                <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto">Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="theme-card-title flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Income Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="theme-table-header text-left p-2">Date</th>
                  <th className="theme-table-header text-left p-2">Category</th>
                  <th className="theme-table-header text-left p-2">Description</th>
                  <th className="theme-table-header text-left p-2">Received From</th>
                  <th className="theme-table-header text-left p-2">Method</th>
                  <th className="theme-table-header text-right p-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {incomes.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No income records yet.</td></tr>
                ) : incomes.map((income) => (
                  <tr key={income.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="theme-table-cell p-2">{new Date(income.date).toLocaleDateString()}</td>
                    <td className="theme-table-cell p-2">{income.category}</td>
                    <td className="theme-table-cell p-2">{income.description}</td>
                    <td className="theme-table-cell p-2">{income.received_from}</td>
                    <td className="theme-table-cell p-2">{income.payment_method}</td>
                    <td className="theme-table-cell text-right p-2 font-bold text-green-600">₵{Number(income.amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">Income Records</h2>
        {incomes.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No income records yet.</CardContent></Card>
        ) : incomes.map((income) => (
          <Card key={income.id}>
            <CardContent className="pt-4 pb-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{income.description}</p>
                  <p className="text-xs text-muted-foreground">{income.category} · {new Date(income.date).toLocaleDateString()}</p>
                </div>
                <p className="text-lg font-bold text-green-600 shrink-0">₵{Number(income.amount).toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>From: <span className="text-foreground font-medium">{income.received_from || '—'}</span></span>
                <span>{income.payment_method}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
