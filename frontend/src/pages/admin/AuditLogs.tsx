import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const mockLogs = [
  { id: 1, user: 'john@elite.edu', action: 'Login', resource: 'Auth', ip: '192.168.1.1', timestamp: '2025-02-17 10:30', status: 'success' },
  { id: 2, user: 'admin@system.edu', action: 'Created School', resource: 'Schools', ip: '10.0.0.1', timestamp: '2025-02-17 09:15', status: 'success' },
  { id: 3, user: 'unknown', action: 'Failed Login', resource: 'Auth', ip: '45.33.22.11', timestamp: '2025-02-17 08:45', status: 'failed' },
  { id: 4, user: 'mary@elite.edu', action: 'Updated Student', resource: 'Students', ip: '192.168.1.5', timestamp: '2025-02-16 16:20', status: 'success' },
  { id: 5, user: 'james@bright.edu', action: 'Generated Report', resource: 'Reports', ip: '172.16.0.3', timestamp: '2025-02-16 14:30', status: 'success' },
  { id: 6, user: 'unknown', action: 'Failed Login', resource: 'Auth', ip: '85.12.44.6', timestamp: '2025-02-16 12:00', status: 'failed' },
  { id: 7, user: 'admin@system.edu', action: 'Updated Settings', resource: 'System', ip: '10.0.0.1', timestamp: '2025-02-16 11:00', status: 'success' },
  { id: 8, user: 'sarah@golden.edu', action: 'Deleted Assignment', resource: 'Assignments', ip: '192.168.2.8', timestamp: '2025-02-15 17:45', status: 'success' },
];

const columns = [
  { key: 'timestamp', label: 'Timestamp', render: (l: typeof mockLogs[0]) => <span className="text-xs text-muted-foreground font-mono">{l.timestamp}</span> },
  { key: 'user', label: 'User', render: (l: typeof mockLogs[0]) => <span className="text-sm font-medium text-foreground">{l.user}</span> },
  { key: 'action', label: 'Action', render: (l: typeof mockLogs[0]) => <span className="text-sm text-foreground">{l.action}</span> },
  { key: 'resource', label: 'Resource', render: (l: typeof mockLogs[0]) => <Badge variant="outline">{l.resource}</Badge> },
  { key: 'ip', label: 'IP Address', render: (l: typeof mockLogs[0]) => <span className="text-xs text-muted-foreground font-mono">{l.ip}</span> },
  { key: 'status', label: 'Status', render: (l: typeof mockLogs[0]) => (
    <Badge variant="outline" className={l.status === 'success' ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
      {l.status}
    </Badge>
  )},
  { key: 'actions', label: '', render: () => <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button> },
];

const AuditLogs = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center gap-2">
      <Shield className="h-6 w-6 text-secondary" />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Track all system activities and user actions</p>
      </div>
    </div>
    <DataTable columns={columns} data={mockLogs} searchKey="user" searchPlaceholder="Search by user..." />
  </div>
);

export default AuditLogs;
