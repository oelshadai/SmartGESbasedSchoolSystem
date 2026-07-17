import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Users, Search, UserCheck, UserX, Clock, Filter } from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';

interface AttendanceRecord {
  id: number;
  student_name: string;
  student_id: string;
  class_name: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  marked_by: string;
}

interface ClassAttendanceSummary {
  class_name: string;
  class_id: number;
  total_students: number;
  present: number;
  absent: number;
  late: number;
  attendance_rate: number;
}

interface DailyStats {
  date: string;
  total_students: number;
  present: number;
  absent: number;
  late: number;
  attendance_rate: number;
}

const statusColors = {
  present: 'bg-success/10 text-success border-success/20',
  absent: 'bg-destructive/10 text-destructive border-destructive/20',
  late: 'bg-warning/10 text-warning border-warning/20',
};

const statusIcons = {
  present: <UserCheck className="h-4 w-4" />,
  absent: <UserX className="h-4 w-4" />,
  late: <Clock className="h-4 w-4" />,
};

const AdminAttendanceOverview = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [classSummaries, setClassSummaries] = useState<ClassAttendanceSummary[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [showStudentSearch, setShowStudentSearch] = useState(false);

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate, selectedClass]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch daily attendance records
      const recordsResponse = await secureApiClient.get(`/students/attendance/admin/daily/?date=${selectedDate}&class=${selectedClass}`);
      setAttendanceRecords(recordsResponse.records || []);
      
      // Fetch class summaries
      const summariesResponse = await secureApiClient.get(`/students/attendance/admin/class-summary/?date=${selectedDate}`);
      setClassSummaries(summariesResponse.summaries || []);
      
      // Fetch daily stats
      const statsResponse = await secureApiClient.get(`/students/attendance/admin/daily-stats/?date=${selectedDate}`);
      setDailyStats(statsResponse.stats || null);
      
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchStudentHistory = async (studentId: string) => {
    try {
      const response = await secureApiClient.get(`/students/attendance/admin/student-history/?student_id=${studentId}&days=30`);
      setStudentSearchResults([response]);
      setShowStudentSearch(true);
    } catch (error) {
      console.error('Failed to fetch student history:', error);
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.student_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Attendance Overview</h1>
          <p className="text-muted-foreground mt-1">Monitor daily attendance across all classes</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Daily Stats Cards */}
      {dailyStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{dailyStats.total_students}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <UserCheck className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Present</p>
                  <p className="text-2xl font-bold text-success">{dailyStats.present}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <UserX className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Absent</p>
                  <p className="text-2xl font-bold text-destructive">{dailyStats.absent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Calendar className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  <p className="text-2xl font-bold">{dailyStats.attendance_rate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Class Summaries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Class Attendance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classSummaries.map((summary) => (
              <Card key={summary.class_id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{summary.class_name}</h4>
                    <Badge variant="outline">
                      {summary.attendance_rate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total:</span>
                      <span>{summary.total_students}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-success">Present:</span>
                      <span>{summary.present}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-destructive">Absent:</span>
                      <span>{summary.absent}</span>
                    </div>
                    {summary.late > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-warning">Late:</span>
                        <span>{summary.late}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student Search Results */}
      {showStudentSearch && studentSearchResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Student Attendance History</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowStudentSearch(false)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {studentSearchResults.map((result, index) => (
              <div key={index} className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{result.student?.name}</h4>
                    <p className="text-sm text-muted-foreground">ID: {result.student?.student_id} | Class: {result.student?.class}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{result.summary?.attendance_rate}%</p>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded">
                    <p className="text-lg font-bold">{result.summary?.total_days}</p>
                    <p className="text-xs text-muted-foreground">Total Days</p>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <p className="text-lg font-bold text-success">{result.summary?.present_days}</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <p className="text-lg font-bold text-destructive">{result.summary?.absent_days}</p>
                    <p className="text-xs text-muted-foreground">Absent</p>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <p className="text-lg font-bold text-warning">{result.summary?.late_days}</p>
                    <p className="text-xs text-muted-foreground">Late</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-lg">
        {/* Search row */}
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            placeholder="Search student name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                searchStudentHistory(searchQuery.trim());
              }
            }}
            className="flex-1 min-w-0"
          />
          <Button
            size="sm"
            className="flex-shrink-0"
            onClick={() => searchQuery.trim() && searchStudentHistory(searchQuery.trim())}
          >
            Search
          </Button>
        </div>

        {/* Selects + count row */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-40 flex-shrink-0">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classSummaries.map((cls) => (
                <SelectItem key={cls.class_id} value={cls.class_id.toString()}>
                  {cls.class_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 flex-shrink-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground">
            {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attendance records found for the selected criteria
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {statusIcons[record.status]}
                      <Badge variant="outline" className={statusColors[record.status]}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-medium">{record.student_name}</p>
                      <p className="text-sm text-muted-foreground">ID: {record.student_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{record.class_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Marked by {record.marked_by}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAttendanceOverview;