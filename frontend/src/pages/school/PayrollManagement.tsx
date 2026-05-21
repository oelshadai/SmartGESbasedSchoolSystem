import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, DollarSign } from 'lucide-react';
import api from '@/lib/api';

interface PayrollRecord {
  id: number;
  staff_name: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  status: string;
  payment_date: string | null;
}

export default function PayrollManagement() {
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    try {
      const payrollData = await api.get('/schools/financial/payroll/');
      setPayroll(payrollData);
    } catch (error) {
      console.error('Failed to fetch payroll:', error);
    }
  };

  const generatePayroll = async () => {
    setGenerating(true);
    try {
      await api.post('/schools/financial/payroll/generate_monthly/', { month, year });
      fetchPayroll();
      alert('Payroll generated successfully!');
    } catch (error) {
      console.error('Failed to generate payroll:', error);
      alert('Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
  };

  const approvePayroll = async (id: number) => {
    try {
      await api.post(`/schools/financial/payroll/${id}/approve/`);
      fetchPayroll();
    } catch (error) {
      console.error('Failed to approve payroll:', error);
    }
  };

  const markPaid = async (id: number) => {
    const paymentDate = prompt('Enter payment date (YYYY-MM-DD):');
    if (!paymentDate) return;
    
    try {
      await api.post(`/schools/financial/payroll/${id}/mark_paid/`, {
        payment_date: paymentDate,
        payment_method: 'BANK_TRANSFER'
      });
      fetchPayroll();
    } catch (error) {
      console.error('Failed to mark as paid:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'APPROVED': return 'bg-blue-100 text-blue-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Payroll Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Generate Monthly Payroll</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-2">Month</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Year</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <Button onClick={generatePayroll} disabled={generating}>
              <DollarSign className="h-4 w-4 mr-2" />
              {generating ? 'Generating...' : 'Generate Payroll'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Staff</th>
                  <th className="text-left p-2">Period</th>
                  <th className="text-right p-2">Basic</th>
                  <th className="text-right p-2">Allowances</th>
                  <th className="text-right p-2">Deductions</th>
                  <th className="text-right p-2">Net Salary</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payroll.map((record) => (
                  <tr key={record.id} className="border-b">
                    <td className="p-2">{record.staff_name}</td>
                    <td className="p-2">{monthNames[record.month - 1]} {record.year}</td>
                    <td className="text-right p-2">₵{record.basic_salary.toLocaleString()}</td>
                    <td className="text-right p-2">₵{record.allowances.toLocaleString()}</td>
                    <td className="text-right p-2">₵{record.deductions.toLocaleString()}</td>
                    <td className="text-right p-2 font-bold">₵{record.net_salary.toLocaleString()}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        {record.status === 'DRAFT' && (
                          <Button size="sm" onClick={() => approvePayroll(record.id)}>
                            Approve
                          </Button>
                        )}
                        {record.status === 'APPROVED' && (
                          <Button size="sm" onClick={() => markPaid(record.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Paid
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
    </div>
  );
}
