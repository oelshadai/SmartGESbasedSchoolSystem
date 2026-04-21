import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAuthStore, getRoleDashboardPath } from "@/stores/authStore";

import LoginPage from "./pages/ProfessionalLoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AuthShowcase from "./pages/AuthShowcase";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Dashboards
import SchoolAdminDashboard from "./pages/dashboards/SchoolAdminDashboard";
import TeacherDashboard from "./pages/dashboards/TeacherDashboard";
import ProfessionalSuperAdminDashboard from "./pages/dashboards/ProfessionalSuperAdminDashboard";
import AdminSchools from "./pages/superadmin/AdminSchools";
import AdminSchoolDetail from "./pages/superadmin/AdminSchoolDetail";
import AdminSubscriptions from "./pages/superadmin/AdminSubscriptions";
import AdminUsers from "./pages/superadmin/AdminUsers";
import AdminAnalytics from "./pages/superadmin/AdminAnalytics";
import AdminSettings from "./pages/superadmin/AdminSettings";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentAttendance from "./pages/parent/ParentAttendance";
import ParentGrades from "./pages/parent/ParentGrades";
import ParentReports from "./pages/parent/ParentReports";
import ParentBills from "./pages/parent/ParentBills";
import ParentAnnouncements from "./pages/parent/ParentAnnouncements";
import ParentProfile from "./pages/parent/ParentProfile";

// School Admin
import AcademicYearManagement from "./pages/school/AcademicYearManagement";
import ClassesManagement from "./pages/school/ClassesManagement";
import TeachersManagement from "./pages/school/TeachersManagement";
import StudentsManagement from "./pages/school/StudentsManagement";
import SubjectsManagement from "./pages/school/SubjectsManagement";
import ReportsDashboard from "./pages/school/ReportsDashboard";
import SchoolSettings from "./pages/school/SchoolSettings";
import Announcements from "./pages/school/Announcements";
import EventPlanner from "./pages/school/EventPlanner";
import AdminAttendanceOverview from "./pages/school/AdminAttendanceOverview";
import FeeManagement from "./pages/school/FeeManagement";
import StaffPermissions from "./pages/school/StaffPermissions";
import ParentPortalSettings from "./pages/school/ParentPortalSettings";
import SchoolScoreEntry from "./pages/school/ScoreEntry";
import ScoreEntrySetup from "./pages/school/ScoreEntrySetup";
import ScoreEntryForm from "./pages/school/ScoreEntryForm";
import MultiSubjectScoreEntry from "./pages/school/MultiSubjectScoreEntry";

// Teacher
import TeacherAssignments from "./pages/teacher/TeacherAssignments";
import AssignmentSubmissions from "./pages/teacher/AssignmentSubmissions";
import AssignmentEdit from "./pages/teacher/AssignmentEdit";
import MyClasses from "./pages/teacher/MyClasses";
import CreateAssignment from "./pages/teacher/CreateAssignment";
import GradeBook from "./pages/teacher/EnhancedGradeBook";
import AttendanceManagement from "./pages/teacher/AttendanceManagement";
import FeeCollection from "./pages/teacher/FeeCollection";
import StudentBehavior from "./pages/teacher/StudentBehavior";
import Students from "./pages/teacher/Students";
import ScoreEntry from "./pages/teacher/ScoreEntry";
import ClassReports from "./pages/teacher/ClassReports";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import TimetableManagement from "./pages/teacher/TimetableManagement";
import HelpSupport from "./pages/teacher/HelpSupport";

// Student
import StudentAssignments from "./pages/student/StudentAssignments";
import AssignmentSubmission from "./pages/student/AssignmentSubmission";
import AssignmentReview from "./pages/student/AssignmentReview";
import MyGrades from "./pages/student/MyGrades";
import AttendanceRecords from "./pages/student/AttendanceRecords";
import ClassSchedule from "./pages/student/ClassSchedule";
import StudentAnnouncements from "./pages/student/StudentAnnouncements";
import StudentProfile from "./pages/student/StudentProfile";
import StudentReports from "./pages/student/StudentReports";
import StudentBills from "./pages/student/StudentBills";

const ParentBillsPage = () => {
  const { studentId } = useParams<{ studentId: string }>();
  return <StudentBills studentIdOverride={studentId} />;
};

import StudentList from "./pages/shared/StudentList";
import { PWAInstallPrompt } from "./components/pwa/PWAInstallPrompt";

const queryClient = new QueryClient();

const HomeRedirect = () => {
  // Force clear all auth data and redirect to login
  useAuthStore.getState().logout();
  sessionStorage.clear();
  localStorage.clear();
  
  return <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAInstallPrompt />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<LoginPage />} />
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
            <Route path="/school/event-planner" element={<AdminAttendanceOverview />} />
            <Route path="/school/fees" element={<FeeManagement />} />
            <Route path="/school/parent-portal" element={<ParentPortalSettings />} />
            <Route path="/school/score-entry" element={<SchoolScoreEntry />} />
            <Route path="/school/score-entry-setup" element={<ScoreEntrySetup />} />
            <Route path="/school/score-entry-form" element={<ScoreEntryForm />} />
            <Route path="/school/multi-subject-score-entry" element={<MultiSubjectScoreEntry />} />
            <Route path="/school/staff-permissions" element={<StaffPermissions />} />
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
            <Route path="/student/profile" element={<StudentProfile />} />
          </Route>

          <Route path="*" element={<NotFound />} />

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
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
};

export default App;
