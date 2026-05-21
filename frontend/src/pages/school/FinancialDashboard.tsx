import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Users, AlertCircle, Wallet, Receipt, PieChart as PieChartIcon } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface CategoryData {
  category: string;
  amount: number;
}

interface DashboardData {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  monthly_summary: {
    income: number;
    expenses: number;
    net: number;
  };
  payroll_summary: {
    total_staff: number;
    total_payroll: number;
    pending_payroll: number;
  };
  pending_approvals: number;
  budget_utilization: number;
  monthly_trend: MonthlyData[];
  income_by_category: CategoryData[];
  expense_by_category: CategoryData[];
  cash_flow: MonthlyData[];
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: ₵{entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function FinancialDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await api.get('/schools/financial/dashboard/');
      setData(data);
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.message || 'Unable to load financial dashboard';
      console.error('Failed to fetch dashboard:', error);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-2">Financial dashboard unavailable</h2>
          <p className="text-sm text-muted-foreground mb-3">The dashboard could not load at this time.</p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!error && <p className="text-sm text-muted-foreground">Please refresh the page or contact support if the problem persists.</p>}
        </div>
      </div>
    );
  }

  const incomeGrowth = data.monthly_trend && data.monthly_trend.length > 1
    ? ((data.monthly_trend[data.monthly_trend.length - 1].income - data.monthly_trend[data.monthly_trend.length - 2].income) / data.monthly_trend[data.monthly_trend.length - 2].income * 100)
    : 0;

  const expenseGrowth = data.monthly_trend && data.monthly_trend.length > 1
    ? ((data.monthly_trend[data.monthly_trend.length - 1].expenses - data.monthly_trend[data.monthly_trend.length - 2].expenses) / data.monthly_trend[data.monthly_trend.length - 2].expenses * 100)
    : 0;

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">Financial Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time financial overview and analytics</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Last updated</p>
          <p className="text-sm font-medium">{new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Alerts */}
      {(data.pending_approvals > 0 || data.budget_utilization > 80) && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.pending_approvals > 0 && (
            <Card variant="elevated" className="border-orange-500 bg-orange-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-500/10 rounded-full">
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Pending Approvals</p>
                    <p className="text-sm text-muted-foreground">{data.pending_approvals} expense(s) awaiting approval</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {data.budget_utilization > 80 && (
            <Card variant="elevated" className="border-red-500 bg-red-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-500/10 rounded-full">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Budget Alert</p>
                    <p className="text-sm text-muted-foreground">Utilization at {data.budget_utilization.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card variant="elevated" className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₵{data.total_income.toLocaleString()}
            </div>
            {incomeGrowth !== 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className={incomeGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                  {incomeGrowth > 0 ? '+' : ''}{incomeGrowth.toFixed(1)}%
                </span> from last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card variant="elevated" className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-red-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <div className="p-2 bg-red-500/10 rounded-full">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₵{data.total_expenses.toLocaleString()}
            </div>
            {expenseGrowth !== 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className={expenseGrowth > 0 ? 'text-red-600' : 'text-green-600'}>
                  {expenseGrowth > 0 ? '+' : ''}{expenseGrowth.toFixed(1)}%
                </span> from last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card variant="elevated" className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.net_balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ₵{data.net_balance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((data.net_balance / data.total_income) * 100).toFixed(1)}% profit margin
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated" className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-full">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.payroll_summary.total_staff}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ₵{data.payroll_summary.total_payroll.toLocaleString()} total payroll
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Income vs Expenses Trend */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Income vs Expenses Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.monthly_trend || []}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" name="Income" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cash Flow */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-500" />
              Monthly Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.cash_flow || data.monthly_trend || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="net" name="Net Cash Flow" radius={[8, 8, 0, 0]}>
                  {(data.cash_flow || data.monthly_trend || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.net >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Income by Category */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-orange-500" />
              Income by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.income_by_category || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {(data.income_by_category || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense by Category */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-orange-500" />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.expense_by_category || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="category" type="category" className="text-xs" width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Amount" radius={[0, 8, 8, 0]}>
                  {(data.expense_by_category || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Income</span>
              <span className="font-bold text-green-600">₵{data.monthly_summary.income.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Expenses</span>
              <span className="font-bold text-red-600">₵{data.monthly_summary.expenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="font-semibold">Net</span>
              <span className={`font-bold ${data.monthly_summary.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₵{data.monthly_summary.net.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">Payroll Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Staff</span>
              <span className="font-bold">{data.payroll_summary.total_staff}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Payroll</span>
              <span className="font-bold">₵{data.payroll_summary.total_payroll.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="font-semibold">Pending</span>
              <span className="font-bold text-orange-600">₵{data.payroll_summary.pending_payroll.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">Budget Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Utilization</span>
              <span className={`font-bold ${
                data.budget_utilization >= 90 ? 'text-red-600' :
                data.budget_utilization >= 80 ? 'text-orange-600' : 'text-green-600'
              }`}>
                {data.budget_utilization.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  data.budget_utilization >= 90 ? 'bg-red-600' :
                  data.budget_utilization >= 80 ? 'bg-orange-600' : 'bg-green-600'
                }`}
                style={{ width: `${Math.min(data.budget_utilization, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              {data.budget_utilization < 80 ? 'Budget on track' :
               data.budget_utilization < 90 ? 'Approaching limit' : 'Budget exceeded'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
