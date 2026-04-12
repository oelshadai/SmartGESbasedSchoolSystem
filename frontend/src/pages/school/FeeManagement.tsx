import { useState, useEffect, useCallback } from 'react';
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
  Trash2, Plus, Zap
} from 'lucide-react';
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
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState({
    totalExpected: 0,
    totalCollected: 0,
    outstanding: 0,
    collectionRate: 0
  });

  // ------ Setup tab state ------
  type SetupSection = 'types' | 'structures' | 'bills';
  const [setupSection, setSetupSection] = useState<SetupSection>('types');

  // Fee type form
  const [editingFeeType, setEditingFeeType] = useState<FeeType | null>(null);
  const [ftName, setFtName] = useState('');
  const [ftDesc, setFtDesc] = useState('');
  const [ftFreq, setFtFreq] = useState<CollectionFrequency>('TERM');
  const [ftDay, setFtDay] = useState('');
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
      setSummary({
        totalExpected: data.total_outstanding + data.total_collected,
        totalCollected: data.total_collected,
        outstanding: data.total_outstanding,
        collectionRate: data.total_collected > 0 ? (data.total_collected / (data.total_outstanding + data.total_collected)) * 100 : 0
      });
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

  // ----------------------------------------------------------------
  // Setup helpers
  // ----------------------------------------------------------------

  const openNewFeeTypeForm = () => {
    setEditingFeeType(null);
    setFtName(''); setFtDesc(''); setFtFreq('TERM'); setFtDay('');
    setFtAllowClassTeacher(false); setFtAllowAnyTeacher(false); setFtRequireApproval(false);
    setFtShowForm(true);
  };

  const openEditFeeTypeForm = (ft: FeeType) => {
    setEditingFeeType(ft);
    setFtName(ft.name); setFtDesc(ft.description); setFtFreq(ft.collection_frequency);
    setFtDay(ft.collection_day != null ? String(ft.collection_day) : '');
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
    setStLevel(''); setStAmount(''); setStDueDate('');
    setStShowForm(true);
  };

  const openEditStructureForm = (s: FeeStructure) => {
    setEditingStructure(s);
    setStLevel(s.level); setStAmount(String(s.amount));
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
      toast.error(e.message || 'Failed to generate bills');
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
        <Badge variant={payment.is_verified ? 'default' : 'secondary'}>
          {payment.is_verified ? 'Verified' : 'Pending'}
        </Badge>
      )
    }
  ];

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
              label="Total Expected" 
              value={formatCurrency(summary.totalExpected)} 
              icon={<DollarSign className="h-5 w-5" />} 
              color="text-blue-600" 
            />
            <StatCard 
              label="Total Collected" 
              value={formatCurrency(summary.totalCollected)} 
              icon={<TrendingUp className="h-5 w-5" />} 
              color="text-green-600" 
              trend={`${summary.collectionRate.toFixed(1)}% collection rate`}
            />
            <StatCard 
              label="Outstanding" 
              value={formatCurrency(summary.outstanding)} 
              icon={<AlertCircle className="h-5 w-5" />} 
              color="text-red-600" 
            />
            <StatCard 
              label="Total Payments" 
              value={(payments?.length || 0).toLocaleString()} 
              icon={<Receipt className="h-5 w-5" />} 
              color="text-purple-600" 
            />
          </>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="collect">Collect Fees</TabsTrigger>
          <TabsTrigger value="records">Fee Records</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
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
                  
                  <div className="space-y-2">
                    <Label>Amount (GH₵) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="999999.99"
                      placeholder="0.00"
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
                  </div>
                  
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
                    className="flex-1" 
                    disabled={paymentLoading || !selectedStudent || !selectedFeeType || !paymentAmount}
                  >
                    {paymentLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Receipt className="h-4 w-4 mr-2" />
                    )}
                    {paymentLoading ? 'Recording...' : 'Record Payment'}
                  </Button>
                  {selectedStudent && (
                    <Button variant="outline" onClick={() => setSelectedStudent(null)} disabled={paymentLoading}>
                      Clear Student
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle>Student Fee Records</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <DataTable 
                  columns={feeColumns} 
                  data={studentFees || []} 
                  searchKey="student_name" 
                  searchPlaceholder="Search by student name..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <DataTable 
                  columns={paymentColumns} 
                  data={payments || []} 
                  searchKey="student_name" 
                  searchPlaceholder="Search payments..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================
            SETUP TAB
            ================================================================ */}
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
                {feeTypes.map(ft => (
                  <Card key={ft.id} className={!ft.is_active ? 'opacity-50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{ft.name}</span>
                            <Badge variant="secondary">{FREQUENCY_LABELS[ft.collection_frequency]}</Badge>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="space-y-2">
                  {structures.map(s => (
                    <Card key={s.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <span className="font-medium">{s.level.replace('_', ' ')}</span>
                          <span className="text-muted-foreground ml-3">{formatCurrency(s.amount)}</span>
                          {s.due_date && <span className="text-xs text-muted-foreground ml-3">Due: {new Date(s.due_date).toLocaleDateString()}</span>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditStructureForm(s)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteStructure(s)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
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