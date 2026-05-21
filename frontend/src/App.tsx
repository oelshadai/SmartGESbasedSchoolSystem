import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import { useAuthStore, getRoleDashboardPath } from "@/stores/authStore";
import { useEffect, lazy, Suspense } from "react";

// ── Always-needed (tiny, shown immediately) ──────────────────────────────────
import LoginPage from "./pages/ProfessionalLoginPage";
import SuperAdminLoginPage from "./pages/SuperAdminLoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthShowcase from "./pages/AuthShowcase";
import SubscriptionLockedPage from "./pages/SubscriptionLockedPage";

// ── Lazy-loaded (code-split per route bundle) ─────────────────────────────────
const SubscriptionPage           = lazy(() => import("./pages/school/SubscriptionPage"));

// Dashboards
const SchoolAdminDashboard       = lazy(() => import("./pages/dashboards/SchoolAdminDashboard"));
const TeacherDashboard           = lazy(() => import("./pages/dashboards/TeacherDashboard"));
const ProfessionalSuperAdminDashboard = lazy(() => import("./pages/dashboards/ProfessionalSuperAdminDashboard"));
const StudentDashboard           = lazy(() => import("./pages/dashboards/StudentDashboard"));

// Superadmin
const AdminSchools               = lazy(() => import("./pages/superadmin/AdminSchools"));
const AdminSchoolDetail          = lazy(() => import("./pages/superadmin/AdminSchoolDetail"));
const AdminSubscriptions         = lazy(() => import("./pages/superadmin/AdminSubscriptions"));
const AdminUsers                 = lazy(() => import("./pages/superadmin/AdminUsers"));
const AdminAnalytics             = lazy(() => import("./pages/superadmin/AdminAnalytics"));
const AdminSettings              = lazy(() => import("./pages/superadmin/AdminSettings"));
const AdminMessages              = lazy(() => import("./pages/superadmin/AdminMessages"));
const AuditLogs                  = lazy(() => import("./pages/admin/AuditLogs"));
const SupportTickets             = lazy(() => import("./pages/admin/SupportTickets"));

// School Admin
const SchoolAdminMessages        = lazy(() => import("./pages/school/SchoolAdminMessages"));
const AcademicYearManagement     = lazy(() => import("./pages/school/AcademicYearManagement"));
const ClassesManagement          = lazy(() => import("./pages/school/ClassesManagement"));
const TeachersManagement         = lazy(() => import("./pages/school/TeachersManagement"));
const StudentsManagement         = lazy(() => import("./pages/school/StudentsManagement"));
const SubjectsManagement         = lazy(() => import("./pages/school/SubjectsManagement"));
const ReportsDashboard           = lazy(() => import("./pages/school/ReportsDashboard"));
const SchoolSettings             = lazy(() => import("./pages/school/SchoolSettings"));
const Announcements              = lazy(() => import("./pages/school/Announcements"));
const EventPlanner               = lazy(() => import("./pages/school/EventPlanner"));
const AdminAttendanceOverview    = lazy(() => import("./pages/school/AdminAttendanceOverview"));
const FeeManagement              = lazy(() => import("./pages/school/FeeManagement"));
const StaffPermissions           = lazy(() => import("./pages/school/StaffPermissions"));
const ParentPortalSettings       = lazy(() => import("./pages/school/ParentPortalSettings"));
const SchoolScoreEntry           = lazy(() => import("./pages/school/ScoreEntry"));
const ScoreEntrySetup            = lazy(() => import("./pages/school/ScoreEntrySetup"));
const ScoreEntryForm             = lazy(() => import("./pages/school/ScoreEntryForm"));
const MultiSubjectScoreEntry     = lazy(() => import("./pages/school/MultiSubjectScoreEntry"));
const SmsPurchase                = lazy(() => import("./pages/school/SmsPurchase"));
const SmsSettings                = lazy(() => import("./pages/school/SmsSettings"));
const FinancialDashboard         = lazy(() => import("./pages/school/FinancialDashboard"));
const StaffManagement            = lazy(() => import("./pages/school/StaffManagement"));
const PayrollManagement          = lazy(() => import("./pages/school/PayrollManagement"));
const ExpenseManagement          = lazy(() => import("./pages/school/ExpenseManagement"));
const IncomeTracking             = lazy(() => import("./pages/school/IncomeTracking"));
const BudgetPlanning             = lazy(() => import("./pages/school/BudgetPlanning"));

// Teacher
const TeacherAssignments         = lazy(() => import("./pages/teacher/TeacherAssignments"));
const AssignmentSubmissions      = lazy(() => import("./pages/teacher/AssignmentSubmissions"));
const AssignmentEdit             = lazy(() => import("./pages/teacher/AssignmentEdit"));
const MyClasses                  = lazy(() => import("./pages/teacher/MyClasses"));
const CreateAssignment           = lazy(() => import("./pages/teacher/CreateAssignment"));
const GradeBook                  = lazy(() => import("./pages/teacher/EnhancedGradeBook"));
const AttendanceManagement       = lazy(() => import("./pages/teacher/AttendanceManagement"));
const FeeCollection              = lazy(() => import("./pages/teacher/FeeCollection"));
const StudentBehavior            = lazy(() => import("./pages/teacher/StudentBehavior"));
const Students                   = lazy(() => import("./pages/teacher/Students"));
const ScoreEntry                 = lazy(() => import("./pages/teacher/ScoreEntry"));
const ClassReports               = lazy(() => import("./pages/teacher/ClassReports"));
const TeacherProfile             = lazy(() => import("./pages/teacher/TeacherProfile"));
const TimetableManagement        = lazy(() => import("./pages/teacher/TimetableManagement"));
const HelpSupport                = lazy(() => import("./pages/teacher/HelpSupport"));

// Student
const StudentAssignments         = lazy(() => import("./pages/student/StudentAssignments"));
const AssignmentSubmission       = lazy(() => import("./pages/student/AssignmentSubmission"));
const AssignmentReview           = lazy(() => import("./pages/student/AssignmentReview"));
const MyGrades                   = lazy(() => import("./pages/student/MyGrades"));
const AttendanceRecords          = lazy(() => import("./pages/student/AttendanceRecords"));
const ClassSchedule              = lazy(() => import("./pages/student/ClassSchedule"));
const StudentAnnouncements       = lazy(() => import("./pages/student/StudentAnnouncements"));
const StudentProfile             = lazy(() => import("./pages/student/StudentProfile"));
const StudentReports             = lazy(() => import("./pages/student/StudentReports"));
const StudentBills               = lazy(() => import("./pages/student/StudentBills"));
const StudentEvents              = lazy(() => import("./pages/student/StudentEvents"));
const MySubmissions              = lazy(() => import("./pages/student/MySubmissions"));

// Parent
const ParentDashboard            = lazy(() => import("./pages/parent/ParentDashboard"));
const ParentAttendance           = lazy(() => import("./pages/parent/ParentAttendance"));
const ParentGrades               = lazy(() => import("./pages/parent/ParentGrades"));
const ParentReports              = lazy(() => import("./pages/parent/ParentReports"));
const ParentBills                = lazy(() => import("./pages/parent/ParentBills"));
const ParentAnnouncements        = lazy(() => import("./pages/parent/ParentAnnouncements"));
const ParentProfile              = lazy(() => import("./pages/parent/ParentProfile"));

// Shared
const StudentList                = lazy(() => import("./pages/shared/StudentList"));

import { PWAInstallPrompt } from "./components/pwa/PWAInstallPrompt";

// ── Fallback shown during lazy chunk load ─────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0a0f1a]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
      <p className="text-slate-500 text-xs tracking-widest uppercase">Loading…</p>
    </div>
  </div>
);

const ParentBillsPage = () => {
  const { studentId } = useParams<{ studentId: string }>();
  return <StudentBills studentIdOverride={studentId} />;
};

const queryClient = new QueryClient();

const HomeRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    useAuthStore.getState().logout();
    sessionStorage.clear();
    localStorage.clear();
    navigate('/login', { replace: true });
  }, [navigate]);

  return null;
};

const App = () => {
  const { user, checkSessionValidity, logout } = useAuthStore();

  // Proactively enforce session expiry every 60 seconds for high-privilege roles
  useEffect(() => {
    const highPrivilegeRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];
    if (!user || !highPrivilegeRoles.includes(user.role)) return;

    const interval = setInterval(() => {
      const valid = checkSessionValidity();
      if (!valid) {
        logout();
        window.location.href = '/login';
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [user, checkSessionValidity, logout]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAInstallPrompt />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/system" element={<SuperAdminLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth-demo" element={<AuthShowcase />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Super Admin */}
          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AppLayout /></ProtectedRoute>}>
            <Route path="/admin/dashboard" element={<ProfessionalSuperAdminDashboard />} />
            <Route path="/admin/schools" element={<AdminSchools />} />
            <Route path="/admin/schools/:schoolId" element={<AdminSchoolDetail />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />
            <Route path="/admin/support" element={<SupportTickets />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          {/* School Admin / Principal */}
          <Route element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'PRINCIPAL']}><AppLayout /></ProtectedRoute>}>
            <Route path="/school/dashboard" element={<SchoolAdminDashboard />} />
            <Route path="/school/academic-years" element={<AcademicYearManagement />} />
            <Route path="/school/classes" element={<ClassesManagement />} />
            <Route path="/school/teachers" element={<TeachersManagement />} />
            <Route path="/school/students" element={<StudentsManagement />} />
            <Route path="/school/subjects" element={<SubjectsManagement />} />
            <Route path="/school/reports" element={<ReportsDashboard />} />
            <Route path="/school/settings" element={<SchoolSettings />} />
            <Route path="/school/announcements" element={<Announcements />} />
            <Route path="/school/events" element={<EventPlanner />} />
            <Route path="/school/attendance" element={<AdminAttendanceOverview />} />
            <Route path="/school/fees" element={<FeeManagement />} />
            <Route path="/school/parent-portal" element={<ParentPortalSettings />} />
            <Route path="/school/score-entry" element={<SchoolScoreEntry />} />
            <Route path="/school/score-entry-setup" element={<ScoreEntrySetup />} />
            <Route path="/school/score-entry-form" element={<ScoreEntryForm />} />
            <Route path="/school/multi-subject-score-entry" element={<MultiSubjectScoreEntry />} />
            <Route path="/school/staff-permissions" element={<StaffPermissions />} />
            <Route path="/school/messages" element={<SchoolAdminMessages />} />
            <Route path="/school/sms-purchase" element={<SmsPurchase />} />
            <Route path="/school/sms-settings" element={<SmsSettings />} />
            <Route path="/school/financial" element={<FinancialDashboard />} />
            <Route path="/school/financial/staff" element={<StaffManagement />} />
            <Route path="/school/financial/payroll" element={<PayrollManagement />} />
            <Route path="/school/financial/expenses" element={<ExpenseManagement />} />
            <Route path="/school/financial/income" element={<IncomeTracking />} />
            <Route path="/school/financial/budget" element={<BudgetPlanning />} />
          </Route>

          {/* Teacher */}
          <Route element={<ProtectedRoute allowedRoles={['TEACHER']}><AppLayout /></ProtectedRoute>}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/classes" element={<MyClasses />} />
            <Route path="/teacher/assignments" element={<TeacherAssignments />} />
            <Route path="/teacher/assignments/:assignmentId/submissions" element={<AssignmentSubmissions />} />
            <Route path="/teacher/assignments/:assignmentId/edit" element={<AssignmentEdit />} />
            <Route path="/teacher/assignments/create" element={<CreateAssignment />} />
            <Route path="/teacher/gradebook" element={<GradeBook />} />
            <Route path="/teacher/attendance" element={<AttendanceManagement />} />
            <Route path="/teacher/fees" element={<FeeCollection />} />
            <Route path="/teacher/behavior" element={<StudentBehavior />} />
            <Route path="/teacher/scores" element={<ScoreEntry />} />
            <Route path="/teacher/reports" element={<ClassReports />} />
            <Route path="/teacher/students" element={<Students />} />
            <Route path="/teacher/profile" element={<TeacherProfile />} />
            <Route path="/teacher/timetable" element={<TimetableManagement />} />
            <Route path="/teacher/help" element={<HelpSupport />} />
          </Route>

          {/* Student */}
          <Route element={<ProtectedRoute allowedRoles={['STUDENT']}><AppLayout /></ProtectedRoute>}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/assignments" element={<StudentAssignments />} />
            <Route path="/student/assignments/:id" element={<AssignmentSubmission />} />
            <Route path="/student/assignments/review/:submissionId" element={<AssignmentReview />} />
            <Route path="/student/grades" element={<MyGrades />} />
            <Route path="/student/attendance" element={<AttendanceRecords />} />
            <Route path="/student/schedule" element={<ClassSchedule />} />
            <Route path="/student/announcements" element={<StudentAnnouncements />} />
            <Route path="/student/reports" element={<StudentReports />} />
            <Route path="/student/bills" element={<StudentBills />} />
            <Route path="/student/events" element={<StudentEvents />} />
            <Route path="/student/submissions" element={<MySubmissions />} />
            <Route path="/student/profile" element={<StudentProfile />} />
          </Route>

          {/* Parent */}
          <Route element={<ProtectedRoute allowedRoles={['PARENT']}><AppLayout /></ProtectedRoute>}>
            <Route path="/parent/dashboard" element={<ParentDashboard />} />
            <Route path="/parent/attendance" element={<ParentAttendance />} />
            <Route path="/parent/grades" element={<ParentGrades />} />
            <Route path="/parent/reports" element={<ParentReports />} />
            <Route path="/parent/bills" element={<ParentBills />} />
            <Route path="/parent/bills/:studentId" element={<ParentBillsPage />} />
            <Route path="/parent/announcements" element={<ParentAnnouncements />} />
            <Route path="/parent/profile" element={<ParentProfile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
          </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
};

export default App;
