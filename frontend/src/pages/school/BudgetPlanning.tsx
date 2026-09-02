import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, AlertCircle, PieChart } from 'lucide-react';
import { secureApiClient as api } from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';

interface BudgetItem {
  id: number;
  category: string;
  allocated_amount: number;
  spent_amount: number;
}

interface Budget {
  id: number;
  name: string;
  total_amount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  items: BudgetItem[];
}

export default function BudgetPlanning() {
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    total_amount: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  useEffect(() => { fetchBudgets(); }, []);

  const fetchBudgets = async () => {
    try {
      const response = await api.get('/schools/financial/budgets/');
      setBudgets(Array.isArray(response) ? response : response?.results || []);
    } catch { setBudgets([]); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/schools/financial/budgets/', formData);
      fetchBudgets();
      resetForm();
      toast({ title: 'Budget created', description: `${formData.name} has been created` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create budget', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', total_amount: '', start_date: '', end_date: '', is_active: true });
    setShowForm(false);
  };

  const getUtilizationColor = (pct: number) => {
    if (pct >= 90) return 'text-red-600';
    if (pct >= 80) return 'text-orange-600';
    return 'text-green-600';
  };

  const getBarColor = (pct: number) => {
    if (pct >= 90) return 'bg-red-600';
    if (pct >= 80) return 'bg-orange-600';
    return 'bg-green-600';
  };

  const calcUtilization = (budget: Budget) => {
    const totalSpent = (budget.items || []).reduce((sum, item) => sum + Number(item.spent_amount), 0);
    const total = Number(budget.total_amount);
    return total > 0 ? (totalSpent / total) * 100 : 0;
  };

  const calcSpent = (budget: Budget) =>
    (budget.items || []).reduce((sum, item) => sum + Number(item.spent_amount), 0);

  return (
    <div className="financial-page p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="theme-page-title">Budget Planning</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Plan and monitor school budgets</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="theme-button w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="theme-card-title">Create New Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input placeholder="Budget Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="theme-input sm:col-span-2" required />
              <Input type="number" placeholder="Total Amount (₵)" value={formData.total_amount} onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })} className="theme-input" required />
              <div className="flex items-center gap-2 h-10">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4" id="is_active" />
                <label htmlFor="is_active" className="text-sm">Active</label>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="theme-input" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="theme-input" required />
              </div>
              <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="theme-button w-full sm:w-auto">Save</Button>
                <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto">Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Budget cards */}
      {budgets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PieChart className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No budgets created yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {budgets.map((budget) => {
            const utilization = calcUtilization(budget);
            const spent = calcSpent(budget);
            const remaining = Number(budget.total_amount) - spent;
            const year = budget.start_date ? new Date(budget.start_date).getFullYear() : '—';
            return (
              <Card key={budget.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <CardTitle className="theme-card-title text-base">{budget.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">FY {year}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold w-fit ${budget.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-foreground/60'}`}>
                      {budget.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-muted/40 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Total Budget</p>
                      <p className="text-base sm:text-lg font-bold mt-0.5">₵{Number(budget.total_amount).toLocaleString()}</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Utilized</p>
                      <p className="text-base sm:text-lg font-bold text-orange-600 mt-0.5">₵{spent.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3 col-span-2 sm:col-span-1">
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className={`text-base sm:text-lg font-bold mt-0.5 ${getUtilizationColor(utilization)}`}>₵{remaining.toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">Utilization</span>
                      <span className={`font-bold ${getUtilizationColor(utilization)}`}>{utilization.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${getBarColor(utilization)}`} style={{ width: `${Math.min(utilization, 100)}%` }} />
                    </div>
                  </div>

                  {utilization >= 80 && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>Budget utilization is high</span>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {new Date(budget.start_date).toLocaleDateString()} — {new Date(budget.end_date).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
