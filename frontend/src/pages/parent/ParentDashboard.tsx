import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { secureApiClient } from '@/lib/secureApiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GraduationCap, BookOpen, CalendarCheck, DollarSign, FileText, Users,
  CheckCircle2, Clock, AlertCircle, TrendingDown, ChevronDown, ChevronUp,
  ArrowRight, Loader2,
} from 'lucide-react';

interface ChildInfo {
  student_id: string;
  name: string;
  relationship: string;
}

interface ChildSummary {
  student_id: string;
  name: string;
  class_name?: string;
  attendance_rate?: number;
  recent_grades?: { subject: string; score: number }[];
}

interface FeeSummary {
  total_billed: number;
  total_paid_bills: number;
  total_balance: number;
  total_daily_paid: number;
  grand_total_paid: number;
}

interface TermBillItem {
  id: number;
  fee_type: string;
  term: string;
  academic_year: string;
  amount_billed: number;
  amount_paid: number;
  balance: number;
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'WAIVED';
  due_date: string | null;
}

const fmt = (n: number) =>
  `GH₵ ${n.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;

const STATUS_STYLE: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700 border-green-200',
  PARTIAL: 'bg-amber-100 text-amber-700 border-amber-200',
  UNPAID: 'bg-red-100 text-red-700 border-red-200',
  WAIVED: 'bg-gray-100 text-gray-600 border-gray-200',
};

const ParentDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [summaries, setSummaries] = useState<Record<string, ChildSummary>>({});
  const [feeSummaries, setFeeSummaries] = useState<Record<string, FeeSummary>>({});
  const [termBills, setTermBills] = useState<Record<string, TermBillItem[]>>({});
  const [expandedChild, setExpandedChild] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userChildren: ChildInfo[] = (user as any)?.children || [];
        setChildren(userChildren);

        const summaryMap: Record<string, ChildSummary> = {};
        const feeMap: Record<string, FeeSummary> = {};
        const billsMap: Record<string, TermBillItem[]> = {};

        await Promise.all(
          userChildren.map(async (child) => {
            // Basic summary
            try {
              const data = await secureApiClient.get<ChildSummary>(
                `/schools/parent-accounts/child_summary/?student_id=${child.student_id}`
              );
              summaryMap[child.student_id] = data;
            } catch {
              summaryMap[child.student_id] = { student_id: child.student_id, name: child.name };
            }
            // Fee bills
            try {
              const feeData = await secureApiClient.get<any>(
                `/fees/term-bills/my-bills/?student_id=${child.student_id}`
              );
              if (feeData?.summary) feeMap[child.student_id] = feeData.summary;
              if (feeData?.term_bills) billsMap[child.student_id] = feeData.term_bills;
            } catch {
              // silently skip
            }
          })
        );

        setSummaries(summaryMap);
        setFeeSummaries(feeMap);
        setTermBills(billsMap);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const parentName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.email
    : 'Parent';

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
          <Users className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, {parentName}</h1>
          <p className="text-muted-foreground text-sm">Parent / Guardian Portal</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading your children's information…
        </div>
      ) : children.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">No children linked to your account yet.</p>
            <p className="text-sm text-muted-foreground/70">
              Please contact your school's admin to link your children.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {children.map((child) => {
            const summary = summaries[child.student_id];
            const fees = feeSummaries[child.student_id];
            const bills = termBills[child.student_id] || [];
            const isExpanded = expandedChild === child.student_id;
            const hasBalance = fees && fees.total_balance > 0;

            return (
              <Card key={child.student_id} className="border shadow-sm overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{child.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ID: {child.student_id}
                          {summary?.class_name && ` · ${summary.class_name}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">{child.relationship}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Quick info cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="h-3.5 w-3.5 text-emerald-500" />
                        <p className="text-xs text-muted-foreground">Attendance</p>
                      </div>
                      <p className="text-sm font-bold mt-1">
                        {summary?.attendance_rate != null ? `${summary.attendance_rate}%` : '—'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-purple-500" />
                        <p className="text-xs text-muted-foreground">Reports</p>
                      </div>
                      <p className="text-sm font-bold text-purple-500 mt-1">Available</p>
                    </div>
                  </div>

                  {/* Fee summary */}
                  {fees ? (
                    <div className={`rounded-xl border p-4 space-y-3 ${hasBalance ? 'border-red-500/30 bg-red-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-amber-500" /> Fees
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setExpandedChild(isExpanded ? null : child.student_id)}
                        >
                          {isExpanded ? 'Hide' : 'Details'}
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                      </div>

                      {/* Summary row */}
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-xs text-muted-foreground">Total Paid</div>
                          <div className="text-sm font-bold text-green-600">{fmt(fees.grand_total_paid)}</div>
                        </div>
                        <div className="border-x">
                          <div className="text-xs text-muted-foreground">Balance</div>
                          <div className={`text-sm font-bold ${hasBalance ? 'text-red-600' : 'text-green-600'}`}>
                            {fmt(fees.total_balance)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Daily Paid</div>
                          <div className="text-sm font-bold text-indigo-600">{fmt(fees.total_daily_paid)}</div>
                        </div>
                      </div>

                      {hasBalance && (
                        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-100 rounded-lg px-3 py-2">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          Outstanding balance: {fmt(fees.total_balance)}. Please settle at the school office.
                        </div>
                      )}

                      {/* Expanded bill details */}
                      {isExpanded && bills.length > 0 && (
                        <div className="border-t pt-3 space-y-2">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Term Bills</div>
                          {bills.map((bill) => (
                            <div key={bill.id} className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2.5">
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{bill.fee_type}</div>
                                <div className="text-xs text-muted-foreground">{bill.academic_year} · {bill.term} Term</div>
                                <div className="mt-1.5 w-full max-w-[140px] bg-muted rounded-full h-1">
                                  <div
                                    className="h-1 rounded-full bg-green-500"
                                    style={{ width: `${bill.amount_billed > 0 ? Math.min(100, (bill.amount_paid / bill.amount_billed) * 100) : 0}%` }}
                                  />
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {fmt(bill.amount_paid)} of {fmt(bill.amount_billed)}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <Badge className={`text-xs border ${STATUS_STYLE[bill.status]}`}>{bill.status}</Badge>
                                {bill.balance > 0 && (
                                  <div className="text-xs font-semibold text-red-600 mt-1">{fmt(bill.balance)}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {isExpanded && bills.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">No term bills generated yet.</p>
                      )}

                      {isExpanded && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs gap-1 mt-1"
                          onClick={() => navigate(`/parent/bills/${child.student_id}`)}
                        >
                          <ArrowRight className="h-3.5 w-3.5" /> Full Bills Page
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-muted p-3 text-xs text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5" /> Fee information not available.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;

