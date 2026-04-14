import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { secureApiClient } from '@/lib/secureApiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, BookOpen, CalendarCheck, DollarSign, FileText, Users } from 'lucide-react';

interface ChildInfo {
  student_id: string;
  name: string;
  relationship: string;
}

interface ChildSummary {
  student_id: string;
  name: string;
  class_name?: string;
  attendance_rate?: number;
  recent_grades?: { subject: string; score: number }[];
}

const ParentDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [summaries, setSummaries] = useState<Record<string, ChildSummary>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Children come from the user object (set during login)
        const userChildren = (user as any)?.children || [];
        setChildren(userChildren);

        // Fetch summary for each child
        const summaryMap: Record<string, ChildSummary> = {};
        for (const child of userChildren) {
          try {
            const data = await secureApiClient.get<ChildSummary>(
              `/api/parent/children/${child.student_id}/summary/`
            );
            summaryMap[child.student_id] = data;
          } catch {
            summaryMap[child.student_id] = { student_id: child.student_id, name: child.name };
          }
        }
        setSummaries(summaryMap);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const parentName = user ? `${user.first_name} ${user.last_name}`.trim() || user.email : 'Parent';

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
          <Users className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, {parentName}</h1>
          <p className="text-muted-foreground text-sm">Parent / Guardian Portal</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          Loading your children's information…
        </div>
      ) : children.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">No children linked to your account yet.</p>
            <p className="text-sm text-muted-foreground/70">
              Please contact your school's admin to link your children.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {children.map((child) => {
            const summary = summaries[child.student_id];
            return (
              <Card key={child.student_id} className="border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{child.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ID: {child.student_id}
                          {summary?.class_name && ` · ${summary.class_name}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">{child.relationship}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  {/* Attendance */}
                  <div className="relative group rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 overflow-hidden hover:scale-[1.02] transition-all duration-200">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-green-400 opacity-60" />
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20">
                        <CalendarCheck className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Attendance</p>
                        <p className="text-sm font-bold text-foreground">
                          {summary?.attendance_rate != null
                            ? `${summary.attendance_rate}%`
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Grades */}
                  <div className="relative group rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 overflow-hidden hover:scale-[1.02] transition-all duration-200">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-60" />
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-500/15 border border-blue-500/20">
                        <BookOpen className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Grades</p>
                        <p className="text-sm font-bold text-blue-500">View</p>
                      </div>
                    </div>
                  </div>

                  {/* Fees */}
                  <div className="relative group rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 overflow-hidden hover:scale-[1.02] transition-all duration-200">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-400 opacity-60" />
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-orange-500/15 border border-orange-500/20">
                        <DollarSign className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fees</p>
                        <p className="text-sm font-bold text-orange-500">View</p>
                      </div>
                    </div>
                  </div>

                  {/* Reports */}
                  <div className="relative group rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 overflow-hidden hover:scale-[1.02] transition-all duration-200">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-violet-400 opacity-60" />
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-purple-500/15 border border-purple-500/20">
                        <FileText className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Reports</p>
                        <p className="text-sm font-bold text-purple-500">View</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
