import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

interface Budget {
  id: number;
  name: string;
  fiscal_year: number;
  total_amount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export default function BudgetPlanning() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    fiscal_year: new Date().getFullYear(),
    total_amount: '',
    start_date: '',
    end_date: '',
    is_active: true
  });

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const budgetsData = await api.get('/schools/financial/budgets/');
      setBudgets(budgetsData);
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/schools/financial/budgets/', formData);
      fetchBudgets();
      resetForm();
    } catch (error) {
      console.error('Failed to create budget:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      fiscal_year: new Date().getFullYear(),
      total_amount: '',
      start_date: '',
      end_date: '',
      is_active: true
    });
    setShowForm(false);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 80) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Budget Planning</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Budget Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="col-span-2"
              />
              <Input
                type="number"
                placeholder="Fiscal Year"
                value={formData.fiscal_year}
                onChange={(e) => setFormData({ ...formData, fiscal_year: Number(e.target.value) })}
                required
              />
              <Input
                type="number"
                placeholder="Total Amount"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                required
              />
              <Input
                type="date"
                placeholder="Start Date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
              <Input
                type="date"
                placeholder="End Date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4"
                />
                <label className="text-sm">Active</label>
              </div>
              <div className="col-span-2 flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {budgets.map((budget) => {
          // For now, show 0% utilization since we don't have budget items yet
          const utilization = 0;
          const remaining = budget.total_amount;
          
          return (
            <Card key={budget.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{budget.name}</CardTitle>
                    <p className="text-sm text-gray-500">FY {budget.fiscal_year}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(budget.is_active)}`}>
                    {budget.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Budget</p>
                    <p className="text-xl font-bold">₵{budget.total_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Utilized</p>
                    <p className="text-xl font-bold text-orange-600">
                      ₵0
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Remaining</p>
                    <p className={`text-xl font-bold ${getUtilizationColor(utilization)}`}>
                      ₵{remaining.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Utilization</span>
                    <span className={`font-bold ${getUtilizationColor(utilization)}`}>
                      {utilization.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        utilization >= 90 ? 'bg-red-600' :
                        utilization >= 80 ? 'bg-orange-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    />
                  </div>
                </div>

                {utilization >= 80 && (
                  <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                    <AlertCircle className="h-4 w-4" />
                    <span>Budget utilization is high</span>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
