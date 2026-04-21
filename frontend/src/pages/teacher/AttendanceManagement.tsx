import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckCircle, XCircle, Clock, Users, UserCheck, DollarSign, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { secureApiClient } from "@/lib/secureApiClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { feeService, type FeeType, type TeacherCollectionRosterEntry } from "@/services/feeService";
import { staffPermissionService } from "@/services/staffPermissionService";

interface Student {
  id: number;
  student_id: string;
  name: string;
  photo?: string;
  current_status: 'present' | 'absent' | 'late';
}

interface Class {
  id: number;
  name: string;
  level: string;
  student_count: number;
  attendance_taken_today: boolean;
}

const AttendanceManagement = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [attendanceAlreadyTaken, setAttendanceAlreadyTaken] = useState(false);
  // Daily fee collection embedded in attendance
  const [dailyFeeType, setDailyFeeType] = useState<FeeType | null>(null);
  const [feeRoster, setFeeRoster] = useState<TeacherCollectionRosterEntry[]>([]);
  const [feePaid, setFeePaid] = useState<Record<number, boolean>>({});
  const [savedFeeAmount, setSavedFeeAmount] = useState<number>(0);
  const [savedFeeCount, setSavedFeeCount] = useState<number>(0);
  // Cover classes
  const [coverClassIds, setCoverClassIds] = useState<number[]>([]);
  const [coverClasses, setCoverClasses] = useState<Class[]>([]);
  const [selectedCoverClass, setSelectedCoverClass] = useState<string>("");
  const [coverStudents, setCoverStudents] = useState<Student[]>([]);
  const [coverAttendance, setCoverAttendance] = useState<Record<number, string>>({});
  const [coverAlreadyTaken, setCoverAlreadyTaken] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
    fetchCoverPermission();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      fetchDailyFees();
    }
  }, [selectedClass, date]);

  const fetchClasses = async () => {
    try {
      const response = await secureApiClient.get("/students/teacher-attendance/my-classes/");
      const classesData = response.classes || [];
      setClasses(classesData);
      
      // Auto-select the first class if only one
      if (classesData.length === 1) {
        setSelectedClass(classesData[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({ 
        title: "Error", 
        description: "Failed to load your assigned classes. You may not be assigned as a class teacher.", 
        variant: "destructive" 
      });
    }
  };

  const fetchStudents = async () => {
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const response = await secureApiClient.get(
        `/students/teacher-attendance/class-students/?class_id=${selectedClass}&date=${dateStr}`
      );
      
      setStudents(response.students || []);
      setAttendanceAlreadyTaken(response.attendance_already_taken || false);
      
      // Set initial attendance state from existing records
      const initialAttendance: Record<number, string> = {};
      response.students?.forEach((student: Student) => {
        initialAttendance[student.id] = student.current_status;
      });
      setAttendance(initialAttendance);
      
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({ title: "Error", description: "Failed to load students", variant: "destructive" });
    }
  };

  const fetchCoverPermission = async () => {
    try {
      const perm = await staffPermissionService.getMyPermissions();
      if (perm && perm.can_cover_attendance && perm.cover_class_ids.length > 0) {
        setCoverClassIds(perm.cover_class_ids);
        // For each cover class id we need Class info — reuse /my-classes/ response
        const res = await secureApiClient.get("/students/teacher-attendance/my-classes/");
        const allCls: Class[] = (res as any).classes || [];
        // Also try fetching from school classes endpoint to get cover classes not in my-classes
        try {
          const schoolCls = await secureApiClient.get("/schools/classes/");
          const schoolArr: any[] = Array.isArray(schoolCls) ? schoolCls : (schoolCls as any).results || [];
          const extra = schoolArr
            .filter((c: any) => perm.cover_class_ids.includes(c.id) && !allCls.find(x => x.id === c.id))
            .map((c: any) => ({ id: c.id, name: c.full_name || c.level, level: c.level, student_count: 0, attendance_taken_today: false }));
          const combined = [...allCls.filter(c => perm.cover_class_ids.includes(c.id)), ...extra];
          setCoverClasses(combined);
          if (combined.length > 0) setSelectedCoverClass(String(combined[0].id));
        } catch {
          const filtered = allCls.filter(c => perm.cover_class_ids.includes(c.id));
          setCoverClasses(filtered);
          if (filtered.length > 0) setSelectedCoverClass(String(filtered[0].id));
        }
      }
    } catch { /* no cover permission — fine */ }
  };

  useEffect(() => {
    if (selectedCoverClass) fetchCoverStudents();
  }, [selectedCoverClass, date]);

  const fetchCoverStudents = async () => {
    if (!selectedCoverClass) return;
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const response = await secureApiClient.get(
        `/students/teacher-attendance/class-students/?class_id=${selectedCoverClass}&date=${dateStr}`
      );
      setCoverStudents(response.students || []);
      setCoverAlreadyTaken(response.attendance_already_taken || false);
      const init: Record<number, string> = {};
      response.students?.forEach((s: Student) => { init[s.id] = s.current_status; });
      setCoverAttendance(init);
    } catch {
      toast({ title: "Error", description: "Failed to load cover class students", variant: "destructive" });
    }
  };

  const saveCoverAttendance = async () => {
    if (!selectedCoverClass) return;
    setCoverLoading(true);
    try {
      const attendanceData = coverStudents.map(s => ({
        student_id: s.id,
        status: coverAttendance[s.id] || 'absent',
      }));
      const response = await secureApiClient.post("/students/teacher-attendance/save-attendance/", {
        class_id: parseInt(selectedCoverClass),
        date: format(date, "yyyy-MM-dd"),
        attendance: attendanceData,
      });
      toast({ title: "Cover attendance saved", description: `${response.saved_count} new records, ${response.updated_count} updated.` });
      setCoverAlreadyTaken(true);
    } catch (error: any) {
      toast({ title: "Error", description: error?.response?.data?.error || "Failed to save cover attendance", variant: "destructive" });
    } finally {
      setCoverLoading(false);
    }
  };

  const fetchDailyFees = async () => {
    if (!selectedClass) return;
    try {
      const allTypes = await feeService.getFeeTypes();
      const dailyType = allTypes.find(
        (ft: FeeType) =>
          ft.collection_frequency === 'DAILY' &&
          ft.allow_class_teacher_collection &&
          ft.is_active &&
          !ft.parent_fee_type
      ) ?? null;
      setDailyFeeType(dailyType);
      setFeePaid({});
      setSavedFeeAmount(0);
      setSavedFeeCount(0);
      if (dailyType) {
        const roster = await feeService.getClassCollectionRoster(
          parseInt(selectedClass),
          dailyType.id
        );
        console.log('[Attendance] Fee roster loaded:', roster);
        setFeeRoster(roster || []);
        // Restore already-collected amount from backend
        const alreadyCollected = (roster || []).reduce((s, r) => s + (r.paid_today || 0), 0);
        const alreadyCount = (roster || []).filter(r => (r.paid_today || 0) > 0).length;
        setSavedFeeAmount(alreadyCollected);
        setSavedFeeCount(alreadyCount);
        // Pre-mark students who already paid today
        const prePaid: Record<number, boolean> = {};
        (roster || []).forEach(r => { if ((r.paid_today || 0) > 0) prePaid[r.student_id] = true; });
        setFeePaid(prePaid);
      } else {
        setFeeRoster([]);
      }
    } catch {
      // non-critical — attendance still works
      setDailyFeeType(null);
      setFeeRoster([]);
    }
  };

  const markAttendance = (studentId: number, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    const allPresentAttendance: Record<number, string> = {};
    students.forEach(student => {
      allPresentAttendance[student.id] = 'present';
    });
    setAttendance(allPresentAttendance);
  };

  const markAllAbsent = () => {
    const allAbsentAttendance: Record<number, string> = {};
    students.forEach(student => {
      allAbsentAttendance[student.id] = 'absent';
    });
    setAttendance(allAbsentAttendance);
  };

  const saveAttendance = async () => {
    if (!selectedClass) {
      toast({ title: "Error", description: "Please select a class", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const attendanceData = students.map(student => ({
        student_id: student.id,
        status: attendance[student.id] || 'absent'
      }));

      const response = await secureApiClient.post("/students/teacher-attendance/save-attendance/", {
        class_id: parseInt(selectedClass),
        date: format(date, "yyyy-MM-dd"),
        attendance: attendanceData
      });

      // Also record daily fee payments if any student was marked paid
      let feeMsg = "";
      if (dailyFeeType) {
        const paidStudents = feeRoster.filter(
          (r) => feePaid[r.student_id] && r.amount != null && !(r.paid_today && r.paid_today > 0)
        );
        if (paidStudents.length > 0) {
          try {
            const feeRes = await feeService.bulkCollect({
              fee_type: dailyFeeType.id,
              class_id: parseInt(selectedClass),
              payments: paidStudents.map((r) => ({ student: r.student_id, amount: r.amount! })),
              payment_method: "CASH",
            });
            setSavedFeeAmount(prev => prev + (feeRes.total_amount || 0));
            setSavedFeeCount(prev => prev + (feeRes.recorded || 0));
            feeMsg = ` · GH₵${feeRes.total_amount.toFixed(2)} fee collected from ${feeRes.recorded} student(s).`;
          } catch {
            toast({ title: "Fee warning", description: "Attendance saved but fee collection failed.", variant: "destructive" });
          }
        }
      }

      toast({ 
        title: "Success", 
        description: `Attendance saved. ${response.saved_count} new records, ${response.updated_count} updated.${feeMsg}`
      });
      
      // Refresh classes to update attendance status
      fetchClasses();
      setAttendanceAlreadyTaken(true);
      setFeePaid({});
      
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast({ 
        title: "Error", 
        description: error.response?.data?.error || "Failed to save attendance", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceSummary = () => {
    const present = Object.values(attendance).filter(status => status === 'present').length;
    const absent = Object.values(attendance).filter(status => status === 'absent').length;
    const late = Object.values(attendance).filter(status => status === 'late').length;
    const total = students.length;
    
    return { present, absent, late, total };
  };

  const summary = getAttendanceSummary();

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Users className="h-5 w-5" />
            Class Attendance
          </CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Take attendance for your assigned classes.
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Class</label>
              {classes.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 border rounded-md">
                  No classes assigned. Only class teachers can take attendance.
                </div>
              ) : (
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{cls.name}</span>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge variant="outline">{cls.student_count} students</Badge>
                            {cls.attendance_taken_today && (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Taken
                              </Badge>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Select Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar 
                    mode="single" 
                    selected={date} 
                    onSelect={(d) => d && setDate(d)}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {selectedClass && students.length > 0 && (
            <>
              {/* Attendance Summary */}
              <div className={`grid grid-cols-2 ${dailyFeeType ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg`}>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold">{summary.total}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{summary.present}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Present</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-red-600">{summary.absent}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Absent</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">{summary.late}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Late</p>
                </div>
                {dailyFeeType && (() => {
                  const roster = feeRoster || [];
                  const withAmount = roster.filter(r => r.amount != null);
                  const totalCollectable = withAmount.reduce((s, r) => s + (r.amount || 0), 0);
                  const pendingCollect = roster.filter(r => feePaid[r.student_id] && r.amount != null).reduce((s, r) => s + (r.amount || 0), 0);
                  const collected = savedFeeAmount + pendingCollect;
                  return (
                    <div className="text-center col-span-2 sm:col-span-1">
                      <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                        GH₵{collected.toFixed(2)}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {totalCollectable > 0 ? `of GH₵${totalCollectable.toFixed(2)}` : 'Fee Collected'}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 items-center">
                <Button variant="outline" size="sm" onClick={markAllPresent} className="text-xs sm:text-sm">
                  Mark All Present
                </Button>
                <Button variant="outline" size="sm" onClick={markAllAbsent} className="text-xs sm:text-sm">
                  Mark All Absent
                </Button>
                {attendanceAlreadyTaken && (
                  <Badge variant="secondary" className="text-xs sm:ml-auto">
                    Already taken
                  </Badge>
                )}
              </div>

              {/* Desktop Table - hidden on small screens */}
              <div className="hidden sm:block border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Student ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Name</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Status</th>
                      {dailyFeeType && (
                        <th className="px-4 py-3 text-center text-sm font-medium text-foreground">
                          <div className="flex items-center justify-center gap-1">
                            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                            {dailyFeeType.name}
                          </div>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.map(student => {
                          const rosterEntry = (feeRoster || []).find(r => r.student_id === student.id);
                          const hasFee = dailyFeeType && rosterEntry && rosterEntry.amount != null;
                          const alreadyPaidToday = !!(rosterEntry?.paid_today && rosterEntry.paid_today > 0);
                          const paid = !!feePaid[student.id];
                          return (
                            <tr key={student.id} className={`hover:bg-muted/50 ${paid ? 'bg-emerald-50 dark:bg-emerald-950/30' : ''}`}>
                              <td className="px-4 py-3 text-sm font-medium">{student.student_id}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {student.photo && (
                                    <img
                                      src={student.photo}
                                      alt={student.name}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  )}
                                  <span className="text-sm">{student.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center gap-2">
                                  <Button
                                    size="sm"
                                    variant={attendance[student.id] === "present" ? "default" : "outline"}
                                    onClick={() => markAttendance(student.id, "present")}
                                    className={attendance[student.id] === "present" ? "bg-green-600 hover:bg-green-700" : ""}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={attendance[student.id] === "absent" ? "destructive" : "outline"}
                                    onClick={() => markAttendance(student.id, "absent")}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={attendance[student.id] === "late" ? "secondary" : "outline"}
                                    onClick={() => markAttendance(student.id, "late")}
                                    className={attendance[student.id] === "late" ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}
                                  >
                                    <Clock className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                              {dailyFeeType && (
                                <td className="px-4 py-3 text-center">
                                  {hasFee ? (
                                    alreadyPaidToday ? (
                                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-300 cursor-default">
                                        <CheckCircle className="h-3 w-3" />
                                        Paid GH₵{rosterEntry!.paid_today!.toFixed(2)}
                                      </span>
                                    ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFeePaid(prev => ({ ...prev, [student.id]: !prev[student.id] }));
                                      }}
                                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                                        paid
                                          ? 'bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-300'
                                          : 'bg-card border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400'
                                      }`}
                                    >
                                      <DollarSign className="h-3 w-3" />
                                      {paid ? `Paid  GH₵${rosterEntry!.amount!.toFixed(2)}` : `GH₵${rosterEntry!.amount!.toFixed(2)}`}
                                    </button>
                                    )
                                  ) : rosterEntry && rosterEntry.amount == null ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                                      <AlertTriangle className="h-3 w-3" />
                                      Not assigned
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards - visible only on small screens */}
              <div className="sm:hidden space-y-3">
                {students.map(student => {
                  const rosterEntry = (feeRoster || []).find(r => r.student_id === student.id);
                  const hasFee = dailyFeeType && rosterEntry && rosterEntry.amount != null;
                  const alreadyPaidToday = !!(rosterEntry?.paid_today && rosterEntry.paid_today > 0);
                  const paid = !!feePaid[student.id];
                  const status = attendance[student.id];
                  return (
                    <div key={student.id} className={`border rounded-xl p-3 space-y-2.5 ${paid ? 'bg-emerald-50 border-emerald-200' : 'bg-card'}`}>
                      {/* Student info row */}
                      <div className="flex items-center gap-3">
                        {student.photo ? (
                          <img src={student.photo} alt={student.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.student_id}</p>
                        </div>
                        <Badge variant={status === 'present' ? 'default' : status === 'absent' ? 'destructive' : status === 'late' ? 'secondary' : 'outline'}
                          className={`text-xs flex-shrink-0 ${status === 'present' ? 'bg-green-600' : status === 'late' ? 'bg-yellow-500 text-white' : ''}`}
                        >
                          {status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : status === 'late' ? 'Late' : 'Unmarked'}
                        </Badge>
                      </div>
                      {/* Status buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={status === "present" ? "default" : "outline"}
                          onClick={() => markAttendance(student.id, "present")}
                          className={`flex-1 h-9 text-xs ${status === "present" ? "bg-green-600 hover:bg-green-700" : ""}`}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant={status === "absent" ? "destructive" : "outline"}
                          onClick={() => markAttendance(student.id, "absent")}
                          className="flex-1 h-9 text-xs"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Absent
                        </Button>
                        <Button
                          size="sm"
                          variant={status === "late" ? "secondary" : "outline"}
                          onClick={() => markAttendance(student.id, "late")}
                          className={`flex-1 h-9 text-xs ${status === "late" ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}`}
                        >
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          Late
                        </Button>
                      </div>
                      {/* Fee toggle */}
                      {dailyFeeType && hasFee && alreadyPaidToday && (
                        <span className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border bg-emerald-100 border-emerald-400 text-emerald-800 cursor-default">
                          <CheckCircle className="h-3 w-3" />
                          Paid GH₵{rosterEntry!.paid_today!.toFixed(2)}
                        </span>
                      )}
                      {dailyFeeType && hasFee && !alreadyPaidToday && (
                        <button
                          type="button"
                          onClick={() => setFeePaid(prev => ({ ...prev, [student.id]: !prev[student.id] }))}
                          className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-colors ${
                            paid
                              ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                              : 'bg-white border-gray-300 text-gray-500 hover:border-emerald-400 hover:text-emerald-700'
                          }`}
                        >
                          <DollarSign className="h-3 w-3" />
                          {paid ? `Paid GH₵${rosterEntry!.amount!.toFixed(2)}` : `Pay GH₵${rosterEntry!.amount!.toFixed(2)}`}
                        </button>
                      )}
                      {dailyFeeType && !hasFee && rosterEntry && rosterEntry.amount == null && (
                        <div className="w-full text-center text-xs text-amber-600 font-medium flex items-center justify-center gap-1 py-1">
                          <AlertTriangle className="h-3 w-3" />
                          Fee not assigned
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Fee collection summary before save */}
              {dailyFeeType && (() => {
                const paidStudents = (feeRoster || []).filter(r => feePaid[r.student_id] && r.amount != null);
                const unassignedCount = (feeRoster || []).filter(r => r.amount == null).length;
                const totalFee = paidStudents.reduce((sum, r) => sum + (r.amount || 0), 0);
                return (paidStudents.length > 0 || unassignedCount > 0) ? (
                  <div className="p-3 sm:p-4 rounded-lg border space-y-2 bg-emerald-50 border-emerald-200">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                      <DollarSign className="h-4 w-4" />
                      Fee Collection Summary
                    </div>
                    {paidStudents.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-700">Students paying:</span>
                        <span className="font-bold text-emerald-800">{paidStudents.length} student{paidStudents.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {paidStudents.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-700">Total to collect:</span>
                        <span className="font-bold text-emerald-800 text-base">GH₵{totalFee.toFixed(2)}</span>
                      </div>
                    )}
                    {unassignedCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-1">
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{unassignedCount} student{unassignedCount !== 1 ? 's have' : ' has'} no fee tier assigned. Ask admin to assign their {dailyFeeType.name} sub-type.</span>
                      </div>
                    )}
                  </div>
                ) : null;
              })()}

              <Button 
                onClick={saveAttendance} 
                disabled={loading || students.length === 0} 
                className="w-full"
                size="lg"
              >
                {loading ? "Saving..." : (() => {
                  const paidCount = (feeRoster || []).filter(r => feePaid[r.student_id] && r.amount != null).length;
                  const totalFee = (feeRoster || []).filter(r => feePaid[r.student_id] && r.amount != null).reduce((s, r) => s + (r.amount || 0), 0);
                  return paidCount > 0
                    ? `Save Attendance & Collect GH₵${totalFee.toFixed(2)}`
                    : "Save Attendance";
                })()}
              </Button>
            </>
          )}
          
          {classes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Classes Assigned</p>
              <p className="text-sm">You are not assigned as a class teacher.</p>
              <p className="text-sm">Only class teachers can take attendance for their classes.</p>
            </div>
          )}
          
          {selectedClass && students.length === 0 && classes.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No students found in this class</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Cover Classes Section ── */}
      {coverClasses.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-amber-800 text-lg sm:text-xl">
              <UserCheck className="h-5 w-5" />
              Cover Attendance
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Take attendance on behalf of the class teacher.
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
            {/* Cover class selector */}
            {coverClasses.length > 1 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Select Cover Class</label>
                <Select value={selectedCoverClass} onValueChange={setSelectedCoverClass}>
                  <SelectTrigger className="max-w-full sm:max-w-xs">
                    <SelectValue placeholder="Choose class" />
                  </SelectTrigger>
                  <SelectContent>
                    {coverClasses.map(cls => (
                      <SelectItem key={cls.id} value={String(cls.id)}>
                        {cls.name || cls.level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedCoverClass && coverStudents.length > 0 && (
              <>
                {coverAlreadyTaken && (
                  <Badge variant="secondary" className="text-xs">Already taken for this date</Badge>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => {
                    const all: Record<number, string> = {};
                    coverStudents.forEach(s => { all[s.id] = 'present'; });
                    setCoverAttendance(all);
                  }}>Mark All Present</Button>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => {
                    const all: Record<number, string> = {};
                    coverStudents.forEach(s => { all[s.id] = 'absent'; });
                    setCoverAttendance(all);
                  }}>Mark All Absent</Button>
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-amber-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Student ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                        <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {coverStudents.map(student => (
                        <tr key={student.id} className="hover:bg-amber-50/50">
                          <td className="px-4 py-3 text-sm font-medium">{student.student_id}</td>
                          <td className="px-4 py-3 text-sm">{student.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant={coverAttendance[student.id] === "present" ? "default" : "outline"}
                                onClick={() => setCoverAttendance(prev => ({ ...prev, [student.id]: "present" }))}
                                className={coverAttendance[student.id] === "present" ? "bg-green-600 hover:bg-green-700" : ""}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={coverAttendance[student.id] === "absent" ? "destructive" : "outline"}
                                onClick={() => setCoverAttendance(prev => ({ ...prev, [student.id]: "absent" }))}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={coverAttendance[student.id] === "late" ? "secondary" : "outline"}
                                onClick={() => setCoverAttendance(prev => ({ ...prev, [student.id]: "late" }))}
                                className={coverAttendance[student.id] === "late" ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3">
                  {coverStudents.map(student => {
                    const status = coverAttendance[student.id];
                    return (
                      <div key={student.id} className="border border-amber-200 rounded-xl p-3 space-y-2.5 bg-card">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <Users className="h-4 w-4 text-amber-700" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.student_id}</p>
                          </div>
                          <Badge variant={status === 'present' ? 'default' : status === 'absent' ? 'destructive' : status === 'late' ? 'secondary' : 'outline'}
                            className={`text-xs flex-shrink-0 ${status === 'present' ? 'bg-green-600' : status === 'late' ? 'bg-yellow-500 text-white' : ''}`}
                          >
                            {status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : status === 'late' ? 'Late' : 'Unmarked'}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant={status === "present" ? "default" : "outline"}
                            onClick={() => setCoverAttendance(prev => ({ ...prev, [student.id]: "present" }))}
                            className={`flex-1 h-9 text-xs ${status === "present" ? "bg-green-600 hover:bg-green-700" : ""}`}>
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Present
                          </Button>
                          <Button size="sm" variant={status === "absent" ? "destructive" : "outline"}
                            onClick={() => setCoverAttendance(prev => ({ ...prev, [student.id]: "absent" }))}
                            className="flex-1 h-9 text-xs">
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Absent
                          </Button>
                          <Button size="sm" variant={status === "late" ? "secondary" : "outline"}
                            onClick={() => setCoverAttendance(prev => ({ ...prev, [student.id]: "late" }))}
                            className={`flex-1 h-9 text-xs ${status === "late" ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}`}>
                            <Clock className="h-3.5 w-3.5 mr-1" /> Late
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  onClick={saveCoverAttendance}
                  disabled={coverLoading}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  size="lg"
                >
                  {coverLoading ? "Saving..." : "Save Cover Attendance"}
                </Button>
              </>
            )}

            {selectedCoverClass && coverStudents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No students found in this class.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceManagement;
