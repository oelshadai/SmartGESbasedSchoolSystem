import { useState, useEffect, useCallback, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatCard from '@/components/shared/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign, TrendingUp, AlertCircle, Search, Receipt, Users,
  Loader2, RefreshCw, CheckCircle, XCircle, Settings, Pencil,
  Trash2, Plus, Zap, BarChart3, Filter, Download, CalendarDays, Award,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import {
  feeService,
  type StudentSearchResult, type FeeType, type StudentFee, type FeePayment,
  type FeeStructure, type TermBill, type GenerateBillsResult,
  FREQUENCY_LABELS, type CollectionFrequency,
} from '@/services/feeService';
import secureApiClient from '@/lib/secureApiClient';

interface Class {
  id: number;
  level: string;
  section: string;
  full_name: string;
}

interface Term {
  id: number;
  name: string;
  academic_year: number;
  academic_year_name?: string;
  is_current: boolean;
}

// Class levels available in the system
const CLASS_LEVELS = [
  'BASIC_1','BASIC_2','BASIC_3','BASIC_4','BASIC_5',
  'BASIC_6','BASIC_7','BASIC_8','BASIC_9',
];

const BILL_STATUS_COLORS: Record<string, string> = {
  UNPAID: 'bg-red-100 text-red-800 border-red-200',
  PARTIAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  WAIVED: 'bg-gray-100 text-gray-800 border-gray-200',
};

const PIE_STATUS_COLORS: Record<string, string> = {
  'Paid': '#10b981',
  'Partial': '#f59e0b',
  'Not Started': '#ef4444',
  'Defaulted': '#6b7280',
};

const FeeManagement = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('collect');

  // ------ Collect tab state ------
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<StudentSearchResult[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [dataRefreshing, setDataRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedFeeType, setSelectedFeeType] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'MOBILE_MONEY'>('CASH');
  const [resolvedStructureAmount, setResolvedStructureAmount] = useState<number | null>(null);
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState({
    totalExpected: 0,
    totalCollected: 0,
    outstanding: 0,
    collectionRate: 0,
    totalPaymentCount: 0,
    dailyCollected: 0,
    dailyExpected: 0,
    nonDailyCollected: 0,
    nonDailyOutstanding: 0,
  });

  // ------ Analytics state ------
  const [collectionByFeeType, setCollectionByFeeType] = useState<Array<{ fee_type__name: string; total: number; transactions: number }>>([]);
  const [collectionByCollector, setCollectionByCollector] = useState<Array<{ collected_by__first_name: string; collected_by__last_name: string; total: number; transactions: number }>>([]);
  const [paymentStatusBreakdown, setPaymentStatusBreakdown] = useState<Array<{ status: string; count: number; total_balance: number }>>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'overview' | 'by_class'>('overview');
  const [byClassData, setByClassData] = useState<Array<{
    class_id: number; class_name: string; level: string; section: string;
    total_students: number; daily_collected: number; term_collected: number; total_collected: number;
  }>>([]);
  const [byClassLoading, setByClassLoading] = useState(false);

  // ------ Records tab state ------
  const [recordsBills, setRecordsBills] = useState<TermBill[]>([]);
  const [recordsBillsLoading, setRecordsBillsLoading] = useState(false);
  const [recSearchQuery, setRecSearchQuery] = useState('');
  const [recClassFilter, setRecClassFilter] = useState('all');
  const [recFeeTypeFilter, setRecFeeTypeFilter] = useState('all');
  const [recStatusFilter, setRecStatusFilter] = useState('all');

  // ------ Payment History filter state ------
  const [pfDateFrom, setPfDateFrom] = useState('');
  const [pfDateTo, setPfDateTo] = useState('');
  const [pfFeeType, setPfFeeType] = useState('all');
  const [pfMethod, setPfMethod] = useState('all');
  const [pfVerified, setPfVerified] = useState('all');
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  // ------ Setup tab state ------
  type SetupSection = 'types' | 'structures' | 'bills';
  const [setupSection, setSetupSection] = useState<SetupSection>('types');

  // Fee type form
  const [editingFeeType, setEditingFeeType] = useState<FeeType | null>(null);
  const [ftName, setFtName] = useState('');
  const [ftDesc, setFtDesc] = useState('');
  const [ftFreq, setFtFreq] = useState<CollectionFrequency>('TERM');
  const [ftDay, setFtDay] = useState('');
  const [ftParentFeeType, setFtParentFeeType] = useState<string>('');  // '' = main fee
  const [ftAllowClassTeacher, setFtAllowClassTeacher] = useState(false);
  const [ftAllowAnyTeacher, setFtAllowAnyTeacher] = useState(false);
  const [ftRequireApproval, setFtRequireApproval] = useState(false);
  const [ftShowForm, setFtShowForm] = useState(false);
  const [ftSaving, setFtSaving] = useState(false);

  // Fee structure form
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [structureFeeTypeId, setStructureFeeTypeId] = useState('');
  const [structuresLoading, setStructuresLoading] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const [stLevel, setStLevel] = useState('');
  const [stAmount, setStAmount] = useState('');
  const [stTierLabel, setStTierLabel] = useState('');
  const [stDueDate, setStDueDate] = useState('');
  const [stShowForm, setStShowForm] = useState(false);
  const [stSaving, setStSaving] = useState(false);

  // Term Bills
  const [terms, setTerms] = useState<Term[]>([]);
  const [billTermId, setBillTermId] = useState('');
  const [billFeeTypeId, setBillFeeTypeId] = useState('');
  const [billOverwrite, setBillOverwrite] = useState(false);
  const [billsGenerating, setBillsGenerating] = useState(false);
  const [lastBillResult, setLastBillResult] = useState<GenerateBillsResult | null>(null);
  const [termBills, setTermBills] = useState<TermBill[]>([]);
  const [termBillsLoading, setTermBillsLoading] = useState(false);

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => { if (activeTab === 'setup') fetchSetupData(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'analytics') fetchAnalytics(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'records') fetchRecordsBills(); }, [activeTab]);

  // Auto-fetch fee structure amount when student + fee type are both selected
  useEffect(() => {
    if (!selectedStudent || !selectedFeeType || selectedFeeType === 'all') {
      setResolvedStructureAmount(null);
      return;
    }
    let cancelled = false;
    setLoadingStructure(true);
    feeService.getFeeStructures({ fee_type: parseInt(selectedFeeType), level: selectedStudent.class_level })
      .then(data => {
        if (cancelled) return;
        const match = data[0];
        const amt = match ? match.amount : null;
        setResolvedStructureAmount(amt);
        // For DAILY fees, auto-fill the payment amount
        const ft = feeTypes.find(f => String(f.id) === selectedFeeType);
        if (ft?.collection_frequency === 'DAILY' && amt != null) {
          setPaymentAmount(String(amt));
        }
      })
      .catch(() => { if (!cancelled) setResolvedStructureAmount(null); })
      .finally(() => { if (!cancelled) setLoadingStructure(false); });
    return () => { cancelled = true; };
  }, [selectedStudent?.id, selectedFeeType]);

  const fetchSetupData = async () => {
    try {
      const [termsResp] = await Promise.all([
        secureApiClient.get<any>('/schools/terms/'),
      ]);
      const termsList = termsResp?.results || (Array.isArray(termsResp) ? termsResp : []);
      setTerms(termsList);
      const current = termsList.find((t: Term) => t.is_current);
      if (current && !billTermId) setBillTermId(String(current.id));
    } catch (e) {
      console.error('Failed to load setup data', e);
    }
  };

  const fetchInitialData = useCallback(async (showRefreshToast = false) => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchFeeTypes(),
        fetchClasses(),
        fetchStudentFees(),
        fetchPayments(),
        fetchSummary()
      ]);
      if (showRefreshToast) {
        toast.success('Data refreshed successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load fee data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFeeTypes = async () => {
    try {
      const data = await feeService.getFeeTypes();
      setFeeTypes(data);
    } catch (error) {
      console.error('Failed to fetch fee types:', error);
      throw error;
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await secureApiClient.get('/schools/classes/');
      console.log('Classes response:', response); // Debug log
      const classList = Array.isArray(response) ? response : response.results || response.data || [];
      console.log('Processed classes:', classList); // Debug log
      setClasses(classList);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      setClasses([]); // Set empty array on error
      // Don't throw error to prevent blocking other data fetches
    }
  };

  const fetchStudentFees = async () => {
    try {
      const data = await feeService.getStudentFees({ ordering: '-updated_at' });
      setStudentFees(data.results);
    } catch (error) {
      console.error('Failed to fetch student fees:', error);
      throw error;
    }
  };

  const fetchPayments = async () => {
    try {
      const data = await feeService.getFeePayments({ ordering: '-payment_date' });
      setPayments(data.results);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      throw error;
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await feeService.getCollectionSummary();
      const billed = data.total_billed ?? 0;
      const collected = data.total_collected ?? 0;
      const outstanding = Math.max(0, data.total_outstanding ?? 0);
      setSummary({
        totalExpected: billed,
        totalCollected: collected,
        outstanding: outstanding,
        collectionRate: billed > 0 ? (collected / billed) * 100 : 0,
        totalPaymentCount: data.total_payment_count ?? 0,
        dailyCollected: data.daily_collected ?? 0,
        dailyExpected: data.daily_expected ?? 0,
        nonDailyCollected: data.non_daily_collected ?? 0,
        nonDailyOutstanding: data.non_daily_outstanding ?? 0,
      });
      setCollectionByFeeType(data.by_fee_type || []);
      setCollectionByCollector(data.by_collector || []);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      throw error;
    }
  };

  const searchStudents = useCallback(async () => {
    if (!searchQuery && selectedClass === 'all') {
      setStudents([]);
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);
      const params: { q?: string; class_id?: number } = {};
      if (searchQuery) params.q = searchQuery;
      if (selectedClass && selectedClass !== 'all') params.class_id = parseInt(selectedClass);

      const data = await feeService.searchStudents(params);
      setStudents(data || []);
      
      if (!data || data.length === 0) {
        toast.info('No students found matching your search criteria');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search students';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, selectedClass]);

  // Auto-search when class is selected
  useEffect(() => {
    if (selectedClass !== 'all') {
      searchStudents();
    } else if (!searchQuery) {
      setStudents([]);
    }
  }, [selectedClass, searchStudents]);

  const validatePaymentForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!selectedStudent) {
      errors.student = 'Please select a student';
    }
    
    if (!selectedFeeType) {
      errors.feeType = 'Please select a fee type';
    }
    
    if (!paymentAmount) {
      errors.amount = 'Please enter an amount';
    } else {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        errors.amount = 'Please enter a valid amount greater than 0';
      } else if (amount > 999999.99) {
        errors.amount = 'Amount cannot exceed GH₵ 999,999.99';
      }
    }
    
    if (paymentMethod === 'CHEQUE' && !referenceNumber) {
      errors.reference = 'Reference number is required for cheque payments';
    }
    
    if (paymentMethod === 'BANK_TRANSFER' && !referenceNumber) {
      errors.reference = 'Reference number is required for bank transfers';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const collectFee = async () => {
    if (!validatePaymentForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }

    const amount = parseFloat(paymentAmount);

    try {
      setPaymentLoading(true);
      setValidationErrors({});
      
      await feeService.createFeePayment({
        student: selectedStudent!.id,
        fee_type: parseInt(selectedFeeType),
        amount_paid: amount,
        payment_method: paymentMethod,
        reference_number: referenceNumber || undefined,
        notes: notes || undefined
      });

      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>Fee payment of GH₵ {amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} recorded successfully</span>
        </div>
      );
      
      resetPaymentForm();
      
      // Refresh data in background
      setDataRefreshing(true);
      await Promise.all([
        fetchStudentFees(),
        fetchPayments(),
        fetchSummary()
      ]);
      setDataRefreshing(false);
      
      // Refresh student search to update balances
      if (searchQuery || selectedClass) {
        await searchStudents();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to record payment';
      toast.error(
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          <span>{errorMessage}</span>
        </div>
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const resetPaymentForm = () => {
    setSelectedStudent(null);
    // Don't reset selectedFeeType here as it's used for filtering
    setPaymentAmount('');
    setPaymentMethod('CASH');
    setReferenceNumber('');
    setNotes('');
    setValidationErrors({});
  };

  const handleRefresh = async () => {
    await fetchInitialData(true);
  };

  const fetchRecordsBills = async () => {
    setRecordsBillsLoading(true);
    try {
      const data = await feeService.getTermBills({ ordering: '-updated_at' });
      setRecordsBills(data.results);
    } catch (e) {
      console.error('Failed to load fee records', e);
    } finally {
      setRecordsBillsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const [statusData, summaryData] = await Promise.all([
        feeService.getStudentFeesByStatus(),
        feeService.getCollectionSummary(),
      ]);
      setPaymentStatusBreakdown(statusData);
      setCollectionByFeeType(summaryData.by_fee_type || []);
      setCollectionByCollector(summaryData.by_collector || []);
    } catch (e) {
      console.error('Failed to fetch analytics', e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchByClassData = async () => {
    try {
      setByClassLoading(true);
      const data = await feeService.getAllClassesSummary();
      setByClassData(data);
    } catch (e) {
      console.error('Failed to fetch class summary', e);
      toast.error('Could not load class collection data');
    } finally {
      setByClassLoading(false);
    }
  };

  const exportPaymentsCSV = () => {
    const rows = [
      ['Student', 'Student ID', 'Fee Type', 'Amount (GH₵)', 'Method', 'Reference', 'Date', 'Collected By', 'Verified'],
      ...filteredPayments.map(p => [
        p.student_name, p.student_id, p.fee_type_name,
        p.amount_paid.toFixed(2), p.payment_method,
        p.reference_number || '',
        new Date(p.payment_date).toLocaleDateString(),
        p.collected_by_name, p.is_verified ? 'Yes' : 'No',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const verifyPaymentInline = async (id: number) => {
    setVerifyingId(id);
    try {
      await feeService.verifyPayment(id);
      toast.success('Payment verified successfully');
      setPayments(prev => prev.map(p => p.id === id ? { ...p, is_verified: true } : p));
    } catch (e: any) {
      toast.error(e.message || 'Failed to verify payment');
    } finally {
      setVerifyingId(null);
    }
  };

  // ----------------------------------------------------------------
  // Setup helpers
  // ----------------------------------------------------------------

  const openNewFeeTypeForm = () => {
    setEditingFeeType(null);
    setFtName(''); setFtDesc(''); setFtFreq('TERM'); setFtDay(''); setFtParentFeeType('');
    setFtAllowClassTeacher(false); setFtAllowAnyTeacher(false); setFtRequireApproval(false);
    setFtShowForm(true);
  };

  const openEditFeeTypeForm = (ft: FeeType) => {
    setEditingFeeType(ft);
    setFtName(ft.name); setFtDesc(ft.description); setFtFreq(ft.collection_frequency);
    setFtDay(ft.collection_day != null ? String(ft.collection_day) : '');
    setFtParentFeeType(ft.parent_fee_type != null ? String(ft.parent_fee_type) : '');
    setFtAllowClassTeacher(ft.allow_class_teacher_collection);
    setFtAllowAnyTeacher(ft.allow_any_teacher_collection);
    setFtRequireApproval(ft.require_payment_approval);
    setFtShowForm(true);
  };

  const saveFeeType = async () => {
    if (!ftName.trim()) { toast.error('Fee type name is required'); return; }
    const payload = {
      name: ftName.trim(), description: ftDesc,
      collection_frequency: ftFreq,
      collection_day: ftDay ? parseInt(ftDay) : null,
      parent_fee_type: ftParentFeeType ? parseInt(ftParentFeeType) : null,
      allow_class_teacher_collection: ftAllowClassTeacher,
      allow_any_teacher_collection: ftAllowAnyTeacher,
      require_payment_approval: ftRequireApproval,
      is_active: true,
    };
    try {
      setFtSaving(true);
      if (editingFeeType) {
        await feeService.updateFeeType(editingFeeType.id, payload);
        toast.success('Fee type updated');
      } else {
        await feeService.createFeeType(payload);
        toast.success('Fee type created');
      }
      setFtShowForm(false);
      const updated = await feeService.getFeeTypes();
      setFeeTypes(updated);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save fee type');
    } finally {
      setFtSaving(false);
    }
  };

  const deleteFeeType = async (ft: FeeType) => {
    if (!confirm(`Delete fee type "${ft.name}"? This cannot be undone.`)) return;
    try {
      await feeService.deleteFeeType(ft.id);
      toast.success('Fee type deleted');
      setFeeTypes(prev => prev.filter(f => f.id !== ft.id));
      if (structureFeeTypeId === String(ft.id)) setStructureFeeTypeId('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete fee type');
    }
  };

  const loadStructures = async (feeTypeId: string) => {
    if (!feeTypeId) { setStructures([]); return; }
    setStructuresLoading(true);
    try {
      const data = await feeService.getFeeStructures({ fee_type: parseInt(feeTypeId) });
      setStructures(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load structures');
    } finally {
      setStructuresLoading(false);
    }
  };

  const openNewStructureForm = () => {
    setEditingStructure(null);
    setStLevel(''); setStAmount(''); setStTierLabel(''); setStDueDate('');
    setStShowForm(true);
  };

  const openEditStructureForm = (s: FeeStructure) => {
    setEditingStructure(s);
    setStLevel(s.level); setStAmount(String(s.amount));
    setStTierLabel(s.tier_label || '');
    setStDueDate(s.due_date || '');
    setStShowForm(true);
  };

  const saveStructure = async () => {
    if (!structureFeeTypeId || structureFeeTypeId === 'all') { toast.error('Select a fee type first'); return; }
    if (!stLevel) { toast.error('Select a class level'); return; }
    if (!stAmount || parseFloat(stAmount) <= 0) { toast.error('Enter a valid amount'); return; }
    const payload = {
      fee_type: parseInt(structureFeeTypeId),
      level: stLevel,
      tier_label: stTierLabel.trim(),
      amount: parseFloat(stAmount),
      collection_period: 'TERM',
      due_date: stDueDate || null,
    };
    try {
      setStSaving(true);
      if (editingStructure) {
        await feeService.updateFeeStructure(editingStructure.id, payload);
        toast.success('Structure updated');
      } else {
        await feeService.createFeeStructure(payload as any);
        toast.success('Structure created');
      }
      setStShowForm(false);
      await loadStructures(structureFeeTypeId);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save structure');
    } finally {
      setStSaving(false);
    }
  };

  const deleteStructure = async (s: FeeStructure) => {
    if (!confirm(`Delete structure for ${s.level}?`)) return;
    try {
      await feeService.deleteFeeStructure(s.id);
      toast.success('Structure deleted');
      setStructures(prev => prev.filter(x => x.id !== s.id));
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete structure');
    }
  };

  const generateBills = async () => {
    if (!billTermId) { toast.error('Select a term'); return; }
    setBillsGenerating(true);
    setLastBillResult(null);
    try {
      const result = await feeService.generateTermBills({
        term: parseInt(billTermId),
        fee_type: billFeeTypeId ? parseInt(billFeeTypeId) : null,
        overwrite: billOverwrite,
      });
      setLastBillResult(result);
      toast.success(result.message);
      // Reload term bills for selected term
      loadTermBills();
    } catch (e: any) {
      const msg = e?.message || e?.detail || (typeof e === 'string' ? e : 'Failed to generate bills');
      toast.error(msg);
    } finally {
      setBillsGenerating(false);
    }
  };

  const loadTermBills = async () => {
    if (!billTermId) return;
    setTermBillsLoading(true);
    try {
      const data = await feeService.getTermBills({
        term: parseInt(billTermId),
        fee_type: billFeeTypeId ? parseInt(billFeeTypeId) : undefined,
        ordering: '-updated_at',
      });
      setTermBills(data.results);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load bills');
    } finally {
      setTermBillsLoading(false);
    }
  };

  useEffect(() => {
    if (setupSection === 'bills' && billTermId) loadTermBills();
  }, [setupSection, billTermId, billFeeTypeId]);

  // ----------------------------------------------------------------

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(amount).replace('GHS', 'GH₵');
  };

  const statusColors: Record<string, string> = {
    PAID: 'bg-green-100 text-green-800 border-green-200',
    PARTIAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    NOT_STARTED: 'bg-red-100 text-red-800 border-red-200',
    DEFAULTED: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const feeColumns = [
    { 
      key: 'student_name', 
      label: 'Student', 
      render: (fee: StudentFee) => (
        <div>
          <div className="font-medium">{fee.student_name}</div>
          <div className="text-sm text-muted-foreground">{fee.student_id}</div>
        </div>
      )
    },
    { 
      key: 'class_level', 
      label: 'Class', 
      render: (fee: StudentFee) => <Badge variant="outline">{fee.class_level}</Badge>
    },
    { 
      key: 'total_amount', 
      label: 'Total Fee', 
      render: (fee: StudentFee) => <span>{formatCurrency(fee.total_amount)}</span>
    },
    { 
      key: 'amount_paid', 
      label: 'Paid', 
      render: (fee: StudentFee) => <span className="text-green-600">{formatCurrency(fee.amount_paid)}</span>
    },
    { 
      key: 'balance', 
      label: 'Balance', 
      render: (fee: StudentFee) => (
        <span className={fee.balance > 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
          {formatCurrency(fee.balance)}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      render: (fee: StudentFee) => (
        <Badge variant="outline" className={statusColors[fee.status]}>
          {fee.status.replace('_', ' ')}
        </Badge>
      )
    }
  ];

  const paymentColumns = [
    { 
      key: 'student_name', 
      label: 'Student', 
      render: (payment: FeePayment) => (
        <div>
          <div className="font-medium">{payment.student_name}</div>
          <div className="text-sm text-muted-foreground">{payment.student_id}</div>
        </div>
      )
    },
    { 
      key: 'fee_type_name', 
      label: 'Fee Type', 
      render: (payment: FeePayment) => <Badge variant="secondary">{payment.fee_type_name}</Badge>
    },
    { 
      key: 'amount_paid', 
      label: 'Amount', 
      render: (payment: FeePayment) => <span className="font-medium">{formatCurrency(payment.amount_paid)}</span>
    },
    { 
      key: 'payment_method', 
      label: 'Method', 
      render: (payment: FeePayment) => <span>{payment.payment_method}</span>
    },
    { 
      key: 'payment_date', 
      label: 'Date', 
      render: (payment: FeePayment) => new Date(payment.payment_date).toLocaleDateString()
    },
    { 
      key: 'collected_by_name', 
      label: 'Collected By', 
      render: (payment: FeePayment) => <span className="text-sm">{payment.collected_by_name}</span>
    },
    { 
      key: 'is_verified', 
      label: 'Status', 
      render: (payment: FeePayment) => (
        <div className="flex items-center gap-2">
          <Badge variant={payment.is_verified ? 'default' : 'secondary'}>
            {payment.is_verified ? 'Verified' : 'Pending'}
          </Badge>
          {!payment.is_verified && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => verifyPaymentInline(payment.id)}
              disabled={verifyingId === payment.id}
            >
              {verifyingId === payment.id
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <CheckCircle className="h-3 w-3 mr-1" />}
              Verify
            </Button>
          )}
        </div>
      )
    }
  ];

  // --- Filtered payments (memoised) ---
  const filteredPayments = useMemo(() => payments.filter(p => {
    if (pfFeeType !== 'all' && String(p.fee_type) !== pfFeeType) return false;
    if (pfMethod !== 'all' && p.payment_method !== pfMethod) return false;
    if (pfVerified === 'verified' && !p.is_verified) return false;
    if (pfVerified === 'pending' && p.is_verified) return false;
    if (pfDateFrom && p.payment_date.slice(0, 10) < pfDateFrom) return false;
    if (pfDateTo && p.payment_date.slice(0, 10) > pfDateTo) return false;
    return true;
  }), [payments, pfFeeType, pfMethod, pfVerified, pfDateFrom, pfDateTo]);
  const filteredTotal = filteredPayments.reduce((s, p) => s + p.amount_paid, 0);

  // --- Records tab filtered & totals ---
  const filteredRecords = useMemo(() => recordsBills.filter(b => {
    if (recClassFilter !== 'all' && b.class_level !== recClassFilter) return false;
    if (recFeeTypeFilter !== 'all' && String(b.fee_type) !== recFeeTypeFilter) return false;
    if (recStatusFilter !== 'all' && b.status !== recStatusFilter) return false;
    if (recSearchQuery) {
      const q = recSearchQuery.toLowerCase();
      if (!`${b.student_name} ${b.student_id}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [recordsBills, recClassFilter, recFeeTypeFilter, recStatusFilter, recSearchQuery]);

  const recTotals = useMemo(() => ({
    billed: filteredRecords.reduce((s, b) => s + Number(b.amount_billed), 0),
    paid: filteredRecords.reduce((s, b) => s + Number(b.amount_paid), 0),
    arrears: filteredRecords.reduce((s, b) => s + Number(b.balance), 0),
  }), [filteredRecords]);

  // --- Unique class levels from recordsBills for filter ---
  const recClassLevels = useMemo(() =>
    [...new Set(recordsBills.map(b => b.class_level))].sort(),
    [recordsBills]
  );

  // --- Pie chart data for analytics tab ---
  const pieData = paymentStatusBreakdown.map(item => ({
    name: ({ PAID: 'Paid', PARTIAL: 'Partial', NOT_STARTED: 'Not Started', DEFAULTED: 'Defaulted' } as Record<string, string>)[item.status] ?? item.status,
    value: item.count,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Fee Management" 
        description="Collect and manage student fees across all classes"
        action={
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading || dataRefreshing}>
            {(loading || dataRefreshing) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {dataRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        }
      />
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label="Daily Fees Collected"
              value={formatCurrency(summary.dailyCollected)}
              icon={<CalendarDays className="h-5 w-5" />}
              color="text-blue-600"
              trend={summary.dailyExpected > 0
                ? `${((summary.dailyCollected / summary.dailyExpected) * 100).toFixed(1)}% of expected`
                : undefined}
            />
            <StatCard
              label="Daily Fees Expected"
              value={formatCurrency(summary.dailyExpected)}
              icon={<Users className="h-5 w-5" />}
              color="text-indigo-600"
              trend={summary.dailyExpected > 0
                ? `${formatCurrency(summary.dailyExpected - summary.dailyCollected)} outstanding`
                : 'Set term days in Settings'}
            />
            <StatCard
              label="Term/Other Collected"
              value={formatCurrency(summary.nonDailyCollected)}
              icon={<TrendingUp className="h-5 w-5" />}
              color="text-green-600"
              trend={`${summary.totalPaymentCount} total transactions`}
            />
            <StatCard
              label="Term/Other Outstanding"
              value={formatCurrency(summary.nonDailyOutstanding)}
              icon={<AlertCircle className="h-5 w-5" />}
              color="text-red-600"
              trend={summary.totalExpected > 0
                ? `${((summary.nonDailyCollected / (summary.nonDailyCollected + summary.nonDailyOutstanding || 1)) * 100).toFixed(1)}% collected`
                : undefined}
            />
          </>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="collect">Collect Fees</TabsTrigger>
          <TabsTrigger value="records">Fee Records</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="h-3.5 w-3.5 mr-1 inline" />Analytics</TabsTrigger>
          <TabsTrigger value="setup"><Settings className="h-4 w-4 mr-1 inline" />Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="collect" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Search & Fee Collection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Controls */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fee-type-select">Fee Type</Label>
                  <Select value={selectedFeeType} onValueChange={setSelectedFeeType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fee type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Fee Types</SelectItem>
                      {(feeTypes || []).map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="class-select">Select Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {(classes || []).map((cls) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.full_name || `${cls.level} ${cls.section}`.trim()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="search-input">Search Student</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-input"
                      placeholder="Name, surname, or student ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex items-end">
                  <Button onClick={searchStudents} className="w-full" disabled={searchLoading}>
                    {searchLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    {searchLoading ? 'Searching...' : 'Search Students'}
                  </Button>
                </div>
              </div>

              {/* Student Results */}
              {students && students.length > 0 && (
                <div className="space-y-2">
                  <Label>Search Results ({students.length} students)</Label>
                  <div className="max-h-60 overflow-y-auto border rounded-md">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className={`p-3 border-b cursor-pointer hover:bg-muted/50 ${
                          selectedStudent?.id === student.id ? 'bg-primary/10 border-primary' : ''
                        }`}
                        onClick={() => setSelectedStudent(student)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {student.student_id} • {student.class_level} {student.section}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              Balance: {formatCurrency(student.current_balance)}
                            </div>
                            <Badge 
                              variant="outline" 
                              className={statusColors[student.payment_status] || statusColors.NOT_STARTED}
                            >
                              {student.payment_status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Form */}
              {(() => {
                const selFeeTypeObj = feeTypes.find(ft => String(ft.id) === selectedFeeType && selectedFeeType !== 'all') ?? null;
                const isDaily = selFeeTypeObj?.collection_frequency === 'DAILY';
                return (
              <div className="border rounded-lg p-4 bg-muted/20">
                <h4 className="font-medium mb-3">
                  {selectedStudent ? `Collect Fee from ${selectedStudent.first_name} ${selectedStudent.last_name}` : 'Fee Collection Form'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fee Type *</Label>
                    <Select 
                      value={selectedFeeType && selectedFeeType !== 'all' ? selectedFeeType : ''} 
                      onValueChange={(value) => {
                        setSelectedFeeType(value);
                        setPaymentAmount('');
                        setResolvedStructureAmount(null);
                        setValidationErrors(prev => ({ ...prev, feeType: '' }));
                      }}
                    >
                      <SelectTrigger className={validationErrors.feeType ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select fee type" />
                      </SelectTrigger>
                      <SelectContent>
                        {(feeTypes || []).map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.feeType && (
                      <p className="text-sm text-red-500">{validationErrors.feeType}</p>
                    )}
                  </div>

                  {/* Fee amount info — shown once student + fee type are selected */}
                  {selectedStudent && selFeeTypeObj && (
                    <div className="space-y-1">
                      <Label>Fee Amount</Label>
                      {loadingStructure ? (
                        <div className="h-10 rounded-md border bg-muted animate-pulse" />
                      ) : resolvedStructureAmount != null ? (
                        <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                          <DollarSign className="h-4 w-4 text-blue-500 shrink-0" />
                          <span className="font-semibold text-blue-800">{formatCurrency(resolvedStructureAmount)}</span>
                          <Badge variant="outline" className="ml-auto text-xs border-blue-300 text-blue-700">
                            {FREQUENCY_LABELS[selFeeTypeObj.collection_frequency]}
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          No fee structure set for {selectedStudent.class_level}
                        </div>
                      )}
                    </div>
                  )}

                  {/* DAILY fee: static amount display — no amount input */}
                  {isDaily ? (
                    resolvedStructureAmount != null && (
                      <div className="md:col-span-2 rounded-lg border border-green-200 bg-green-50 p-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-0.5">Daily fixed amount</p>
                          <p className="text-2xl font-bold text-green-800">{formatCurrency(resolvedStructureAmount)}</p>
                          <p className="text-xs text-green-600">Clicking "Mark as Paid" records this exact amount.</p>
                        </div>
                        <Zap className="h-8 w-8 text-green-400 shrink-0" />
                      </div>
                    )
                  ) : (
                    /* Non-daily: editable amount field */
                    <div className="space-y-2">
                      <Label>
                        Amount Being Paid (GH₵) *
                        {resolvedStructureAmount != null && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            (fee: {formatCurrency(resolvedStructureAmount)})
                          </span>
                        )}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="999999.99"
                        placeholder={resolvedStructureAmount != null ? String(resolvedStructureAmount) : '0.00'}
                        value={paymentAmount}
                        onChange={(e) => {
                          setPaymentAmount(e.target.value);
                          setValidationErrors(prev => ({ ...prev, amount: '' }));
                        }}
                        className={validationErrors.amount ? 'border-red-500' : ''}
                      />
                      {validationErrors.amount && (
                        <p className="text-sm text-red-500">{validationErrors.amount}</p>
                      )}
                      {/* Pre-fill helper */}
                      {resolvedStructureAmount != null && !paymentAmount && (
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() => setPaymentAmount(String(resolvedStructureAmount))}
                        >
                          Fill full amount ({formatCurrency(resolvedStructureAmount)})
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="CHEQUE">Cheque</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>
                      Reference Number
                      {(paymentMethod === 'CHEQUE' || paymentMethod === 'BANK_TRANSFER') && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <Input
                      placeholder={
                        paymentMethod === 'CHEQUE' ? 'Cheque number' :
                        paymentMethod === 'BANK_TRANSFER' ? 'Transaction reference' :
                        paymentMethod === 'MOBILE_MONEY' ? 'Transaction ID' :
                        'Receipt/Reference number'
                      }
                      value={referenceNumber}
                      onChange={(e) => {
                        setReferenceNumber(e.target.value);
                        setValidationErrors(prev => ({ ...prev, reference: '' }));
                      }}
                      className={validationErrors.reference ? 'border-red-500' : ''}
                    />
                    {validationErrors.reference && (
                      <p className="text-sm text-red-500">{validationErrors.reference}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Additional notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={collectFee} 
                    className={`flex-1 ${isDaily ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white' : ''}`}
                    disabled={paymentLoading || !selectedStudent || !selectedFeeType || selectedFeeType === 'all' || (isDaily ? resolvedStructureAmount == null : !paymentAmount)}
                  >
                    {paymentLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : isDaily ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Receipt className="h-4 w-4 mr-2" />
                    )}
                    {paymentLoading ? 'Recording…' : isDaily ? 'Mark as Paid' : 'Record Payment'}
                  </Button>
                  {selectedStudent && (
                    <Button variant="outline" onClick={() => setSelectedStudent(null)} disabled={paymentLoading}>
                      Clear Student
                    </Button>
                  )}
                </div>
              </div>
              );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          {/* Filter / search bar */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Search Student</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={recSearchQuery}
                      onChange={e => setRecSearchQuery(e.target.value)}
                      placeholder="Name or student ID…"
                      className="h-8 text-sm pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Class</Label>
                  <Select value={recClassFilter} onValueChange={setRecClassFilter}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {recClassLevels.map(lv => (
                        <SelectItem key={lv} value={lv}>{lv.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fee Type</Label>
                  <Select value={recFeeTypeFilter} onValueChange={setRecFeeTypeFilter}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {feeTypes.map(ft => (
                        <SelectItem key={ft.id} value={String(ft.id)}>{ft.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Status pills */}
              <div className="flex flex-wrap gap-2 items-center">
                {(['all', 'UNPAID', 'PARTIAL', 'PAID', 'WAIVED'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setRecStatusFilter(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      recStatusFilter === s
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                    }`}
                  >
                    {s === 'all' ? 'All Status' : s === 'UNPAID' ? 'Arrears' : s.charAt(0) + s.slice(1).toLowerCase()}
                    {s !== 'all' && (
                      <span className="ml-1 opacity-70">
                        ({recordsBills.filter(b => b.status === s).length})
                      </span>
                    )}
                  </button>
                ))}
                {(recSearchQuery || recClassFilter !== 'all' || recFeeTypeFilter !== 'all' || recStatusFilter !== 'all') && (
                  <button
                    onClick={() => { setRecSearchQuery(''); setRecClassFilter('all'); setRecFeeTypeFilter('all'); setRecStatusFilter('all'); }}
                    className="px-3 py-1 rounded-full text-xs border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground ml-auto"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary totals row */}
          {filteredRecords.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border bg-blue-50 border-blue-200 p-3 text-center">
                <div className="text-xs text-blue-600 font-medium mb-0.5">Total Billed</div>
                <div className="text-lg font-bold text-blue-800">{formatCurrency(recTotals.billed)}</div>
              </div>
              <div className="rounded-lg border bg-green-50 border-green-200 p-3 text-center">
                <div className="text-xs text-green-600 font-medium mb-0.5">Total Paid</div>
                <div className="text-lg font-bold text-green-800">{formatCurrency(recTotals.paid)}</div>
              </div>
              <div className={`rounded-lg border p-3 text-center ${recTotals.arrears > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`text-xs font-medium mb-0.5 ${recTotals.arrears > 0 ? 'text-red-600' : 'text-gray-500'}`}>Arrears</div>
                <div className={`text-lg font-bold ${recTotals.arrears > 0 ? 'text-red-800' : 'text-gray-600'}`}>{formatCurrency(recTotals.arrears)}</div>
              </div>
            </div>
          )}

          {/* Main table */}
          <Card>
            <CardContent className="p-0">
              {recordsBillsLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  {recordsBills.length === 0 ? (
                    <div className="space-y-2">
                      <Receipt className="h-8 w-8 mx-auto opacity-30" />
                      <p className="font-medium">No fee bills generated yet</p>
                      <p className="text-sm">Go to Setup → Generate Term Bills to create student fee records.</p>
                    </div>
                  ) : (
                    <p>No records match the current filters.</p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Desktop Table */}
                  <div className="hidden sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="text-left p-3 font-medium text-muted-foreground">Student</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Class</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Fee Type</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Billed</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Paid</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Arrears</th>
                        <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredRecords.map(b => {
                        const arrearsAmount = Number(b.balance);
                        const paidPct = Number(b.amount_billed) > 0
                          ? Math.min(100, (Number(b.amount_paid) / Number(b.amount_billed)) * 100)
                          : 0;
                        const statusStyle: Record<string, string> = {
                          PAID: 'bg-green-100 text-green-800 border-green-200',
                          PARTIAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                          UNPAID: 'bg-red-100 text-red-800 border-red-200',
                          WAIVED: 'bg-gray-100 text-gray-700 border-gray-200',
                        };
                        const statusLabel: Record<string, string> = {
                          PAID: 'Paid',
                          PARTIAL: 'Partial',
                          UNPAID: 'Arrears',
                          WAIVED: 'Waived',
                        };
                        return (
                          <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <div className="font-medium">{b.student_name}</div>
                              <div className="text-xs text-muted-foreground">{b.student_id}</div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-xs">
                                {b.class_level.replace('_', ' ')}{b.class_section ? ` ${b.class_section}` : ''}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <span className="font-medium">{b.fee_type_name}</span>
                              {b.term_name && (
                                <div className="text-xs text-muted-foreground">{b.term_name}</div>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono font-medium">
                              {formatCurrency(Number(b.amount_billed))}
                            </td>
                            <td className="p-3 text-right">
                              <div className="font-mono font-medium text-green-600">{formatCurrency(Number(b.amount_paid))}</div>
                              {Number(b.amount_billed) > 0 && (
                                <div className="w-full bg-muted rounded-full h-1 mt-1">
                                  <div
                                    className={`h-1 rounded-full ${b.status === 'PAID' ? 'bg-green-500' : 'bg-amber-400'}`}
                                    style={{ width: `${paidPct}%` }}
                                  />
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono font-medium">
                              {arrearsAmount > 0 ? (
                                <span className="text-red-600">{formatCurrency(arrearsAmount)}</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant="outline" className={`text-xs ${statusStyle[b.status] ?? ''}`}>
                                {statusLabel[b.status] ?? b.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden p-3 space-y-3">
                    {filteredRecords.map(b => {
                      const arrearsAmount = Number(b.balance);
                      const paidPct = Number(b.amount_billed) > 0
                        ? Math.min(100, (Number(b.amount_paid) / Number(b.amount_billed)) * 100)
                        : 0;
                      const statusStyle: Record<string, string> = {
                        PAID: 'bg-green-100 text-green-800 border-green-200',
                        PARTIAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                        UNPAID: 'bg-red-100 text-red-800 border-red-200',
                        WAIVED: 'bg-gray-100 text-gray-700 border-gray-200',
                      };
                      const statusLabel: Record<string, string> = {
                        PAID: 'Paid',
                        PARTIAL: 'Partial',
                        UNPAID: 'Arrears',
                        WAIVED: 'Waived',
                      };
                      return (
                        <div key={b.id} className="border rounded-xl p-3 space-y-2 bg-card">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{b.student_name}</p>
                              <p className="text-xs text-muted-foreground">{b.student_id}</p>
                            </div>
                            <Badge variant="outline" className={`text-xs flex-shrink-0 ${statusStyle[b.status] ?? ''}`}>
                              {statusLabel[b.status] ?? b.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-xs">
                              {b.class_level.replace('_', ' ')}{b.class_section ? ` ${b.class_section}` : ''}
                            </Badge>
                            <span className="font-medium">{b.fee_type_name}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">Billed</p>
                              <p className="font-mono font-medium">{formatCurrency(Number(b.amount_billed))}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Paid</p>
                              <p className="font-mono font-medium text-green-600">{formatCurrency(Number(b.amount_paid))}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Arrears</p>
                              <p className={`font-mono font-medium ${arrearsAmount > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                {arrearsAmount > 0 ? formatCurrency(arrearsAmount) : '—'}
                              </p>
                            </div>
                          </div>
                          {Number(b.amount_billed) > 0 && (
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${b.status === 'PAID' ? 'bg-green-500' : 'bg-amber-400'}`}
                                style={{ width: `${paidPct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-3 py-2 border-t text-xs text-muted-foreground">
                    {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {/* Filter bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter Payments</span>
                {(pfDateFrom || pfDateTo || pfFeeType !== 'all' || pfMethod !== 'all' || pfVerified !== 'all') && (
                  <Button
                    variant="ghost" size="sm" className="h-6 px-2 text-xs ml-auto"
                    onClick={() => { setPfDateFrom(''); setPfDateTo(''); setPfFeeType('all'); setPfMethod('all'); setPfVerified('all'); }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Date From</Label>
                  <Input type="date" value={pfDateFrom} onChange={e => setPfDateFrom(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date To</Label>
                  <Input type="date" value={pfDateTo} onChange={e => setPfDateTo(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fee Type</Label>
                  <Select value={pfFeeType} onValueChange={setPfFeeType}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {feeTypes.map(ft => <SelectItem key={ft.id} value={String(ft.id)}>{ft.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Method</Label>
                  <Select value={pfMethod} onValueChange={setPfMethod}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Verification</Label>
                  <Select value={pfVerified} onValueChange={setPfVerified}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm">
                <span className="text-muted-foreground">
                  {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
                </span>
                <span className="font-semibold text-green-600">Total: {formatCurrency(filteredTotal)}</span>
                <Button
                  size="sm" variant="outline" className="ml-auto h-7 gap-1.5 text-xs"
                  onClick={exportPaymentsCSV}
                  disabled={filteredPayments.length === 0}
                >
                  <Download className="h-3 w-3" /> Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <DataTable
                  columns={paymentColumns}
                  data={filteredPayments}
                  searchKey="student_name"
                  searchPlaceholder="Search by student name..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================
            ANALYTICS TAB
            ================================================================ */}
        <TabsContent value="analytics" className="space-y-5">
          {/* Sub-nav: Overview vs By Class */}
          <div className="flex gap-2">
            <Button
              variant={analyticsSubTab === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAnalyticsSubTab('overview')}
            >
              <BarChart3 className="h-4 w-4 mr-1.5" /> Overview
            </Button>
            <Button
              variant={analyticsSubTab === 'by_class' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setAnalyticsSubTab('by_class');
                if (byClassData.length === 0) fetchByClassData();
              }}
            >
              <Users className="h-4 w-4 mr-1.5" /> By Class
            </Button>
          </div>

          {/* ---- BY CLASS VIEW ---- */}
          {analyticsSubTab === 'by_class' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Fee Collection by Class</h3>
                  <p className="text-sm text-muted-foreground">Daily fees vs term/other fees collected per class</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchByClassData} disabled={byClassLoading}>
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${byClassLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {byClassLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : byClassData.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No fee collection data yet. Payments will appear here once fees are collected.
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Summary totals bar */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total Daily Collected', value: byClassData.reduce((s, c) => s + c.daily_collected, 0), color: 'text-blue-600' },
                      { label: 'Total Term/Other Collected', value: byClassData.reduce((s, c) => s + c.term_collected, 0), color: 'text-green-600' },
                      { label: 'Grand Total', value: byClassData.reduce((s, c) => s + c.total_collected, 0), color: 'text-purple-600' },
                    ].map(item => (
                      <Card key={item.label}>
                        <CardContent className="p-3">
                          <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                          <div className={`text-lg font-bold ${item.color}`}>{formatCurrency(item.value)}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Stacked bar chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Collection by Class</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={Math.max(220, byClassData.length * 44)}>
                        <BarChart
                          data={byClassData.map(c => ({
                            name: c.class_name,
                            Daily: c.daily_collected,
                            'Term/Other': c.term_collected,
                          }))}
                          layout="vertical"
                          margin={{ left: 8, right: 32, top: 4, bottom: 4 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tickFormatter={v => `₵${(Number(v) / 1000).toFixed(1)}k`} tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                          <RechartsTooltip formatter={(v: any, name: any) => [formatCurrency(Number(v)), name]} />
                          <Bar dataKey="Daily" stackId="a" fill="#3b82f6" name="Daily" />
                          <Bar dataKey="Term/Other" stackId="a" fill="#10b981" name="Term/Other" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="flex gap-4 justify-center mt-2 text-xs">
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500" /> Daily Fees</div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500" /> Term/Other Fees</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detail table */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Breakdown Table</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/40">
                              <th className="text-left px-4 py-2.5 font-medium">Class</th>
                              <th className="text-right px-4 py-2.5 font-medium">Students</th>
                              <th className="text-right px-4 py-2.5 font-medium text-blue-600">Daily Fees</th>
                              <th className="text-right px-4 py-2.5 font-medium text-emerald-600">Term/Other</th>
                              <th className="text-right px-4 py-2.5 font-medium text-purple-700">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {byClassData.map((cls, i) => {
                              const maxTotal = Math.max(...byClassData.map(c => c.total_collected), 1);
                              return (
                                <tr key={cls.class_id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                  <td className="px-4 py-3 font-medium">{cls.class_name}</td>
                                  <td className="px-4 py-3 text-right text-muted-foreground">{cls.total_students}</td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <div className="w-16 bg-muted rounded-full h-1.5 hidden md:block">
                                        <div className="h-1.5 rounded-full bg-blue-400" style={{ width: `${maxTotal > 0 ? (cls.daily_collected / maxTotal) * 100 : 0}%` }} />
                                      </div>
                                      <span className="text-blue-700 font-medium">{formatCurrency(cls.daily_collected)}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <div className="w-16 bg-muted rounded-full h-1.5 hidden md:block">
                                        <div className="h-1.5 rounded-full bg-emerald-400" style={{ width: `${maxTotal > 0 ? (cls.term_collected / maxTotal) * 100 : 0}%` }} />
                                      </div>
                                      <span className="text-emerald-700 font-medium">{formatCurrency(cls.term_collected)}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right font-semibold text-purple-700">{formatCurrency(cls.total_collected)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="border-t bg-muted/40 font-semibold">
                              <td className="px-4 py-2.5">Total</td>
                              <td className="px-4 py-2.5 text-right text-muted-foreground">
                                {byClassData.reduce((s, c) => s + c.total_students, 0)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-blue-700">
                                {formatCurrency(byClassData.reduce((s, c) => s + c.daily_collected, 0))}
                              </td>
                              <td className="px-4 py-2.5 text-right text-emerald-700">
                                {formatCurrency(byClassData.reduce((s, c) => s + c.term_collected, 0))}
                              </td>
                              <td className="px-4 py-2.5 text-right text-purple-700">
                                {formatCurrency(byClassData.reduce((s, c) => s + c.total_collected, 0))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* ---- OVERVIEW ---- */}
          {analyticsSubTab === 'overview' && (<>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                  <CalendarDays className="h-3.5 w-3.5" /> Today
                </div>
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(payments.filter(p => p.payment_date.slice(0, 10) === new Date().toISOString().slice(0, 10)).reduce((s, p) => s + p.amount_paid, 0))}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {payments.filter(p => p.payment_date.slice(0, 10) === new Date().toISOString().slice(0, 10)).length} transactions
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /> This Week
                </div>
                <div className="text-xl font-bold text-blue-600">
                  {formatCurrency(payments.filter(p => p.payment_date.slice(0, 10) >= new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)).reduce((s, p) => s + p.amount_paid, 0))}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {payments.filter(p => p.payment_date.slice(0, 10) >= new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)).length} transactions
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                  <Receipt className="h-3.5 w-3.5" /> Avg per Payment
                </div>
                <div className="text-xl font-bold text-purple-600">
                  {formatCurrency(payments.length > 0 ? payments.reduce((s, p) => s + p.amount_paid, 0) / payments.length : 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{payments.length} total payments</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                  <BarChart3 className="h-3.5 w-3.5" /> Collection Rate
                </div>
                <div className="text-xl font-bold text-amber-600">
                  {summary.collectionRate.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">of expected amount</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Collection by Fee Type */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-500" /> Collection by Fee Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                {collectionByFeeType.length === 0 ? (
                  <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No collection data yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart
                      data={collectionByFeeType.map(f => ({ name: f.fee_type__name, amount: Number(f.total), count: f.transactions }))}
                      layout="vertical"
                      margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={v => `₵${(Number(v) / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                      <RechartsTooltip formatter={(v: any) => [formatCurrency(Number(v)), 'Collected']} />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Collection by Collector */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-500" /> Collection by Staff
                </CardTitle>
              </CardHeader>
              <CardContent>
                {collectionByCollector.length === 0 ? (
                  <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No collection data yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart
                      data={[...collectionByCollector]
                        .sort((a, b) => Number(b.total) - Number(a.total))
                        .slice(0, 8)
                        .map(c => ({
                          name: `${c.collected_by__first_name} ${c.collected_by__last_name}`.trim() || 'Unknown',
                          amount: Number(c.total),
                          count: c.transactions,
                        }))}
                      layout="vertical"
                      margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={v => `₵${(Number(v) / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                      <RechartsTooltip formatter={(v: any) => [formatCurrency(Number(v)), 'Collected']} />
                      <Bar dataKey="amount" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status pie + Top collectors leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Payment Status Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" /> Student Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="h-52 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : pieData.length === 0 ? (
                  <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No data yet.</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%" cy="50%"
                          innerRadius={55} outerRadius={85}
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(v: any, name: any) => [`${v} students`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 justify-center mt-1">
                      {pieData.map(entry => (
                        <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_STATUS_COLORS[entry.name] ?? '#94a3b8' }} />
                          <span>{entry.name}: <strong>{entry.value}</strong></span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Top Collectors Leaderboard */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" /> Top Collectors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {collectionByCollector.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">No collection data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {[...collectionByCollector]
                      .sort((a, b) => Number(b.total) - Number(a.total))
                      .slice(0, 6)
                      .map((c, i) => {
                        const name = `${c.collected_by__first_name} ${c.collected_by__last_name}`.trim() || 'Unknown';
                        const top = Number(collectionByCollector.reduce((mx, x) => Number(x.total) > mx ? Number(x.total) : mx, 0));
                        const rankCls = [
                          'bg-yellow-100 text-yellow-700 border border-yellow-300',
                          'bg-gray-100 text-gray-600 border border-gray-300',
                          'bg-orange-50 text-orange-700 border border-orange-200',
                        ];
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankCls[i] ?? 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{name}</div>
                              <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                                <div
                                  className="h-1.5 rounded-full bg-green-500 transition-all"
                                  style={{ width: `${top > 0 ? Math.min(100, (Number(c.total) / top) * 100) : 0}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-sm font-semibold text-green-600">{formatCurrency(Number(c.total))}</div>
                              <div className="text-xs text-muted-foreground">{c.transactions} txn</div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          </>)}
        </TabsContent>
        <TabsContent value="setup" className="space-y-4">
          {/* Sub-nav */}
          <div className="flex gap-2 flex-wrap">
            {(['types', 'structures', 'bills'] as SetupSection[]).map((sec) => (
              <Button
                key={sec}
                variant={setupSection === sec ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSetupSection(sec)}
              >
                {sec === 'types' && 'Fee Types'}
                {sec === 'structures' && 'Fee Structures (Amounts)'}
                {sec === 'bills' && 'Generate Term Bills'}
              </Button>
            ))}
          </div>

          {/* ---- FEE TYPES ---- */}
          {setupSection === 'types' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Fee Types</h3>
                  <p className="text-sm text-muted-foreground">
                    Define what fees your school charges — tuition, canteen, transport, PTA levy, etc.
                  </p>
                </div>
                <Button size="sm" onClick={openNewFeeTypeForm}>
                  <Plus className="h-4 w-4 mr-1" /> Add Fee Type
                </Button>
              </div>

              {/* Add / Edit form */}
              {ftShowForm && (
                <Card className="border-primary/40">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {editingFeeType ? `Edit: ${editingFeeType.name}` : 'New Fee Type'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input value={ftName} onChange={e => setFtName(e.target.value)} placeholder="e.g. Tuition Fee" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input value={ftDesc} onChange={e => setFtDesc(e.target.value)} placeholder="Optional description" />
                      </div>
                      <div className="space-y-2">
                        <Label>Collection Frequency *</Label>
                        <Select value={ftFreq} onValueChange={(v) => setFtFreq(v as CollectionFrequency)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(Object.entries(FREQUENCY_LABELS) as [CollectionFrequency, string][]).map(([k, label]) => (
                              <SelectItem key={k} value={k}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {(ftFreq === 'WEEKLY' || ftFreq === 'MONTHLY') && (
                        <div className="space-y-2">
                          <Label>
                            {ftFreq === 'WEEKLY' ? 'Day of Week (0=Mon … 6=Sun)' : 'Day of Month (1–31)'}
                          </Label>
                          <Input
                            type="number"
                            min={ftFreq === 'WEEKLY' ? 0 : 1}
                            max={ftFreq === 'WEEKLY' ? 6 : 31}
                            value={ftDay}
                            onChange={e => setFtDay(e.target.value)}
                            placeholder={ftFreq === 'WEEKLY' ? '0–6' : '1–31'}
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Parent Fee Type <span className="text-muted-foreground font-normal text-xs">(optional — leave blank for a main fee type)</span></Label>
                        <Select
                          value={ftParentFeeType || '__none__'}
                          onValueChange={v => setFtParentFeeType(v === '__none__' ? '' : v)}
                        >
                          <SelectTrigger><SelectValue placeholder="None — this is a main fee type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">None (main fee type)</SelectItem>
                            {feeTypes
                              .filter(ft => !ft.parent_fee_type && (!editingFeeType || ft.id !== editingFeeType.id))
                              .map(ft => (
                                <SelectItem key={ft.id} value={String(ft.id)}>{ft.name}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Select a parent to make this a sub-fee type (e.g., "Bus Users Fee" under "Canteen Fee"). Sub-fee types hold the actual amounts; students are assigned to their sub-fee type in Student Management.
                        </p>
                      </div>
                    </div>

                    <Separator />
                    <p className="text-sm font-medium">Who can collect this fee?</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3">
                        <Switch
                          id="ft-class-teacher"
                          checked={ftAllowClassTeacher}
                          onCheckedChange={setFtAllowClassTeacher}
                        />
                        <Label htmlFor="ft-class-teacher" className="cursor-pointer">
                          Class Teachers (own class only)
                        </Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          id="ft-any-teacher"
                          checked={ftAllowAnyTeacher}
                          onCheckedChange={setFtAllowAnyTeacher}
                        />
                        <Label htmlFor="ft-any-teacher" className="cursor-pointer">
                          Any Teacher
                        </Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          id="ft-approval"
                          checked={ftRequireApproval}
                          onCheckedChange={setFtRequireApproval}
                        />
                        <Label htmlFor="ft-approval" className="cursor-pointer">
                          Require Admin Approval
                        </Label>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      School Admin and Principal can always collect any fee type.
                    </p>

                    <div className="flex gap-2 pt-2">
                      <Button onClick={saveFeeType} disabled={ftSaving}>
                        {ftSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        {ftSaving ? 'Saving…' : 'Save Fee Type'}
                      </Button>
                      <Button variant="outline" onClick={() => setFtShowForm(false)} disabled={ftSaving}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* List */}
              <div className="space-y-2">
                {feeTypes.length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      No fee types yet. Click "Add Fee Type" to get started.
                    </CardContent>
                  </Card>
                )}
                {feeTypes.filter(ft => !ft.parent_fee_type).map(ft => (
                  <Card key={ft.id} className={!ft.is_active ? 'opacity-50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{ft.name}</span>
                            <Badge variant="secondary">{FREQUENCY_LABELS[ft.collection_frequency]}</Badge>
                            {ft.has_sub_types && (
                              <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50">
                                {ft.sub_types?.length ?? 0} sub-fee{(ft.sub_types?.length ?? 0) !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {!ft.is_active && <Badge variant="outline" className="text-gray-500">Inactive</Badge>}
                          </div>
                          {ft.description && (
                            <p className="text-sm text-muted-foreground mt-1">{ft.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                            {ft.allow_class_teacher_collection && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">Class Teacher</span>}
                            {ft.allow_any_teacher_collection && <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">Any Teacher</span>}
                            {!ft.allow_class_teacher_collection && !ft.allow_any_teacher_collection && (
                              <span className="bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full border">Admin Only</span>
                            )}
                            {ft.require_payment_approval && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">Requires Approval</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="outline" onClick={() => openEditFeeTypeForm(ft)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => deleteFeeType(ft)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Sub-fee types */}
                      {ft.sub_types && ft.sub_types.length > 0 && (
                        <div className="mt-3 ml-2 space-y-1 border-l-2 border-purple-200 pl-3">
                          <p className="text-xs font-medium text-purple-700 mb-1">Sub-fee types:</p>
                          {ft.sub_types.map(sub => {
                            const fullSub = feeTypes.find(f => f.id === sub.id);
                            return (
                              <div key={sub.id} className="flex items-center justify-between gap-2 bg-purple-50/50 rounded-md px-3 py-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-purple-900">↳ {sub.name}</span>
                                  {fullSub && !fullSub.is_active && <Badge variant="outline" className="text-gray-500 text-xs">Inactive</Badge>}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { const f = feeTypes.find(x => x.id === sub.id); if (f) openEditFeeTypeForm(f); }}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={() => { const f = feeTypes.find(x => x.id === sub.id); if (f) deleteFeeType(f); }}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ---- FEE STRUCTURES ---- */}
          {setupSection === 'structures' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Fee Structures</h3>
                <p className="text-sm text-muted-foreground">
                  Set the amount for each class level per fee type.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Label className="shrink-0">Fee Type:</Label>
                <Select value={structureFeeTypeId} onValueChange={(v) => {
                  setStructureFeeTypeId(v);
                  setStShowForm(false);
                  loadStructures(v);
                }}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    {feeTypes.map(ft => (
                      <SelectItem key={ft.id} value={String(ft.id)}>{ft.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {structureFeeTypeId && (
                  <Button size="sm" onClick={openNewStructureForm}>
                    <Plus className="h-4 w-4 mr-1" /> Add Level Amount
                  </Button>
                )}
              </div>

              {!structureFeeTypeId && (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Select a fee type to manage its class-level amounts.
                  </CardContent>
                </Card>
              )}

              {structureFeeTypeId && stShowForm && (
                <Card className="border-primary/40">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {editingStructure ? `Edit: ${editingStructure.level}` : 'New Class Level Amount'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Class Level *</Label>
                        <Select value={stLevel} onValueChange={setStLevel}>
                          <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                          <SelectContent>
                            {CLASS_LEVELS.map(lv => (
                              <SelectItem key={lv} value={lv}>{lv.replace('_', ' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Tier / Sub-category
                          <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                        </Label>
                        <Input
                          value={stTierLabel}
                          onChange={e => setStTierLabel(e.target.value)}
                          placeholder="e.g. Bus Users, Non-Bus Students, Standard…"
                        />
                        <p className="text-xs text-muted-foreground">
                          Leave empty if all students in this level pay the same amount.
                          Add a tier name to differentiate groups — you can add multiple tiers per level.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Amount (GH₵) *</Label>
                        <Input
                          type="number" step="0.01" min="0"
                          value={stAmount} onChange={e => setStAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date (optional)</Label>
                        <Input type="date" value={stDueDate} onChange={e => setStDueDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveStructure} disabled={stSaving}>
                        {stSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        {stSaving ? 'Saving…' : 'Save'}
                      </Button>
                      <Button variant="outline" onClick={() => setStShowForm(false)} disabled={stSaving}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {structuresLoading ? (
                <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : structures.length === 0 && structureFeeTypeId ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No amounts set for this fee type yet. Add class level amounts above.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {/* Group structures by level */}
                  {Object.entries(
                    structures.reduce((acc, s) => {
                      if (!acc[s.level]) acc[s.level] = [];
                      acc[s.level].push(s);
                      return acc;
                    }, {} as Record<string, FeeStructure[]>)
                  ).map(([level, tiers]) => (
                    <Card key={level} className="border-border">
                      <CardContent className="p-0">
                        {/* Level header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border rounded-t-lg">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{level.replace('_', ' ')}</span>
                            <Badge variant="secondary" className="text-xs">
                              {tiers.length} {tiers.length === 1 ? 'tier' : 'tiers'}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1"
                            onClick={() => {
                              setEditingStructure(null);
                              setStLevel(level);
                              setStTierLabel('');
                              setStAmount('');
                              setStDueDate('');
                              setStShowForm(true);
                            }}
                          >
                            <Plus className="h-3 w-3" /> Add Tier
                          </Button>
                        </div>
                        {/* Tiers */}
                        <div className="divide-y divide-border">
                          {tiers.map(s => (
                            <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                              <div className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-foreground">
                                  {s.tier_label || <span className="text-muted-foreground italic">All Students</span>}
                                </span>
                                <span className="text-sm font-semibold text-foreground ml-3">
                                  {formatCurrency(s.amount)}
                                </span>
                                {s.due_date && (
                                  <span className="text-xs text-muted-foreground ml-3">
                                    Due: {new Date(s.due_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => openEditStructureForm(s)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => deleteStructure(s)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---- GENERATE TERM BILLS ---- */}
          {setupSection === 'bills' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Generate Term Bills</h3>
                <p className="text-sm text-muted-foreground">
                  For TERM and YEAR fee types, generate fee bills for all active students based on their class level amounts.
                  Daily / Monthly fees don't need bills — they are recorded directly as payments.
                </p>
              </div>

              <Card className="border-primary/30">
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Term *</Label>
                      <Select value={billTermId} onValueChange={setBillTermId}>
                        <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                        <SelectContent>
                          {terms.map(t => (
                            <SelectItem key={t.id} value={String(t.id)}>
                              {t.name} {t.is_current ? '(current)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fee Type (optional — all if empty)</Label>
                      <Select value={billFeeTypeId || '_all'} onValueChange={v => setBillFeeTypeId(v === '_all' ? '' : v)}>
                        <SelectTrigger><SelectValue placeholder="All TERM/YEAR fee types" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_all">All TERM / YEAR fee types</SelectItem>
                          {feeTypes.filter(ft => ft.collection_frequency === 'TERM' || ft.collection_frequency === 'YEAR').map(ft => (
                            <SelectItem key={ft.id} value={String(ft.id)}>{ft.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-3">
                      <div className="flex items-center gap-2">
                        <Switch id="overwrite" checked={billOverwrite} onCheckedChange={setBillOverwrite} />
                        <Label htmlFor="overwrite" className="cursor-pointer text-sm">Update existing bills</Label>
                      </div>
                    </div>
                  </div>

                  <Button onClick={generateBills} disabled={billsGenerating || !billTermId} className="w-full md:w-auto">
                    {billsGenerating ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</>
                    ) : (
                      <><Zap className="h-4 w-4 mr-2" />Generate Fee Bills</>
                    )}
                  </Button>

                  {lastBillResult && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{lastBillResult.created}</strong> bills created &nbsp;·&nbsp;
                        <strong>{lastBillResult.updated}</strong> updated &nbsp;·&nbsp;
                        <strong>{lastBillResult.skipped}</strong> skipped
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Bills list */}
              {billTermId && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Bills for selected term</h4>
                    <Button size="sm" variant="outline" onClick={loadTermBills} disabled={termBillsLoading}>
                      <RefreshCw className={`h-3 w-3 mr-1 ${termBillsLoading ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                  </div>
                  {termBillsLoading ? (
                    <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                  ) : termBills.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center text-muted-foreground">
                        No bills generated yet for this term. Click "Generate Fee Bills" above.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border">
                      {/* Desktop Table */}
                      <div className="hidden sm:block">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="text-left p-3">Student</th>
                            <th className="text-left p-3">Class</th>
                            <th className="text-left p-3">Fee Type</th>
                            <th className="text-right p-3">Billed</th>
                            <th className="text-right p-3">Paid</th>
                            <th className="text-right p-3">Balance</th>
                            <th className="text-center p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {termBills.map(b => (
                            <tr key={b.id} className="border-b hover:bg-muted/30">
                              <td className="p-3">
                                <div className="font-medium">{b.student_name}</div>
                                <div className="text-xs text-muted-foreground">{b.student_id}</div>
                              </td>
                              <td className="p-3 text-muted-foreground">{b.class_level} {b.class_section}</td>
                              <td className="p-3">{b.fee_type_name}</td>
                              <td className="p-3 text-right font-mono">{formatCurrency(b.amount_billed)}</td>
                              <td className="p-3 text-right font-mono text-green-600">{formatCurrency(b.amount_paid)}</td>
                              <td className="p-3 text-right font-mono text-red-600">{formatCurrency(b.balance)}</td>
                              <td className="p-3 text-center">
                                <Badge variant="outline" className={BILL_STATUS_COLORS[b.status]}>
                                  {b.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="sm:hidden p-3 space-y-3">
                        {termBills.map(b => (
                          <div key={b.id} className="border rounded-xl p-3 space-y-2 bg-card">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{b.student_name}</p>
                                <p className="text-xs text-muted-foreground">{b.student_id}</p>
                              </div>
                              <Badge variant="outline" className={`text-xs flex-shrink-0 ${BILL_STATUS_COLORS[b.status]}`}>
                                {b.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{b.class_level} {b.class_section}</span>
                              <span>•</span>
                              <span className="font-medium text-foreground">{b.fee_type_name}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">Billed</p>
                                <p className="font-mono font-medium">{formatCurrency(b.amount_billed)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Paid</p>
                                <p className="font-mono font-medium text-green-600">{formatCurrency(b.amount_paid)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Balance</p>
                                <p className="font-mono font-medium text-red-600">{formatCurrency(b.balance)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeeManagement;