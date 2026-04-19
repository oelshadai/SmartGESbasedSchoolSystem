import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Edit, Trash2, Shield, Search, Plus, Users, 
  ChevronRight, Filter, MoreVertical, UserCheck,
  UserX, Mail, Calendar
} from 'lucide-react';

const mockUsers = [
  { id: 1, name: 'John Admin', email: 'john@elite.edu', role: 'SCHOOL_ADMIN', school: 'Elite Academy', status: 'active', lastLogin: '2025-02-15' },
  { id: 2, name: 'Mary Teacher', email: 'mary@elite.edu', role: 'TEACHER', school: 'Elite Academy', status: 'active', lastLogin: '2025-02-16' },
  { id: 3, name: 'James Principal', email: 'james@bright.edu', role: 'PRINCIPAL', school: 'Bright Future', status: 'active', lastLogin: '2025-02-14' },
  { id: 4, name: 'Sarah Teacher', email: 'sarah@golden.edu', role: 'TEACHER', school: 'Golden Star', status: 'inactive', lastLogin: '2025-01-20' },
  { id: 5, name: 'Admin Super', email: 'super@system.edu', role: 'SUPER_ADMIN', school: 'System', status: 'active', lastLogin: '2025-02-17' },
  { id: 6, name: 'Tom Teacher', email: 'tom@excellence.edu', role: 'TEACHER', school: 'Excellence College', status: 'active', lastLogin: '2025-02-16' },
];

const roleColors: Record<string, { bg: string; text: string; icon: any }> = {
  SUPER_ADMIN: { bg: 'from-red-500/20 to-pink-500/20', text: 'text-red-400', icon: Shield },
  SCHOOL_ADMIN: { bg: 'from-blue-500/20 to-cyan-500/20', text: 'text-blue-400', icon: Shield },
  PRINCIPAL: { bg: 'from-purple-500/20 to-pink-500/20', text: 'text-purple-400', icon: UserCheck },
  TEACHER: { bg: 'from-green-500/20 to-emerald-500/20', text: 'text-green-400', icon: Users },
  STUDENT: { bg: 'from-orange-500/20 to-yellow-500/20', text: 'text-orange-400', icon: Users },
};

const UsersManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.school.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const stats = [
    { label: 'Total Users', value: mockUsers.length, color: 'from-blue-500 to-cyan-500', border: 'border-blue-500/20', glow: 'shadow-blue-500/10', bg: 'bg-blue-500/20', gradient: 'from-blue-500 to-cyan-500' },
    { label: 'Active Users', value: mockUsers.filter(u => u.status === 'active').length, color: 'from-green-500 to-emerald-500', border: 'border-green-500/20', glow: 'shadow-green-500/10', bg: 'bg-green-500/20', gradient: 'from-green-500 to-emerald-500' },
    { label: 'Inactive Users', value: mockUsers.filter(u => u.status === 'inactive').length, color: 'from-orange-500 to-red-500', border: 'border-orange-500/20', glow: 'shadow-orange-500/10', bg: 'bg-orange-500/20', gradient: 'from-orange-500 to-red-500' },
    { label: 'Super Admins', value: mockUsers.filter(u => u.role === 'SUPER_ADMIN').length, color: 'from-purple-500 to-pink-500', border: 'border-purple-500/20', glow: 'shadow-purple-500/10', bg: 'bg-purple-500/20', gradient: 'from-purple-500 to-pink-500' },
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
            <h1 className="text-4xl font-bold text-white mb-2">Users Management</h1>
            <p className="text-slate-400 text-lg">Manage users across all schools and platforms</p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={stat.label} className={`relative group rounded-2xl border ${stat.border} bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl ${stat.glow} hover:scale-[1.02] transition-all duration-300 overflow-hidden`}>
              {/* Top accent line */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient} opacity-70 group-hover:opacity-100 transition-opacity`} />
              {/* Background glow bubble */}
              <div className={`absolute -top-8 -right-8 w-24 h-24 ${stat.bg} rounded-full blur-2xl opacity-70 group-hover:opacity-100 transition-opacity`} />
              <div className="relative">
                <div className={`inline-flex p-3 rounded-xl ${stat.bg} border ${stat.border} mb-4`}>
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <Input
                placeholder="Search users by name, email, or school..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="h-12 px-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:border-blue-500 focus:ring-blue-500/20"
              >
                <option value="all">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="SCHOOL_ADMIN">School Admin</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="TEACHER">Teacher</option>
              </select>
              <Button variant="outline" className="h-12 bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-white">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 overflow-hidden">
          <div className="p-6 border-b border-slate-800/50">
            <h3 className="text-xl font-semibold text-white">Users ({filteredUsers.length})</h3>
            <p className="text-slate-400 text-sm mt-1">Manage user accounts and permissions</p>
          </div>

          <div className="divide-y divide-slate-800/50">
            {filteredUsers.map((user) => {
              const roleConfig = roleColors[user.role];
              const RoleIcon = roleConfig.icon;
              
              return (
                <div key={user.id} className="p-6 hover:bg-slate-800/30 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${roleConfig.bg} flex items-center justify-center`}>
                        <RoleIcon className={`h-6 w-6 ${roleConfig.text}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {user.name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Last login: {user.lastLogin}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge className={`bg-gradient-to-br ${roleConfig.bg} ${roleConfig.text} border-0`}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                        <p className="text-xs text-slate-400 mt-1">{user.school}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {user.status === 'active' ? (
                            <div className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3" />
                              Active
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <UserX className="h-3 w-3" />
                              Inactive
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-400 mb-2">No users found</h3>
              <p className="text-slate-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;
