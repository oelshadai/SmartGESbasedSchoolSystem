import { useEffect, useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, KeyRound, Copy, Check, Bell, CheckCircle2, XCircle, UserCheck, UserX, Download } from 'lucide-react';
import secureApiClient from '@/lib/secureApiClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { feeService, FeeType } from '@/services/feeService';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores/authStore';

const StudentsManagement = () => {
  // ... existing state ...

  // Add CSS class for enhanced text visibility
  const pageClasses = "space-y-6 students-management-page form-text-enhanced";
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [accountStudentToDelete, setAccountStudentToDelete] = useState<any>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    other_names: '',
    gender: '',
    date_of_birth: '',
    current_class: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_address: '',
    admission_date: '',
    photo: null as File | null,
  });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [credentials, setCredentials] = useState<{ student_name: string; username: string; password: string; class_name: string; parent_account_created?: boolean; parent_generated_password?: string | null; guardian_email?: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Account creation confirmation dialog
  const [showAccountConfirmDialog, setShowAccountConfirmDialog] = useState(false);
  const [pendingStudentSnapshot, setPendingStudentSnapshot] = useState<typeof form | null>(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fee tier assignments for view dialog
  const [feeTypesWithSubs, setFeeTypesWithSubs] = useState<FeeType[]>([]);
  const [studentFeeTiers, setStudentFeeTiers] = useState<Record<number, Record<number, number | null>>>({});
  const [savingFeeTier, setSavingFeeTier] = useState<number | null>(null);

  // Profile change requests
  const [profileRequests, setProfileRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showRequestsPanel, setShowRequestsPanel] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingRequest, setProcessingRequest] = useState(false);
  // Add state for activation/deactivation
  const [toggleStatus, setToggleStatus] = useState<{ [key: number]: boolean }>({});
  
  // Class filter state
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);  // null = show all
  const [accountFilter, setAccountFilter] = useState<'all' | 'with-account' | 'without-account'>('all');
  const [downloadingRoster, setDownloadingRoster] = useState(false);
  const currentUser = useAuthStore(state => state.user);
  const canManageStudentAccounts = ['SCHOOL_ADMIN', 'PRINCIPAL'].includes(currentUser?.role || '');

  const handleViewStudent = async (student: any) => {
    setSelectedStudent(student);
    setShowViewDialog(true);
    // Load fee types with sub-types and student's current assignments
    try {
      const allTypes = await feeService.getFeeTypes();
      const withSubs = allTypes.filter((ft: FeeType) => ft.has_sub_types && ft.sub_types && ft.sub_types.length > 0);
      setFeeTypesWithSubs(withSubs);
      if (withSubs.length > 0) {
        const assignments = await feeService.getStudentSubTypes({ student: student.id });
        const tiers: Record<number, number | null> = {};
        withSubs.forEach((ft: FeeType) => {
          const found = assignments.find((a: any) => a.main_fee_type === ft.id);
          tiers[ft.id] = found ? found.sub_fee_type : null;
        });
        setStudentFeeTiers(prev => ({ ...prev, [student.id]: tiers }));
      }
    } catch (e) {
      console.error('Failed to load fee tier data', e);
    }
  };

  const handleSaveFeeTier = async (mainFeeTypeId: number, subFeeTypeId: number | null) => {
    if (!selectedStudent) return;
    const studentId = selectedStudent.id;
    const previousSubFeeTypeId = studentFeeTiers[studentId]?.[mainFeeTypeId] ?? null;
    setStudentFeeTiers(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [mainFeeTypeId]: subFeeTypeId },
    }));
    setSavingFeeTier(mainFeeTypeId);
    try {
      await feeService.setStudentSubType({
        student: studentId,
        main_fee_type: mainFeeTypeId,
        sub_fee_type: subFeeTypeId,
      });
      setStudentFeeTiers(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], [mainFeeTypeId]: subFeeTypeId },
      }));
    } catch (e: any) {
      console.error('Failed to save fee tier', e);
      setStudentFeeTiers(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], [mainFeeTypeId]: previousSubFeeTypeId },
      }));
      toast.error(e?.response?.data?.detail || e?.message || 'Failed to save fee assignment');
    } finally {
      setSavingFeeTier(null);
    }
  };

  const fetchProfileRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await secureApiClient.get('/students/profile-change-requests/?status=PENDING');
      setProfileRequests(Array.isArray(res) ? res : res.results || []);
    } catch (err) {
      console.error('Failed to load profile requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (req: any) => {
    setProcessingRequest(true);
    try {
      await secureApiClient.post(`/students/profile-change-requests/${req.id}/approve/`);
      setProfileRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (err: any) {
      alert(err?.message || 'Failed to approve request');
    } finally {
      setProcessingRequest(false);
    }
  };

  const handleOpenReject = (req: any) => {
    setRejectingRequest(req);
    setRejectReason('');
    setShowRejectDialog(true);
  };

  const handleToggleStudentStatus = async (student: any) => {
    const newStatus = !student.is_active;
    setToggleStatus(prev => ({ ...prev, [student.id]: true }));
    
    try {
      await secureApiClient.patch(`/students/${student.id}/`, {
        is_active: newStatus
      });
      
      // Update the student in the local state
      setStudents(prev => 
        prev.map(s => 
          s.id === student.id 
            ? { ...s, is_active: newStatus }
            : s
        )
      );
      
      toast({
        title: 'Status Updated',
        description: `${student.full_name} has been ${newStatus ? 'activated' : 'deactivated'}.`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update student status',
        variant: 'destructive',
      });
    } finally {
      setToggleStatus(prev => ({ ...prev, [student.id]: false }));
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    setProcessingRequest(true);
    try {
      await secureApiClient.post(`/students/profile-change-requests/${rejectingRequest.id}/reject/`, { reason: rejectReason });
      setProfileRequests(prev => prev.filter(r => r.id !== rejectingRequest.id));
      setShowRejectDialog(false);
      setRejectingRequest(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to reject request');
    } finally {
      setProcessingRequest(false);
    }
  };

  const handleViewCredentials = async (student: any) => {
    try {
      const response = await secureApiClient.get(`/students/${student.id}/credentials/`);
      setCredentials(response);
      setShowCredentialsDialog(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load credentials');
    }
  };

  const handleCopyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
    setForm({
      student_id: student.student_id || '',
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      other_names: student.other_names || '',
      gender: student.gender || '',
      date_of_birth: student.date_of_birth || '',
      current_class: student.current_class?.toString() || '',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      guardian_email: student.guardian_email || '',
      guardian_address: student.guardian_address || '',
      admission_date: student.admission_date || '',
      photo: null
    });
    setShowDialog(true);
  };

  const handleDeleteStudent = (student: any) => {
    setSelectedStudent(student);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedStudent) return;
    
    setDeleting(true);
    try {
      await secureApiClient.delete(`/students/${selectedStudent.id}/`);
      setShowDeleteDialog(false);
      setSelectedStudent(null);
      await fetchStudents();
    } catch (err: any) {
      setError(err.message || 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!accountStudentToDelete) return;
    setDeletingAccount(true);
    try {
      await secureApiClient.delete(`/students/${accountStudentToDelete.id}/delete-account/`);
      setStudents(prev => prev.map(student => student.id === accountStudentToDelete.id
        ? { ...student, user: null, has_user_account: false, username: null, password: null }
        : student));
      setAccountStudentToDelete(null);
      toast({
        title: 'Portal account deleted',
        description: `${accountStudentToDelete.full_name}'s student record is unchanged.`,
      });
    } catch (err: any) {
      toast({
        title: 'Could not delete portal account',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  // Apply class and account filters to the complete school roster.
  const selectedClassStudents = selectedClassFilter
    ? students.filter(s => s.current_class?.toString() === selectedClassFilter)
    : students;
  const filteredStudents = selectedClassStudents.filter(student => {
    const hasAccount = Boolean(student.has_user_account ?? student.user);
    if (accountFilter === 'with-account') return hasAccount;
    if (accountFilter === 'without-account') return !hasAccount;
    return true;
  });
  const selectedClass = classes.find((cls: any) => cls.id.toString() === selectedClassFilter);
  const selectedClassName = selectedClass
    ? selectedClass.full_name || `${selectedClass.level_display || selectedClass.level}${selectedClass.section ? ` ${selectedClass.section}` : ''}`
    : 'All classes';

  const handleDownloadRoster = async () => {
    setDownloadingRoster(true);
    try {
      const params = new URLSearchParams({ account_filter: accountFilter });
      if (selectedClassFilter) params.set('class_id', selectedClassFilter);
      const response = await secureApiClient.get<Blob>(`/students/roster-pdf/?${params.toString()}`, {
        responseType: 'blob',
      });
      const blob = response instanceof Blob
        ? response
        : new Blob([response as BlobPart], { type: 'application/pdf' });

      if ((await blob.slice(0, 5).text()) !== '%PDF-') {
        const responseText = await blob.text();
        let errorMessage = 'The server did not return a valid PDF.';
        try {
          const payload = JSON.parse(responseText);
          errorMessage = payload.error || payload.detail || errorMessage;
        } catch {
          if (responseText.trim()) errorMessage = responseText.replace(/<[^>]*>/g, ' ').trim().slice(0, 180);
        }
        throw new Error(errorMessage);
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeClassName = selectedClassName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      link.href = objectUrl;
      link.download = `student_roster_${safeClassName || 'all_classes'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      toast({
        title: 'Roster PDF downloaded',
        description: `${filteredStudents.length} student${filteredStudents.length === 1 ? '' : 's'} exported for ${selectedClassName}.`,
      });
    } catch (err: any) {
      toast({
        title: 'Roster export failed',
        description: err.message || 'Could not generate the student roster PDF.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingRoster(false);
    }
  };

  const columns = [
    { key: 'student_id', label: 'ID', render: (s: any) => <span className="font-mono text-foreground/70">{s.student_id}</span> },
    { key: 'full_name', label: 'Name', render: (s: any) => <span className="font-medium text-foreground">{s.full_name}</span> },
    { key: 'class_name', label: 'Class', render: (s: any) => <Badge variant="outline">{s.class_name || 'No Class'}</Badge> },
    { key: 'has_user_account', label: 'Portal Account', render: (s: any) => (
      <Badge variant="outline" className={Boolean(s.has_user_account ?? s.user)
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-slate-200 bg-slate-50 text-slate-600'}>
        {Boolean(s.has_user_account ?? s.user) ? 'Created' : 'None'}
      </Badge>
    )},
    { key: 'gender', label: 'Gender', render: (s: any) => <span className="text-foreground/70">{s.gender === 'M' ? 'Male' : 'Female'}</span> },
    { key: 'guardian_name', label: 'Guardian', render: (s: any) => <span className="text-foreground">{s.guardian_name}</span> },
    { key: 'guardian_phone', label: 'Phone', render: (s: any) => <span className="text-foreground text-xs">{s.guardian_phone}</span> },
    { key: 'is_active', label: 'Status', render: (s: any) => (
      <Badge variant="outline" className={s.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
        {s.is_active ? 'Active' : 'Inactive'}
      </Badge>
    )},
    { key: 'actions', label: '', render: (s: any) => (
      <div className="flex items-center gap-1 overflow-x-auto">
        <Button 
          variant="ghost" 
          size="sm"
          className={`h-7 w-7 sm:h-8 sm:w-8 shrink-0 ${
            s.is_active 
              ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
              : 'text-green-600 hover:text-green-700 hover:bg-green-50'
          }`}
          title={s.is_active ? 'Deactivate Student' : 'Activate Student'}
          onClick={() => handleToggleStudentStatus(s)}
          disabled={toggleStatus[s.id]}
        >
          {toggleStatus[s.id] ? (
            <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : s.is_active ? (
            <UserX className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : (
            <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </Button>
        {Boolean(s.has_user_account ?? s.user) && (
          <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" title="View Credentials" onClick={() => handleViewCredentials(s)}><KeyRound className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" /></Button>
        )}
        {canManageStudentAccounts && Boolean(s.has_user_account ?? s.user) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 text-destructive"
            title="Delete Portal Account"
            onClick={() => setAccountStudentToDelete(s)}
          >
            <UserX className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" title="View Student" onClick={() => handleViewStudent(s)}><Eye className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" title="Edit Student" onClick={() => handleEditStudent(s)}><Edit className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 text-destructive shrink-0" title="Delete Student" onClick={() => handleDeleteStudent(s)}><Trash2 className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
      </div>
    )},
  ];

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const allStudents: any[] = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const response = await secureApiClient.get(`/students/?page=${page}`);
        if (Array.isArray(response)) {
          allStudents.push(...response);
          hasNextPage = false;
        } else {
          allStudents.push(...(response.results || response.data || []));
          hasNextPage = Boolean(response.next);
          page += 1;
        }
      }

      setStudents(allStudents);
      setError(null);
    } catch (err: any) {
      console.error('Students API error:', err);
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await secureApiClient.get('/schools/classes/');
      console.log('Classes API response:', response);
      setClasses(Array.isArray(response) ? response : response.results || response.data || []);
    } catch (err: any) {
      console.error('Failed to load classes:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const handleOpenDialog = () => {
    setForm({
      student_id: '',
      first_name: '',
      last_name: '',
      other_names: '',
      gender: '',
      date_of_birth: '',
      current_class: '',
      guardian_name: '',
      guardian_phone: '',
      guardian_email: '',
      guardian_address: '',
      admission_date: '',
      photo: null,
    });
    setFormError(null);
    setEditingStudent(null);
    setShowDialog(true);
  };

  const handleFormChange = (field: string, value: string | File | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateStudent = async () => {
    setFormError(null);

    if (!form.student_id || !form.first_name || !form.last_name || !form.gender || !form.date_of_birth || !form.guardian_name || !form.guardian_phone || !form.guardian_address || !form.admission_date) {
      setFormError('Please fill all required fields.');
      return;
    }

    if (!editingStudent) {
      // New student: close the form and ask whether to create a login account
      setPendingStudentSnapshot({ ...form });
      setConfirmError(null);
      setShowDialog(false);
      setShowAccountConfirmDialog(true);
      return;
    }

    // Editing existing student
    setCreating(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          if (key === 'photo' && value instanceof File) {
            formData.append(key, value);
          } else if (key !== 'photo') {
            formData.append(key, value as string);
          }
        }
      });
      await secureApiClient.put(`/students/${editingStudent.id}/`, formData);
      setShowDialog(false);
      setEditingStudent(null);
      await fetchStudents();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update student');
    } finally {
      setCreating(false);
    }
  };

  const handleAccountConfirmed = async (createAccount: boolean) => {
    if (!pendingStudentSnapshot) return;
    setConfirmSubmitting(true);
    setConfirmError(null);
    try {
      const snapshot = pendingStudentSnapshot;
      const formData = new FormData();
      Object.entries(snapshot).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          if (key === 'photo' && value instanceof File) {
            formData.append(key, value);
          } else if (key !== 'photo') {
            formData.append(key, value as string);
          }
        }
      });
      formData.append('create_account', createAccount ? 'true' : 'false');

      const response = await secureApiClient.post('/students/', formData);

      setShowAccountConfirmDialog(false);
      setPendingStudentSnapshot(null);

      const newStudent = response?.data || response;
      if (createAccount && newStudent) {
        setCredentials({
          student_name: `${newStudent.first_name || snapshot.first_name} ${newStudent.last_name || snapshot.last_name}`,
          username: newStudent.generated_username || newStudent.username || `std_${snapshot.student_id}`,
          password: newStudent.generated_password || newStudent.password || 'Contact admin',
          class_name: newStudent.class_name || 'Assigned class',
          parent_account_created: newStudent.parent_account_created || false,
          parent_generated_password: newStudent.parent_generated_password || null,
          guardian_email: snapshot.guardian_email || '',
        });
        setShowCredentialsDialog(true);
      } else {
        toast({
          title: 'Student Added',
          description: `${snapshot.first_name} ${snapshot.last_name} was created without a login account.`,
        });
      }
      await fetchStudents();
    } catch (err: any) {
      setConfirmError(err.message || 'Failed to create student');
    } finally {
      setConfirmSubmitting(false);
    }
  };

  return (
    <div className="min-h-full w-full max-w-full overflow-x-hidden">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-full">
      <PageHeader 
        title="Students Management" 
        description="Manage student records and enrollment"
        action={
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-foreground/70 flex-wrap">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500" />
                <span className="whitespace-nowrap">Active: {filteredStudents.filter(s => s.is_active).length}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500" />
                <span className="whitespace-nowrap">Inactive: {filteredStudents.filter(s => !s.is_active).length}</span>
              </div>
            </div>
            <Button onClick={handleOpenDialog} size="sm" className="shrink-0">
              <span className="hidden sm:inline">Add Student</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        }
      />

      {/* Profile Change Requests Panel */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
        <div className="text-xs sm:text-sm text-foreground/70 bg-blue-50 border border-blue-200 rounded-lg px-2 sm:px-3 py-2 flex-1">
          💡 <strong>Note:</strong> Only active students will be included when generating fee bills. 
          Inactive students are excluded from billing and class operations.
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 sm:gap-2 shrink-0 text-xs sm:text-sm"
          onClick={() => {
            setShowRequestsPanel(v => !v);
            if (!showRequestsPanel) fetchProfileRequests();
          }}
        >
          <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Profile Change Requests</span>
          <span className="sm:hidden">Requests</span>
          {profileRequests.length > 0 && (
            <Badge className="bg-amber-500 text-white border-0 text-xs ml-1">{profileRequests.length}</Badge>
          )}
        </Button>
      </div>

      {showRequestsPanel && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Pending Profile Change Requests</h3>
            <Button variant="ghost" size="sm" onClick={fetchProfileRequests} disabled={loadingRequests}>
              {loadingRequests ? 'Loading…' : 'Refresh'}
            </Button>
          </div>
          {loadingRequests ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading requests…</p>
          ) : profileRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No pending requests.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {profileRequests.map((req: any) => (
                <div key={req.id} className="border border-border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{req.requester_name}</span>
                        <Badge variant="outline" className="text-xs">{req.requester_type}</Badge>
                      </div>
                      <div className="space-y-0.5">
                        {Object.entries(req.requested_changes || {}).map(([k, v]) => (
                          <p key={k} className="text-xs text-foreground/60">
                            <span className="font-medium capitalize">{k.replace(/_/g, ' ')}:</span>{' '}
                            <span className="text-foreground">{String(v)}</span>
                          </p>
                        ))}
                      </div>
                      <p className="text-xs text-foreground/60 mt-1">
                        {new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => handleApproveRequest(req)}
                        disabled={processingRequest}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                        onClick={() => handleOpenReject(req)}
                        disabled={processingRequest}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {loading ? (
        <div className="bg-muted/50 rounded-lg p-8 text-center text-foreground/60">Loading students...</div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">{error}</div>
      ) : (
        <>
          {/* Class Filter and Roster Counts */}
          <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid w-full gap-3 sm:flex-1 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="student-class-filter" className="text-sm font-semibold text-foreground">Filter by class</label>
                <Select
                  value={selectedClassFilter ?? '__all__'}
                  onValueChange={value => setSelectedClassFilter(value === '__all__' ? null : value)}
                >
                  <SelectTrigger id="student-class-filter" className="w-full">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All classes</SelectItem>
                    {classes.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.full_name || `${cls.level_display || cls.level}${cls.section ? ` ${cls.section}` : ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="student-account-filter" className="text-sm font-semibold text-foreground">Portal account</label>
                <Select value={accountFilter} onValueChange={value => setAccountFilter(value as typeof accountFilter)}>
                  <SelectTrigger id="student-account-filter" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All students</SelectItem>
                    <SelectItem value="with-account">Has account</SelectItem>
                    <SelectItem value="without-account">No account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Showing {filteredStudents.length} of {selectedClassStudents.length} students in this class filter.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Students in school</p>
                <p className="text-lg font-semibold text-foreground">{students.length}</p>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  {selectedClassName}
                </p>
                <p className="text-lg font-semibold text-foreground">{selectedClassStudents.length} students</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 gap-2"
              onClick={handleDownloadRoster}
              disabled={downloadingRoster || filteredStudents.length === 0}
            >
              <Download className="h-4 w-4" />
              {downloadingRoster ? 'Preparing PDF...' : 'Download PDF'}
            </Button>
          </div>

          {/* Data Table */}
          <DataTable columns={columns} data={Array.isArray(filteredStudents) ? filteredStudents : []} searchKey="full_name" searchPlaceholder="Search students..." />
        </>
      )}

      {/* Add/Edit Student Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="student-form-dialog max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
            <DialogDescription>
              Fill in the student information below. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-foreground">Student ID *</label>
                <Input value={form.student_id} onChange={e => handleFormChange('student_id', e.target.value)} placeholder="Student ID" className="text-foreground" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-foreground">Admission Date *</label>
                <Input value={form.admission_date} onChange={e => handleFormChange('admission_date', e.target.value)} type="date" className="text-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-foreground">First Name *</label>
                <Input value={form.first_name} onChange={e => handleFormChange('first_name', e.target.value)} placeholder="First Name" className="text-foreground" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-foreground">Last Name *</label>
                <Input value={form.last_name} onChange={e => handleFormChange('last_name', e.target.value)} placeholder="Last Name" className="text-foreground" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-foreground">Other Names</label>
                <Input value={form.other_names} onChange={e => handleFormChange('other_names', e.target.value)} placeholder="Other Names" className="text-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-foreground">Gender *</label>
                <Select value={form.gender} onValueChange={value => handleFormChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-foreground">Date of Birth *</label>
                <Input value={form.date_of_birth} onChange={e => handleFormChange('date_of_birth', e.target.value)} type="date" className="text-foreground" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-foreground">Current Class</label>
                <Select value={form.current_class} onValueChange={value => handleFormChange('current_class', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>{cls.full_name || `${cls.level_display || cls.level} ${cls.section || ''}`.trim()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-foreground">Guardian Name *</label>
                <Input value={form.guardian_name} onChange={e => handleFormChange('guardian_name', e.target.value)} placeholder="Guardian Name" className="text-foreground" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-foreground">Guardian Phone *</label>
                <Input value={form.guardian_phone} onChange={e => handleFormChange('guardian_phone', e.target.value)} placeholder="Guardian Phone" className="text-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-foreground">Guardian Email</label>
                <Input value={form.guardian_email} onChange={e => handleFormChange('guardian_email', e.target.value)} placeholder="Guardian Email" type="email" className="text-foreground" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-foreground">Guardian Address *</label>
                <Input value={form.guardian_address} onChange={e => handleFormChange('guardian_address', e.target.value)} placeholder="Guardian Address" className="text-foreground" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Student Photo</label>
              <Input onChange={e => handleFormChange('photo', e.target.files?.[0] || null)} type="file" accept="image/*" className="text-foreground" />
            </div>
          </div>
          <DialogFooter>
            {formError && <div className="text-destructive text-sm">{formError}</div>}
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditingStudent(null); }}>Cancel</Button>
            <Button onClick={handleCreateStudent} disabled={creating}>
              {creating ? 'Saving...' : editingStudent ? 'Update Student' : 'Create Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Student Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="student-details-fields grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div><strong>Student ID:</strong> {selectedStudent.student_id}</div>
                <div><strong>Name:</strong> {selectedStudent.full_name}</div>
                <div><strong>Gender:</strong> {selectedStudent.gender === 'M' ? 'Male' : 'Female'}</div>
                <div><strong>Class:</strong> {selectedStudent.class_name || 'No Class'}</div>
                <div><strong>Guardian:</strong> {selectedStudent.guardian_name}</div>
                <div><strong>Phone:</strong> {selectedStudent.guardian_phone}</div>
              </div>

              {/* Fee Tier Assignments */}
              {feeTypesWithSubs.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-sm font-semibold mb-2 text-purple-800">Fee Tier Assignments</p>
                  <div className="space-y-2">
                    {feeTypesWithSubs.map(ft => (
                      <div key={ft.id} className="flex items-center justify-between gap-3 bg-purple-50 rounded-md px-3 py-2">
                        <span className="text-sm font-medium text-purple-900 shrink-0">{ft.name}</span>
                        <div className="flex items-center gap-2 min-w-0">
                          <Select
                            value={studentFeeTiers[selectedStudent.id]?.[ft.id] != null ? String(studentFeeTiers[selectedStudent.id][ft.id]) : '__none__'}
                            onValueChange={v => {
                              const subId = v === '__none__' ? null : parseInt(v);
                              void handleSaveFeeTier(ft.id, subId);
                            }}
                          >
                            <SelectTrigger className="w-44 h-8 text-xs">
                              <SelectValue placeholder="Not assigned" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Not assigned</SelectItem>
                              {ft.sub_types?.map(sub => (
                                <SelectItem key={sub.id} value={String(sub.id)}>{sub.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {savingFeeTier === ft.id && (
                            <span className="text-xs text-foreground/60">Saving…</span>
                          )}
                          {savingFeeTier !== ft.id && studentFeeTiers[selectedStudent.id]?.[ft.id] != null && (
                            <span className="text-xs text-green-600">✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Assign each sub-fee type so this student pays the correct amount when teacher collects fees.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-600" />
              Student Portal Credentials
            </DialogTitle>
            <DialogDescription>
              Use these credentials to log in to the student portal.
            </DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="space-y-4">
              <div className="text-center font-medium text-lg">{credentials.student_name}</div>
              <div className="text-center text-sm text-muted-foreground">{credentials.class_name}</div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Username</div>
                    <div className="font-mono font-medium text-base">{credentials.username}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyToClipboard(credentials.username, 'username')}>
                    {copiedField === 'username' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="border-t border-border" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Password</div>
                    <div className="font-mono font-medium text-base">{credentials.password}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyToClipboard(credentials.password, 'password')}>
                    {copiedField === 'password' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-foreground/60 text-center">Students should change their password on first login.</p>
              {credentials.parent_account_created && credentials.parent_generated_password && (
                <>
                  <div className="border-t border-border pt-3">
                    <div className="text-sm font-medium mb-2 flex items-center gap-2">
                      <span>Parent/Guardian Portal Access</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Auto-created</span>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-foreground/60">Email (login)</div>
                          <div className="font-mono text-sm">{credentials.guardian_email}</div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyToClipboard(credentials.guardian_email || '', 'g_email')}>
                          {copiedField === 'g_email' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-foreground/60">Password</div>
                          <div className="font-mono text-sm">{credentials.parent_generated_password}</div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyToClipboard(credentials.parent_generated_password || '', 'g_pass')}>
                          {copiedField === 'g_pass' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-foreground/60 mt-1">Share these credentials with the parent/guardian so they can access the Parent Portal.</p>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowCredentialsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Creation Confirmation Dialog */}
      <Dialog
        open={showAccountConfirmDialog}
        onOpenChange={(open) => {
          if (!open && !confirmSubmitting) {
            setShowAccountConfirmDialog(false);
            setPendingStudentSnapshot(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              Create Login Account?
            </DialogTitle>
            <DialogDescription>
              Do you want to create a student portal login account for{' '}
              <strong>
                {pendingStudentSnapshot
                  ? `${pendingStudentSnapshot.first_name} ${pendingStudentSnapshot.last_name}`
                  : 'this student'}
              </strong>?
              <br />
              <span className="text-xs">
                Not all students need portal access (e.g., kindergarteners).
                You can always create an account later.
              </span>
            </DialogDescription>
          </DialogHeader>
          {confirmError && (
            <div className="text-destructive text-sm rounded-md bg-destructive/10 px-3 py-2">
              {confirmError}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleAccountConfirmed(false)}
              disabled={confirmSubmitting}
              className="flex-1"
            >
              <UserX className="h-4 w-4 mr-2" />
              No, Skip Account
            </Button>
            <Button
              onClick={() => handleAccountConfirmed(true)}
              disabled={confirmSubmitting}
              className="flex-1"
            >
              {confirmSubmitting ? (
                'Creating...'
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Yes, Create Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedStudent?.full_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(accountStudentToDelete)}
        onOpenChange={open => {
          if (!open && !deletingAccount) setAccountStudentToDelete(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Student Portal Account</DialogTitle>
            <DialogDescription>
              This permanently removes {accountStudentToDelete?.full_name}'s login account. The student record, class placement, grades, and attendance will remain.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountStudentToDelete(null)} disabled={deletingAccount}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteAccount} disabled={deletingAccount}>
              {deletingAccount ? 'Deleting account...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Profile Change Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Profile Change</DialogTitle>
            <DialogDescription>
              Optionally provide a reason for rejecting this request.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Reason (optional)"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={processingRequest}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmReject} disabled={processingRequest}>
              {processingRequest ? 'Rejecting…' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
};

export default StudentsManagement;