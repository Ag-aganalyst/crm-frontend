import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const navItems = [
  { id: 'overview', label: 'Overview', icon: '📊', adminOnly: false },
  { id: 'hot', label: 'Hot Leads', icon: '🔥', adminOnly: false },
  { id: 'warm', label: 'Warm Leads', icon: '⚡', adminOnly: false },
  { id: 'normal', label: 'Normal Leads', icon: '📋', adminOnly: false },
  { id: 'team', label: 'Sales Team', icon: '👥', adminOnly: true },
  { id: 'upload', label: 'Upload Leads', icon: '📤', adminOnly: true },
  { id: 'reminders', label: 'Reminders', icon: '🔔', adminOnly: false },
];

export default function Sidebar({ activeTab, setActiveTab, stats }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const statusCounts = { hot: stats?.hot || 0, warm: stats?.warm || 0, normal: stats?.normal || 0 };

  return (
    <aside className="w-64 min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)' }}>

      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <span className="text-lg">📈</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm">LeadTrack CRM</p>
            <p className="text-white/40 text-xs">{isAdmin ? 'Admin Panel' : 'Sales Dashboard'}</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 mx-3 mt-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isAdmin ? 'bg-indigo-500/30 text-indigo-300' : 'bg-green-500/30 text-green-300'}`}>
              {isAdmin ? 'Admin' : 'Sales'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 mt-4 space-y-1">
        {visibleItems.map(item => {
          const count = statusCounts[item.id];
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`}>
              <span className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                {item.label}
              </span>
              {count > 0 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  item.id === 'hot' ? 'bg-red-500/20 text-red-300' :
                  item.id === 'warm' ? 'bg-amber-500/20 text-amber-300' :
                  item.id === 'normal' ? 'bg-blue-500/20 text-blue-300' : ''
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
          <span>→</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
