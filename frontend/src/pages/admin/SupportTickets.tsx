import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, Eye, Search, Filter, Clock,
  AlertTriangle, CheckCircle2, XCircle, Plus,
  Mail, Calendar, User, Building, ChevronRight
} from 'lucide-react';

const mockTickets = [
  { id: 1, subject: 'Cannot generate report cards', school: 'Elite Academy', submitter: 'john@elite.edu', priority: 'high', status: 'open', created: '2025-02-17', responses: 3 },
  { id: 2, subject: 'Student login not working', school: 'Bright Future', submitter: 'james@bright.edu', priority: 'critical', status: 'in_progress', created: '2025-02-16', responses: 5 },
  { id: 3, subject: 'Need to change academic year', school: 'Golden Star', submitter: 'admin@golden.edu', priority: 'medium', status: 'open', created: '2025-02-15', responses: 1 },
  { id: 4, subject: 'Feature request: SMS notifications', school: 'Excellence College', submitter: 'admin@excellence.edu', priority: 'low', status: 'closed', created: '2025-02-10', responses: 8 },
  { id: 5, subject: 'Billing issue with subscription', school: 'Heritage Int.', submitter: 'info@heritage.edu', priority: 'high', status: 'resolved', created: '2025-02-08', responses: 12 },
];

const priorityConfig: Record<string, { bg: string; text: string; icon: any }> = {
  critical: { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertTriangle },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: AlertTriangle },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Clock },
  low: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle2 },
};

const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
  open: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: MessageSquare },
  in_progress: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: Clock },
  resolved: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle2 },
  closed: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: XCircle },
};

const SupportTickets = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredTickets = mockTickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.submitter.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = selectedPriority === 'all' || ticket.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'all' || ticket.status === selectedStatus;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const stats = [
    { 
      label: 'Open Tickets', 
      value: mockTickets.filter(t => t.status === 'open').length, 
      color: 'from-blue-500 to-cyan-500',
      icon: MessageSquare
    },
    { 
      label: 'In Progress', 
      value: mockTickets.filter(t => t.status === 'in_progress').length, 
      color: 'from-purple-500 to-pink-500',
      icon: Clock
    },
    { 
      label: 'Resolved Today', 
      value: mockTickets.filter(t => t.status === 'resolved').length, 
      color: 'from-green-500 to-emerald-500',
      icon: CheckCircle2
    },
    { 
      label: 'Critical Issues', 
      value: mockTickets.filter(t => t.priority === 'critical').length, 
      color: 'from-red-500 to-orange-500',
      icon: AlertTriangle
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Support Tickets</h1>
            <p className="text-slate-400 text-lg">Manage support requests from schools and users</p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 hover:border-slate-700/50 transition-all duration-300">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20 mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                    <p className="text-slate-400 text-sm">{stat.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <Input
                placeholder="Search tickets by subject, school, or submitter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="h-12 px-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:border-blue-500 focus:ring-blue-500/20"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-12 px-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:border-blue-500 focus:ring-blue-500/20"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <Button variant="outline" className="h-12 bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-white">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 overflow-hidden">
          <div className="p-6 border-b border-slate-800/50">
            <h3 className="text-xl font-semibold text-white">Support Tickets ({filteredTickets.length})</h3>
            <p className="text-slate-400 text-sm mt-1">Manage and respond to support requests</p>
          </div>

          <div className="divide-y divide-slate-800/50">
            {filteredTickets.map((ticket) => {
              const priorityConf = priorityConfig[ticket.priority];
              const statusConf = statusConfig[ticket.status];
              const PriorityIcon = priorityConf.icon;
              const StatusIcon = statusConf.icon;
              
              return (
                <div key={ticket.id} className="p-6 hover:bg-slate-800/30 transition-colors group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-6 w-6 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">
                              #{ticket.id} - {ticket.subject}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {ticket.school}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {ticket.submitter}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {ticket.created}
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {ticket.responses} responses
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-3">
                          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${priorityConf.bg} ${priorityConf.text} border border-current/30`}>
                            <PriorityIcon className="h-3 w-3" />
                            {ticket.priority}
                          </div>
                          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConf.bg} ${statusConf.text} border border-current/30`}>
                            <StatusIcon className="h-3 w-3" />
                            {ticket.status.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-green-400 hover:bg-green-500/10"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTickets.length === 0 && (
            <div className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-400 mb-2">No tickets found</h3>
              <p className="text-slate-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportTickets;
