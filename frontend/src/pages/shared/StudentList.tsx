import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';

const mockStudents = [
  { id: 1, student_id: 'STD001', first_name: 'John', last_name: 'Doe', class: 'Basic 7A', status: 'active' },
  { id: 2, student_id: 'STD002', first_name: 'Jane', last_name: 'Smith', class: 'Basic 7A', status: 'active' },
  { id: 3, student_id: 'STD003', first_name: 'Michael', last_name: 'Brown', class: 'Basic 8B', status: 'active' },
  { id: 4, student_id: 'STD004', first_name: 'Emily', last_name: 'Davis', class: 'Basic 9A', status: 'inactive' },
];

const StudentList = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground mt-1">Manage student records</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search students..." className="pl-10" />
      </div>

      <div className="stat-card overflow-hidden p-0">
        {/* Desktop Table */}
        <div className="hidden sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Student ID</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Class</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockStudents.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="p-4 text-sm font-mono text-muted-foreground">{s.student_id}</td>
                  <td className="p-4 text-sm font-medium text-foreground">{s.first_name} {s.last_name}</td>
                  <td className="p-4 text-sm text-muted-foreground">{s.class}</td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden p-3 space-y-3">
          {mockStudents.map((s) => (
            <div key={s.id} className="border rounded-xl p-3 bg-card cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{s.first_name} {s.last_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{s.student_id}</p>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                  s.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                }`}>
                  {s.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{s.class}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentList;
