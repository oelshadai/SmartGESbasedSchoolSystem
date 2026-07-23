import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, CheckCircle, XCircle, Receipt } from 'lucide-react';
import { secureApiClient as api } from '@/lib/secureApiClient';

interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: string;
  paid_to: string;
  payment_method: string;
}

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: 'UTILITIES',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paid_to: '',
    payment_method: 'CASH',
  });

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/schools/financial/expenses/');
      setExpenses(Array.isArray(response) ? response : response?.results || response?.data || []);
    } catch { setExpenses([]); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/schools/financial/expenses/', formData);
      fetchExpenses();
      resetForm();
    } catch (error) { console.error('Failed to create expense:', error); }
  };

  const approveExpense = async (id: number) => {
    const comments = prompt('Approval comments (optional):');
    try {
      await api.post(`/schools/financial/expenses/${id}/approve/`, { comments });
      fetchExpenses();
    } catch (error) { console.error('Failed to approve expense:', error); }
  };

  const rejectExpense = async (id: number) => {
    const comments = prompt('Rejection reason:');
    if (!comments) return;
    try {
      await api.post(`/schools/financial/expenses/${id}/reject/`, { comments });
      fetchExpenses();
    } catch (error) { console.error('Failed to reject expense:', error); }
  };

  const resetForm = () => {
    setFormData({ category: 'UTILITIES', description: '', amount: '', date: new Date().toISOString().split('T')[0], paid_to: '', payment_method: 'CASH' });
    setShowForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-foreground/60';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="theme-page-title">Expense Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Record and approve school expenditures</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="theme-button w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="theme-card-title">Add New Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 theme-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="UTILITIES">Utilities</option>
                <option value="SALARIES">Salaries</option>
                <option value="SUPPLIES">Supplies</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="TRANSPORT">Transport</option>
                <option value="OTHER">Other</option>
              </select>
              <Input placeholder="Paid To" value={formData.paid_to} onChange={(e) => setFormData({ ...formData, paid_to: e.target.value })} className="theme-input" />
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
            <Receipt className="h-5 w-5 text-orange-500" />
            Expense Records
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
                  <th className="theme-table-header text-left p-2">Paid To</th>
                  <th className="theme-table-header text-right p-2">Amount</th>
                  <th className="theme-table-header text-left p-2">Status</th>
                  <th className="theme-table-header text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">No expenses recorded yet.</td></tr>
                ) : expenses.map((expense) => (
                  <tr key={expense.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="theme-table-cell p-2">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="theme-table-cell p-2">{expense.category}</td>
                    <td className="theme-table-cell p-2">{expense.description}</td>
                    <td className="theme-table-cell p-2">{expense.paid_to}</td>
                    <td className="theme-table-cell text-right p-2 font-bold">₵{Number(expense.amount).toLocaleString()}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(expense.status)}`}>{expense.status}</span>
                    </td>
                    <td className="p-2">
                      {expense.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => approveExpense(expense.id)} className="theme-button"><CheckCircle className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => rejectExpense(expense.id)}><XCircle className="h-4 w-4" /></Button>
                        </div>
                      )}
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
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">Expense Records</h2>
        {expenses.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No expenses recorded yet.</CardContent></Card>
        ) : expenses.map((expense) => (
          <Card key={expense.id}>
            <CardContent className="pt-4 pb-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">{expense.category} · {new Date(expense.date).toLocaleDateString()}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 ${getStatusColor(expense.status)}`}>{expense.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Paid to</p>
                  <p className="text-sm font-medium">{expense.paid_to || '—'}</p>
                </div>
                <p className="text-lg font-bold text-red-600">₵{Number(expense.amount).toLocaleString()}</p>
              </div>
              {expense.status === 'PENDING' && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={() => approveExpense(expense.id)} className="theme-button flex-1">
                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => rejectExpense(expense.id)} className="flex-1">
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
