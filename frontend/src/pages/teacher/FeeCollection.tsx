import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DollarSign, CheckCircle, Loader2, AlertCircle, Search, XCircle, Receipt,
  Clock, Trash2,
} from "lucide-react";
import { secureApiClient } from "@/lib/secureApiClient";
import {
  feeService,
  type FeeType,
  type StudentSearchResult,
  FREQUENCY_LABELS,
} from "@/services/feeService";
import { staffPermissionService } from "@/services/staffPermissionService";
import { useToast } from "@/hooks/use-toast";

interface MyClass {
  id: number;
  name: string;
  level: string;
}

const FeeCollection = () => {
  const { toast } = useToast();

  // Fixed teacher class
  const [myClass, setMyClass] = useState<MyClass | null>(null);
  // Non-daily fee types this teacher can collect
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [booting, setBooting] = useState(true);

  // Special teacher mode
  const [isSpecialCollector, setIsSpecialCollector] = useState(false);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [allClasses, setAllClasses] = useState<MyClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  // Student search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);

  // Fee structure
  const [structureAmount, setStructureAmount] = useState<number | null>(null);
  const [loadingStructure, setLoadingStructure] = useState(false);

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CHEQUE" | "BANK_TRANSFER" | "MOBILE_MONEY">("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Session payment log
  interface SessionPayment {
    studentName: string;
    studentId: string;
    feeTypeName: string;
    amount: number;
    method: string;
    time: string;
  }
  const [recentPayments, setRecentPayments] = useState<SessionPayment[]>([]);

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      // Check special permissions (returns null when no record exists)
      const specialPerm = await staffPermissionService.getMyPermissions();

      const canCollectSpecial =
        (specialPerm?.can_collect_fees ?? false) &&
        (specialPerm?.fee_collection_enabled ?? false) &&
        (specialPerm?.school_fee_collection_enabled ?? false);

      if (canCollectSpecial) {
        setIsSpecialCollector(true);
        // Load all classes for class selector
        try {
          const clsRes = await secureApiClient.get("/schools/classes/");
          const clsArr: any[] = Array.isArray(clsRes) ? clsRes : (clsRes as any).results || [];
          const mapped = clsArr.map((c: any) => ({ id: c.id, name: c.full_name || c.name || c.level, level: c.level }));
          setAllClasses(mapped);
          if (mapped.length > 0) setSelectedClassId(mapped[0].id);
        } catch { /* handled in render */ }

        // Fee types: those assigned to this special teacher (or all non-daily if no restriction)
        try {
          const all = await feeService.getFeeTypes();
          const allowedIds = specialPerm?.collect_fee_type_ids ?? [];
          const allowed = all.filter(
            (ft: FeeType) =>
              ft.is_active &&
              !ft.parent_fee_type &&
              ft.collection_frequency !== "DAILY" &&
              (allowedIds.length === 0 || allowedIds.includes(ft.id)),
          );
          setFeeTypes(allowed);
          if (allowed.length > 0) setActiveTabId(allowed[0].id);
        } catch { /* handled in render */ }
      } else {
        // Regular class teacher flow
        try {
          const res = await secureApiClient.get("/students/teacher-attendance/my-classes/");
          const classes: any[] = (res as any).classes || [];
          if (classes.length > 0) {
            const cls = { id: classes[0].id, name: classes[0].name, level: classes[0].level };
            setMyClass(cls);
            setSelectedClassId(cls.id);
            setIsClassTeacher(true);
          }
        } catch { /* no class — handled in render */ }

        try {
          const all = await feeService.getFeeTypes();
          const allowed = all.filter(
            (ft: FeeType) =>
              (ft.allow_class_teacher_collection || ft.allow_any_teacher_collection) &&
              ft.is_active &&
              !ft.parent_fee_type &&
              ft.collection_frequency !== "DAILY",
          );
          setFeeTypes(allowed);
          if (allowed.length > 0) setActiveTabId(allowed[0].id);
        } catch { /* handled in render */ }
      }

      setBooting(false);
    })();
  }, []);

  // ── Fetch structure amount when student + tab changes ──────────────────────
  useEffect(() => {
    if (!selectedStudent || !activeTabId) { setStructureAmount(null); return; }
    let cancelled = false;
    setLoadingStructure(true);
    feeService
      .getFeeStructures({ fee_type: activeTabId, level: selectedStudent.class_level })
      .then((data) => {
        if (!cancelled) {
          const raw = data[0]?.amount;
          setStructureAmount(raw != null ? parseFloat(String(raw)) : null);
        }
      })
      .catch(() => { if (!cancelled) setStructureAmount(null); })
      .finally(() => { if (!cancelled) setLoadingStructure(false); });
    return () => { cancelled = true; };
  }, [selectedStudent?.id, activeTabId]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const switchTab = (id: number) => {
    setActiveTabId(id);
    resetForm();
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setSearchQuery("");
    setSearchResults([]);
    setStructureAmount(null);
    setPaymentAmount("");
    setReferenceNumber("");
    setNotes("");
    setPaymentMethod("CASH");
  };

  const searchStudents = useCallback(async (q: string) => {
    if (!selectedClassId || !q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const data = await feeService.searchStudents({ q, class_id: selectedClassId });
      setSearchResults(data || []);
    } catch {
      toast({ title: "Error", description: "Student search failed.", variant: "destructive" });
    } finally {
      setSearchLoading(false);
    }
  }, [selectedClassId, toast]);

  // Debounced auto-search — fires 350 ms after the user stops typing
  useEffect(() => {
    if (selectedStudent) return; // don't re-search after a student is selected
    const id = setTimeout(() => searchStudents(searchQuery), 350);
    return () => clearTimeout(id);
  }, [searchQuery, selectedStudent, searchStudents]);

  const selectStudent = (student: StudentSearchResult) => {
    setSelectedStudent(student);
    setSearchQuery(`${student.first_name} ${student.last_name}`);
    setSearchResults([]);
    setPaymentAmount("");
    setStructureAmount(null);
  };

  const recordPayment = async () => {
    if (!selectedStudent || !activeTabId || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", description: "Enter a valid amount greater than 0.", variant: "destructive" });
      return;
    }
    setPaymentLoading(true);
    try {
      await feeService.createFeePayment({
        student: selectedStudent.id,
        fee_type: activeTabId,
        amount_paid: amount,
        payment_method: paymentMethod,
        reference_number: referenceNumber || undefined,
        notes: notes || undefined,
      });
      toast({
        title: "Payment recorded!",
        description: `GH₵${amount.toFixed(2)} collected from ${selectedStudent.first_name} ${selectedStudent.last_name}.`,
      });
      // Add to session log
      setRecentPayments(prev => [{
        studentName: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
        studentId: selectedStudent.student_id,
        feeTypeName: activeFeeType?.name ?? "",
        amount,
        method: paymentMethod,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }, ...prev]);
      resetForm();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to record payment.", variant: "destructive" });
    } finally {
      setPaymentLoading(false);
    }
  };

  const activeFeeType = feeTypes.find((ft) => ft.id === activeTabId) ?? null;

  // ── Render ────────────────────────────────────────────────────────────────
  if (booting) {
    return (
      <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  if (feeTypes.length === 0) {
    return (
      <div className="p-8 text-center space-y-3">
        <DollarSign className="h-10 w-10 mx-auto text-muted-foreground opacity-30" />
        {isSpecialCollector ? (
          <>
            <p className="font-medium">No fee types assigned to you yet.</p>
            <p className="text-sm text-muted-foreground">Ask the admin to assign fee types to your special collection permission.</p>
          </>
        ) : isClassTeacher ? (
          <>
            <p className="font-medium">No term fees to collect manually.</p>
            <p className="text-sm text-muted-foreground">Daily fees (if any) are recorded directly in the Attendance page.</p>
            <p className="text-sm text-muted-foreground">The admin hasn&#39;t enabled any term/periodic fees for class teacher collection yet.</p>
          </>
        ) : (
          <>
            <p className="font-medium">Fee collection not available.</p>
            <p className="text-sm text-muted-foreground">You are not assigned as a class teacher and have no special fee collection permission.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow">
          <DollarSign className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Fee Collection</h1>
          <p className="text-sm text-muted-foreground">
            {isSpecialCollector
              ? "School-wide fee collection"
              : myClass
              ? `Class: ${myClass.name}`
              : "Record fee payments for your students"}
          </p>
        </div>
      </div>

      {/* Class selector — special teachers only */}
      {isSpecialCollector && allClasses.length > 0 && (
        <div className="space-y-1">
          <Label>Select Class</Label>
          <Select
            value={selectedClassId ? String(selectedClassId) : ""}
            onValueChange={(v) => {
              setSelectedClassId(parseInt(v));
              resetForm();
            }}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {allClasses.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Fee-type tab navigation */}
      {feeTypes.length > 1 ? (
        <div className="flex gap-2 flex-wrap">
          {feeTypes.map((ft) => (
            <button
              key={ft.id}
              type="button"
              onClick={() => switchTab(ft.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activeTabId === ft.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
              }`}
            >
              {ft.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Badge className="text-sm px-3 py-1">{feeTypes[0].name}</Badge>
          <span className="text-xs text-muted-foreground">
            {FREQUENCY_LABELS[feeTypes[0].collection_frequency]}
          </span>
        </div>
      )}

      {/* Payment card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            {activeFeeType?.name} — Record Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Student search */}
          <div className="space-y-1">
            <Label>Search Student</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Type a name or student ID…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value.trim()) setSearchResults([]);
                  }}
                  autoComplete="off"
                />
              </div>
              {searchLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground self-center" />}
            </div>

            {/* Dropdown results */}
            {searchResults.length > 0 && (
              <div className="border rounded-md max-h-48 overflow-y-auto shadow-sm">
                {searchResults.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/60 border-b last:border-0"
                    onClick={() => selectStudent(s)}
                  >
                    <div>
                      <p className="text-sm font-medium">{s.first_name} {s.last_name}</p>
                      <p className="text-xs text-muted-foreground">{s.student_id} · {s.class_level} {s.section}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected student chip */}
          {selectedStudent && (
            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
              <div>
                <p className="font-medium text-sm">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                <p className="text-xs text-muted-foreground">{selectedStudent.student_id} · {selectedStudent.class_level}</p>
              </div>
              <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-destructive transition-colors">
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Fee structure amount */}
          {selectedStudent && activeFeeType && (
            <div className="space-y-1">
              <Label>Fee Amount</Label>
              {loadingStructure ? (
                <div className="h-10 rounded-md border bg-muted animate-pulse" />
              ) : structureAmount != null ? (
                <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                  <DollarSign className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="font-semibold text-blue-800">GH₵{structureAmount.toFixed(2)}</span>
                  <Badge variant="outline" className="ml-auto text-xs border-blue-300 text-blue-700">
                    {FREQUENCY_LABELS[activeFeeType.collection_frequency]}
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

          {/* Payment form — only shown once a student is selected */}
          {selectedStudent && (
            <div className="space-y-4 pt-1">
              {/* Amount being paid */}
              <div className="space-y-1">
                <Label>
                  Amount Being Paid (GH₵) *
                  {structureAmount != null && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (fee: GH₵{structureAmount.toFixed(2)})
                    </span>
                  )}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={structureAmount != null ? String(structureAmount) : "0.00"}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
                {structureAmount != null && !paymentAmount && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setPaymentAmount(String(structureAmount))}
                  >
                    Fill full amount (GH₵{structureAmount.toFixed(2)})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Payment method */}
                <div className="space-y-1">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reference number */}
                <div className="space-y-1">
                  <Label>
                    Reference
                    {(paymentMethod === "CHEQUE" || paymentMethod === "BANK_TRANSFER") && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  <Input
                    placeholder={
                      paymentMethod === "CHEQUE" ? "Cheque no." :
                      paymentMethod === "BANK_TRANSFER" ? "Txn ref." :
                      paymentMethod === "MOBILE_MONEY" ? "Txn ID" : "Optional"
                    }
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Optional notes…"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={recordPayment}
                disabled={paymentLoading || !paymentAmount}
              >
                {paymentLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Recording…</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-2" /> Record Payment</>
                )}
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!selectedStudent && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Search and select a student to record a payment.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Session log */}
      {recentPayments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                This Session
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
                  {recentPayments.length} payment{recentPayments.length !== 1 ? "s" : ""}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-emerald-700">
                  Total: GH₵{recentPayments.reduce((s, p) => s + p.amount, 0).toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => setRecentPayments([])}
                  className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentPayments.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.studentName}</p>
                    <p className="text-xs text-muted-foreground">{p.studentId} · {p.feeTypeName} · {p.method.replace("_", " ")}</p>
                  </div>
                  <div className="shrink-0 text-right ml-4">
                    <p className="text-sm font-semibold text-emerald-700">GH₵{p.amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{p.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeeCollection;
