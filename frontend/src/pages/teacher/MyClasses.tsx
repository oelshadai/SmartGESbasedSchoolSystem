import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, Loader2, Calendar, FileText, TrendingUp, Eye } from 'lucide-react';
import secureApiClient from '@/lib/secureApiClient';
import { useNavigate } from 'react-router-dom';
import StudentReportPreview from '@/components/StudentReportPreview';

interface ClassAssignment {
  id: string;
  type: 'form_class' | 'subject_class';
  class: {
    id: number;
    name: string;
    level: string;
    section: string;
  };
  subject?: {
    id: number;
    name: string;
  };
  assignment_count: number;
}

interface DashboardStats {
  assignments: {
    total: number;
    published: number;
    draft: number;
    submissions: number;
    pending_grading: number;
  };
  attendance: {
    present_today: number;
    absent_today: number;
    total_today: number;
  };
  classes: {
    total_classes: number;
    as_class_teacher: number;
    as_subject_teacher: number;
  };
}

const MyClasses = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [previewStudent, setPreviewStudent] = useState<{id: number, name: string, termId: number} | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try the simple assignments endpoint first
        let assignments = [];
        try {
          assignments = await secureApiClient.get('/teachers/assignments/');
          console.log('Teacher assignments loaded:', assignments);
          setAssignments(Array.isArray(assignments) ? assignments : []);
        } catch (assignmentError: any) {
          console.error('Failed to load assignments:', assignmentError);
          // Try alternative endpoint
          try {
            const response = await secureApiClient.get('/teachers/');
            console.log('Fallback teacher data:', response);
            setAssignments([]);
          } catch (fallbackError) {
            setError('Unable to load your assigned classes. Please contact your administrator.');
            setAssignments([]);
          }
        }
        
        // Try to get stats
        try {
          const statsData = await secureApiClient.get('/teachers/dashboard_stats/');
          setStats(statsData);
        } catch (statsError) {
          // Fallback stats
          const formClasses = assignments.filter((a: any) => a.type === 'form_class');
          const subjectClasses = assignments.filter((a: any) => a.type === 'subject_class');
          
          setStats({
            assignments: { total: 0, published: 0, draft: 0, submissions: 0, pending_grading: 0 },
            attendance: { present_today: 0, absent_today: 0, total_today: 0 },
            classes: { 
              total_classes: assignments.length,
              as_class_teacher: formClasses.length,
              as_subject_teacher: subjectClasses.length
            }
          });
        }
        
      } catch (err: any) {
        console.error('Failed to load teacher data:', err);
        setError('Unable to load your assigned classes. Please contact your administrator.');
        setAssignments([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleViewClass = (classId: number, type: string) => {
    if (!classId || classId <= 0) {
      console.warn('No class id available for navigation');
      return;
    }

    if (type === 'form_class') {
      navigate(`/teacher/attendance?class_id=${classId}`);
    } else {
      navigate(`/teacher/assignments?class_id=${classId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading your classes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">Error loading classes: {error}</p>
        </div>
      </div>
    );
  }

  const formClasses = assignments.filter(a => a.type === 'form_class');
  const subjectClasses = assignments.filter(a => a.type === 'subject_class');

  return (
    <div className="teacher-classes-page min-h-full w-full max-w-full overflow-x-hidden">
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">My Classes</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your assigned classes and teaching subjects</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="animated-stats-card">
            <div className="animated-stats-card-content p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Classes</p>
                  <p className="text-2xl font-bold">{stats.classes.total_classes}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
          <div className="animated-stats-card">
            <div className="animated-stats-card-content p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Assignments</p>
                  <p className="text-2xl font-bold">{stats.assignments.total}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
          </div>
          <div className="animated-stats-card">
            <div className="animated-stats-card-content p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Present Today</p>
                  <p className="text-2xl font-bold">{stats.attendance.present_today}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
          <div className="animated-stats-card">
            <div className="animated-stats-card-content p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Grading</p>
                  <p className="text-2xl font-bold">{stats.assignments.pending_grading}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Classes */}
      {formClasses.length > 0 && (
        <div className="animated-border">
          <div className="animated-border-content p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Form Teacher Assignments ({formClasses.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formClasses.map((assignment) => (
                <div key={assignment.id} className="animated-border-subtle">
                  <div className="animated-border-subtle-content p-4">
                    <div className="border-l-4 border-l-blue-500 pl-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold">{assignment.class.name}</h3>
                          <p className="text-sm text-muted-foreground">Level {assignment.class.level} {assignment.class.section}</p>
                          <p className="text-xs text-blue-600 font-medium mt-1">You are the Form Teacher</p>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Users className="h-3 w-3 mr-1" />
                          Form Teacher
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewClass(assignment.class.id, 'form_class')}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Attendance
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/teacher/class-reports?class_id=${assignment.class.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Reports
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setPreviewStudent({id: 1, name: 'Sample Student', termId: 1})}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subject Classes */}
      {subjectClasses.length > 0 && (
        <div className="animated-border">
          <div className="animated-border-content p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-500" />
              Subject Teacher Assignments ({subjectClasses.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjectClasses.map((assignment) => (
                <div key={assignment.id} className="animated-border-subtle">
                  <div className="animated-border-subtle-content p-4">
                    <div className="border-l-4 border-l-green-500 pl-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold">{assignment.subject?.name}</h3>
                          <p className="text-sm text-muted-foreground">Class: {assignment.class.name}</p>
                          <p className="text-xs text-green-600 font-medium mt-1">You teach this subject</p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <BookOpen className="h-3 w-3 mr-1" />
                          Subject Teacher
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewClass(assignment.class.id, 'subject_class')}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Assignments
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/teacher/gradebook?class_id=${assignment.class.id}&subject_id=${assignment.subject?.id}`)}
                        >
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Grades
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Classes Message */}
      {!loading && assignments.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="animated-border pulse-glow">
            <div className="animated-border-content p-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Classes Assigned</h3>
              <p className="text-muted-foreground mb-4">
                You don't have any classes or subjects assigned yet. Please contact your school administrator.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error State with Retry */}
      {error && (
        <div className="text-center py-12">
          <div className="animated-border-subtle">
            <div className="animated-border-subtle-content p-8">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                <p className="text-destructive">{error}</p>
              </div>
              <p className="text-muted-foreground mb-4">
                There was an issue loading your class assignments. This might be a temporary server issue.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Student Report Preview Modal */}
      {previewStudent && (
        <StudentReportPreview
          isOpen={!!previewStudent}
          onClose={() => setPreviewStudent(null)}
          studentId={previewStudent.id}
          termId={previewStudent.termId}
          studentName={previewStudent.name}
        />
      )}
    </div>
    </div>
  );
};

export default MyClasses;
