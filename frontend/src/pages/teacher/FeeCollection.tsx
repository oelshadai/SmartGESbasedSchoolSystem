import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, Users, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { secureApiClient } from "@/lib/secureApiClient";
import { feeService, FeeType, TeacherCollectionRosterEntry } from "@/services/feeService";
import { useToast } from "@/hooks/use-toast";

interface ClassInfo {
  id: number;
  name: string;
  level: string;
}

const FeeCollection = () => {
  const { toast } = useToast();

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [selectedFeeType, setSelectedFeeType] = useState<string>("");
  const [roster, setRoster] = useState<TeacherCollectionRosterEntry[]>([]);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ recorded: number; total_amount: number } | null>(null);

  useEffect(() => {
    fetchClasses();
    fetchFeeTypes();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await secureApiClient.get("/students/teacher-attendance/my-classes/");
      const list: ClassInfo[] = (res.classes || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        level: c.level,
      }));
      setClasses(list);
      if (list.length === 1) setSelectedClass(String(list[0].id));
    } catch {
      toast({ title: "Error", description: "Could not load classes.", variant: "destructive" });
    }
  };

  const fetchFeeTypes = async () => {
    try {
      const all = await feeService.getFeeTypes();
      // Only show fee types the teacher is allowed to collect
      const allowed = all.filter(
        (ft: FeeType) =>
          (ft.allow_class_teacher_collection || ft.allow_any_teacher_collection) &&
          ft.is_active &&
          !ft.parent_fee_type   // only main fee types (they encompass sub-types)
      );
      setFeeTypes(allowed);
    } catch {
      toast({ title: "Error", description: "Could not load fee types.", variant: "destructive" });
    }
  };

  const loadRoster = useCallback(async () => {
    if (!selectedClass || !selectedFeeType) return;
    setLoading(true);
    setRoster([]);
    setChecked({});
    setResult(null);
    try {
      const data = await feeService.getClassCollectionRoster(
        parseInt(selectedClass),
        parseInt(selectedFeeType)
      );
      setRoster(data);
      // Pre-check all students who have an amount
      const init: Record<number, boolean> = {};
      data.forEach((s) => {
        if (s.amount != null) init[s.student_id] = true;
      });
      setChecked(init);
    } catch {
      toast({ title: "Error", description: "Could not load class roster.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedFeeType, toast]);

  useEffect(() => {
    if (selectedClass && selectedFeeType) loadRoster();
  }, [loadRoster]);

  const toggleAll = (value: boolean) => {
    const next: Record<number, boolean> = {};
    roster.forEach((s) => {
      if (s.amount != null) next[s.student_id] = value;
    });
    setChecked(next);
  };

  const checkedStudents = roster.filter((s) => checked[s.student_id] && s.amount != null);
  const netTotal = checkedStudents.reduce((sum, s) => sum + (s.amount ?? 0), 0);

  const handleSubmit = async () => {
    if (checkedStudents.length === 0) {
      toast({ title: "No students selected", description: "Tick at least one student to record payment.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await feeService.bulkCollect({
        fee_type: parseInt(selectedFeeType),
        class_id: parseInt(selectedClass),
        payments: checkedStudents.map((s) => ({
          student: s.student_id,
          amount: s.amount!,
        })),
        payment_method: "CASH",
      });
      setResult(res);
      setChecked({});
      toast({ title: "Payments recorded!", description: `GH₵${res.total_amount.toFixed(2)} collected from ${res.recorded} student(s).` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to record payments.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedFeeTypeName = feeTypes.find((f) => String(f.id) === selectedFeeType)?.name ?? "";

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow">
          <DollarSign className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Fee Collection</h1>
          <p className="text-sm text-muted-foreground">Record fee payments for your class</p>
        </div>
      </div>

      {/* Selectors */}
      <Card>
        <CardContent className="pt-4 space-y-4 md:space-y-0 md:flex md:gap-4 md:items-end">
          <div className="flex-1 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Class</p>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fee Type</p>
            <Select value={selectedFeeType} onValueChange={setSelectedFeeType}>
              <SelectTrigger>
                <SelectValue placeholder="Select fee type" />
              </SelectTrigger>
              <SelectContent>
                {feeTypes.map((ft) => (
                  <SelectItem key={ft.id} value={String(ft.id)}>
                    {ft.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={loadRoster} disabled={!selectedClass || !selectedFeeType || loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </CardContent>
      </Card>

      {/* Result card */}
      {result && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-4 flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Collection Saved!</p>
              <p className="text-sm text-green-700">
                Collected <strong>GH₵{result.total_amount.toFixed(2)}</strong> from{" "}
                <strong>{result.recorded}</strong> student{result.recorded !== 1 ? "s" : ""}.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roster */}
      {roster.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                {selectedFeeTypeName} — Students
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>
                  Check All
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>
                  Clear All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {roster.map((student) => {
                const hasAmount = student.amount != null;
                return (
                  <div
                    key={student.student_id}
                    className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                      hasAmount
                        ? checked[student.student_id]
                          ? "bg-green-50 border border-green-200"
                          : "hover:bg-muted/50"
                        : "opacity-50 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {hasAmount ? (
                        <Checkbox
                          id={`s-${student.student_id}`}
                          checked={!!checked[student.student_id]}
                          onCheckedChange={(v) =>
                            setChecked((prev) => ({ ...prev, [student.student_id]: !!v }))
                          }
                        />
                      ) : (
                        <div className="h-4 w-4 rounded border border-gray-300 bg-gray-100 shrink-0" />
                      )}
                      <label
                        htmlFor={hasAmount ? `s-${student.student_id}` : undefined}
                        className={`text-sm font-medium truncate ${hasAmount ? "cursor-pointer" : "cursor-default text-muted-foreground"}`}
                      >
                        {student.full_name}
                      </label>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasAmount ? (
                        <>
                          <Badge variant="outline" className="font-mono text-xs text-emerald-700 border-emerald-300 bg-emerald-50">
                            GH₵{student.amount!.toFixed(2)}
                          </Badge>
                          {student.tier_label && (
                            <Badge variant="secondary" className="text-xs text-purple-700 bg-purple-50 border-purple-200">
                              {student.tier_label}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Not assigned
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary + Submit */}
      {roster.length > 0 && (
        <Card className="sticky bottom-4 border-primary/30 shadow-lg">
          <CardContent className="pt-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-muted-foreground">
                {checkedStudents.length} of {roster.filter((s) => s.amount != null).length} students selected
              </p>
              <p className="text-lg font-bold text-emerald-700">
                Net Total: GH₵{netTotal.toFixed(2)}
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={submitting || checkedStudents.length === 0}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" /> Record Payments
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {!selectedClass || !selectedFeeType ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground text-sm">
            Select a class and fee type to load the student roster.
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="p-6 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading roster…
          </CardContent>
        </Card>
      ) : roster.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground text-sm">
            No students found for this class and fee type.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default FeeCollection;
