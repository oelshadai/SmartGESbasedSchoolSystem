import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Edit, Trash2, Eye, Search, Plus, School, 
  ChevronRight, Filter, MoreVertical, MapPin,
  Users, GraduationCap, Mail, Crown, Building
} from 'lucide-react';

const mockSchools = [
  { id: 1, name: 'Elite Academy', email: 'admin@elite.edu', location: 'Accra', students: 245, teachers: 18, plan: 'Premium', status: 'active' },
  { id: 2, name: 'Bright Future School', email: 'info@brightfuture.edu', location: 'Kumasi', students: 180, teachers: 12, plan: 'Basic', status: 'active' },
  { id: 3, name: 'Golden Star Academy', email: 'contact@goldenstar.edu', location: 'Tamale', students: 120, teachers: 8, plan: 'Free Trial', status: 'pending' },
  { id: 4, name: 'Excellence College', email: 'admin@excellence.edu', location: 'Cape Coast', students: 310, teachers: 22, plan: 'Premium', status: 'active' },
  { id: 5, name: 'Heritage International', email: 'info@heritage.edu', location: 'Accra', students: 198, teachers: 15, plan: 'Basic', status: 'active' },
  { id: 6, name: 'Pioneer School', email: 'admin@pioneer.edu', location: 'Takoradi', students: 95, teachers: 7, plan: 'Free Trial', status: 'suspended' },
];

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  active: { bg: 'bg-green-500/20', text: 'text-green-400', icon: School },
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Building },
  suspended: { bg: 'bg-red-500/20', text: 'text-red-400', icon: Building },
};

const planColors: Record<string, { bg: string; text: string }> = {
  'Premium': { bg: 'from-purple-500/20 to-pink-500/20', text: 'text-purple-400' },
  'Basic': { bg: 'from-blue-500/20 to-cyan-500/20', text: 'text-blue-400' },
  'Free Trial': { bg: 'from-green-500/20 to-emerald-500/20', text: 'text-green-400' },
};

const SchoolsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState('all');

  const filteredSchools = mockSchools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || school.status === selectedStatus;
    const matchesPlan = selectedPlan === 'all' || school.plan === selectedPlan;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const stats = [
    { 
      label: 'Total Schools', 
      value: mockSchools.length, 
      color: 'from-blue-500 to-cyan-500',
      icon: School
    },
    { 
      label: 'Active Schools', 
      value: mockSchools.filter(s => s.status === 'active').length, 
      color: 'from-green-500 to-emerald-500',
      icon: School
    },
    { 
      label: 'Total Students', 
      value: mockSchools.reduce((sum, s) => sum + s.students, 0), 
      color: 'from-purple-500 to-pink-500',
      icon: GraduationCap
    },
    { 
      label: 'Total Teachers', 
      value: mockSchools.reduce((sum, s) => sum + s.teachers, 0), 
      color: 'from-orange-500 to-red-500',
      icon: Users
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
            <h1 className="text-4xl font-bold text-white mb-2">Schools Management</h1>
            <p className="text-slate-400 text-lg">Create and manage schools on the platform</p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add School
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
                placeholder="Search schools by name, email, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-12 px-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:border-blue-500 focus:ring-blue-500/20"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="h-12 px-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:border-blue-500 focus:ring-blue-500/20"
              >
                <option value="all">All Plans</option>
                <option value="Premium">Premium</option>
                <option value="Basic">Basic</option>
                <option value="Free Trial">Free Trial</option>
              </select>
              <Button variant="outline" className="h-12 bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-white">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Schools Table */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 overflow-hidden">
          <div className="p-6 border-b border-slate-800/50">
            <h3 className="text-xl font-semibold text-white">Schools ({filteredSchools.length})</h3>
            <p className="text-slate-400 text-sm mt-1">Manage school accounts and subscriptions</p>
          </div>

          <div className="divide-y divide-slate-800/50">
            {filteredSchools.map((school) => {
              const statusConfig = statusColors[school.status];
              const planConfig = planColors[school.plan];
              const StatusIcon = statusConfig.icon;
              
              return (
                <div key={school.id} className="p-6 hover:bg-slate-800/30 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                        <School className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {school.name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {school.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {school.location}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-slate-400">
                            <GraduationCap className="h-3 w-3" />
                            <span>{school.students}</span>
                          </div>
                          <p className="text-xs text-slate-500">Students</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-slate-400">
                            <Users className="h-3 w-3" />
                            <span>{school.teachers}</span>
                          </div>
                          <p className="text-xs text-slate-500">Teachers</p>
                        </div>
                      </div>
                      
                      {/* Plan & Status */}
                      <div className="text-right">
                        <Badge className={`bg-gradient-to-br ${planConfig.bg} ${planConfig.text} border-0 mb-1`}>
                          {school.plan === 'Premium' && <Crown className="h-3 w-3 mr-1" />}
                          {school.plan}
                        </Badge>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text} border border-current/30`}>
                          <StatusIcon className="h-3 w-3" />
                          {school.status}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
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

          {filteredSchools.length === 0 && (
            <div className="p-12 text-center">
              <School className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-400 mb-2">No schools found</h3>
              <p className="text-slate-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolsManagement;
