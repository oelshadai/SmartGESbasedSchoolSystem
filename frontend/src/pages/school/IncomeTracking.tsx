import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, TrendingUp } from 'lucide-react';
import api from '@/lib/api';

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
    payment_method: 'CASH'
  });

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    try {
      const incomesData = await api.get('/schools/financial/income/');
      setIncomes(incomesData);
    } catch (error) {
      console.error('Failed to fetch income:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/schools/financial/income/', formData);
      fetchIncomes();
      resetForm();
    } catch (error) {
      console.error('Failed to create income:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'TUITION',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      received_from: '',
      payment_method: 'CASH'
    });
    setShowForm(false);
  };

  const totalIncome = incomes.reduce((sum, income) => sum + Number(income.amount), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Income Tracking</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Income
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            ₵{totalIncome.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Income</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="TUITION">Tuition Fees</option>
                <option value="REGISTRATION">Registration</option>
                <option value="DONATIONS">Donations</option>
                <option value="GRANTS">Grants</option>
                <option value="OTHER">Other</option>
              </select>
              <Input
                placeholder="Received From"
                value={formData.received_from}
                onChange={(e) => setFormData({ ...formData, received_from: e.target.value })}
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
          <CardTitle>Income Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">Received From</th>
                  <th className="text-left p-2">Payment Method</th>
                  <th className="text-right p-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((income) => (
                  <tr key={income.id} className="border-b">
                    <td className="p-2">{new Date(income.date).toLocaleDateString()}</td>
                    <td className="p-2">{income.category}</td>
                    <td className="p-2">{income.description}</td>
                    <td className="p-2">{income.received_from}</td>
                    <td className="p-2">{income.payment_method}</td>
                    <td className="text-right p-2 font-bold text-green-600">
                      ₵{income.amount.toLocaleString()}
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
