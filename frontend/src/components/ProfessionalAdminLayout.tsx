import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Settings, Users, School, BarChart3, 
  HeadphonesIcon, FileText, Shield, 
  LogOut, Bell, Search, Menu,
  ChevronRight, Home
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface ProfessionalAdminLayoutProps {
  children: ReactNode;
}

const adminNavItems = [
  { 
    path: '/admin/dashboard', 
    label: 'Dashboard', 
    icon: Home,
    description: 'Overview & analytics'
  },
  { 
    path: '/admin/schools', 
    label: 'Schools', 
    icon: School,
    description: 'Manage institutions'
  },
  { 
    path: '/admin/users', 
    label: 'Users', 
    icon: Users,
    description: 'User management'
  },
  { 
    path: '/admin/analytics', 
    label: 'Analytics', 
    icon: BarChart3,
    description: 'System metrics'
  },
  { 
    path: '/admin/settings', 
    label: 'Settings', 
    icon: Settings,
    description: 'Platform config'
  },
  { 
    path: '/admin/support', 
    label: 'Support', 
    icon: HeadphonesIcon,
    description: 'Help & tickets'
  },
  { 
    path: '/admin/audit', 
    label: 'Audit Logs', 
    icon: FileText,
    description: 'System logs'
  },
];

const ProfessionalAdminLayout = ({ children }: ProfessionalAdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* Sidebar */}
      <div className="w-80 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/50 flex flex-col">
        {/* Logo & Header */}
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl blur-lg opacity-50" />
              <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 p-3 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-slate-400">Super Administrator</p>
            </div>
          </div>
          
          {/* User Info */}
          <div className="bg-slate-800/30 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                <span className="text-blue-400 font-semibold text-sm">
                  {user?.first_name?.[0] || user?.email?.[0] || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {user?.first_name && user?.last_name 
                    ? `${user.first_name} ${user.last_name}`
                    : user?.email || 'Admin User'
                  }
                </p>
                <p className="text-slate-400 text-xs truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-2">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full group relative p-3 rounded-xl transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30'
                    : 'hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-slate-700/50 text-slate-400 group-hover:text-slate-300'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${
                      isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                    }`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500 group-hover:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-blue-400" />
                  )}
                </div>
                
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/10 to-cyan-400/10 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800/50 space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start bg-slate-800/30 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-slate-900/30 backdrop-blur-xl border-b border-slate-800/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5 text-slate-400" />
              </Button>
              
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">Admin</span>
                <ChevronRight className="h-3 w-3 text-slate-600" />
                <span className="text-white font-medium">
                  {adminNavItems.find(item => isActivePath(item.path))?.label || 'Dashboard'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 w-64"
                />
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-slate-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>

      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/3 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
    </div>
  );
};

export default ProfessionalAdminLayout;