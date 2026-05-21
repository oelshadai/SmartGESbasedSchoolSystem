import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';

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
    payment_method: 'CASH'
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const expensesData = await api.get('/schools/financial/expenses/');
      setExpenses(expensesData);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/schools/financial/expenses/', formData);
      fetchExpenses();
      resetForm();
    } catch (error) {
      console.error('Failed to create expense:', error);
    }
  };

  const approveExpense = async (id: number) => {
    const comments = prompt('Approval comments (optional):');
    try {
      await api.post(`/schools/financial/expenses/${id}/approve/`, { comments });
      fetchExpenses();
    } catch (error) {
      console.error('Failed to approve expense:', error);
    }
  };

  const rejectExpense = async (id: number) => {
    const comments = prompt('Rejection reason:');
    if (!comments) return;
    try {
      await api.post(`/schools/financial/expenses/${id}/reject/`, { comments });
      fetchExpenses();
    } catch (error) {
      console.error('Failed to reject expense:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'UTILITIES',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paid_to: '',
      payment_method: 'CASH'
    });
    setShowForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Expense Management</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
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
              <Input
                placeholder="Paid To"
                value={formData.paid_to}
                onChange={(e) => setFormData({ ...formData, paid_to: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
              </select>
              <Input
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                className="col-span-2"
              />
              <div className="col-span-2 flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">Paid To</th>
                  <th className="text-right p-2">Amount</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b">
                    <td className="p-2">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="p-2">{expense.category}</td>
                    <td className="p-2">{expense.description}</td>
                    <td className="p-2">{expense.paid_to}</td>
                    <td className="text-right p-2 font-bold">₵{expense.amount.toLocaleString()}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(expense.status)}`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="p-2">
                      {expense.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => approveExpense(expense.id)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => rejectExpense(expense.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
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
    </div>
  );
}
