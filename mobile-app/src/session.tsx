import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  apiGet,
  restoreSession,
  signIn as apiSignIn,
  signOut as apiSignOut,
  type GradeReport,
  type PublishedReport,
  type StudentAssignment,
  type StudentProfile,
} from './api';

type DashboardResponse = {
  student: StudentProfile;
  stats: { total_assignments: number; completed: number; pending: number; graded: number };
};

type SessionValue = {
  booting: boolean;
  loading: boolean;
  student: StudentProfile | null;
  grades: GradeReport[];
  assignments: StudentAssignment[];
  publishedReports: PublishedReport[];
  error: string;
  signIn: (studentId: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [grades, setGrades] = useState<GradeReport[]>([]);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [publishedReports, setPublishedReports] = useState<PublishedReport[]>([]);
  const [error, setError] = useState('');

  const loadStudentData = async () => {
    setLoading(true);
    setError('');
    const results = await Promise.allSettled([
      apiGet<DashboardResponse>('/students/auth/dashboard/'),
      apiGet<GradeReport[]>('/students/reports/'),
      apiGet<PublishedReport[]>('/students/published-reports/'),
      apiGet<StudentAssignment[]>('/assignments/student/my-assignments/'),
    ]);
    const dashboard = results[0];
    if (dashboard.status === 'rejected') {
      setLoading(false);
      throw dashboard.reason;
    }
    setStudent(dashboard.value.student);
    if (results[1].status === 'fulfilled') setGrades(results[1].value);
    if (results[2].status === 'fulfilled') setPublishedReports(results[2].value);
    if (results[3].status === 'fulfilled') setAssignments(results[3].value);
    if (results.slice(1).some(result => result.status === 'rejected')) {
      setError('Some school information could not be loaded. Pull down to retry.');
    }
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        if (await restoreSession()) await loadStudentData();
      } catch {
        await apiSignOut();
        if (active) setStudent(null);
      } finally {
        if (active) setBooting(false);
      }
    };
    void initialize();
    return () => { active = false; };
  }, []);

  const signIn = async (studentId: string, password: string) => {
    setError('');
    await apiSignIn(studentId, password);
    try {
      await loadStudentData();
    } catch (loadError) {
      await apiSignOut();
      throw loadError;
    }
  };

  const signOut = async () => {
    await apiSignOut();
    setStudent(null);
    setGrades([]);
    setAssignments([]);
    setPublishedReports([]);
    setError('');
  };

  const refresh = async () => {
    try {
      await loadStudentData();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not refresh student data.');
    }
  };

  return (
    <SessionContext.Provider value={{ booting, loading, student, grades, assignments, publishedReports, error, signIn, signOut, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
}