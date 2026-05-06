import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import LeadCard from '../components/LeadCard';
import NoteModal from '../components/NoteModal';
import UploadModal from '../components/UploadModal';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [noteModal, setNoteModal] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'sales' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, statsRes, usersRes, remRes] = await Promise.all([
        api.get('/leads'),
        api.get('/leads/stats'),
        api.get('/users'),
        api.get('/notes/reminders')
      ]);
      setLeads(leadsRes.data.leads);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setReminders(remRes.data.reminders);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredLeads = leads.filter(l => {
    const matchStatus = activeTab === 'overview' || l.status === activeTab;
    const matchSearch = !search || [l.name, l.email, l.phone, l.course].some(
      v => v?.toLowerCase().includes(search.toLowerCase())
    );
    return matchStatus && matchSearch;
  });

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/leads/${id}`, { status });
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      fetchAll(); // refresh stats
      toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    try {
      await api.delete(`/leads/${id}`);
      setLeads(prev => prev.filter(l => l.id !== id));
      toast.success('Lead deleted');
      fetchAll();
    } catch { toast.error('Failed to delete lead'); }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      return toast.error('All fields required');
    }
    try {
      await api.post('/users', newUser);
      toast.success('Team member added!');
      setShowAddUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'sales' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Remove this team member?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User removed');
      fetchAll();
    } catch { toast.error('Failed to remove user'); }
  };

  const salesUsers = users.filter(u => u.role === 'sales');
  const tabTitle = { overview: 'All Leads', hot: '🔥 Hot Leads', warm: '⚡ Warm Leads', normal: '📋 Normal Leads', team: '👥 Sales Team', upload: '📤 Upload Leads', reminders: '🔔 Reminders' };

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} stats={stats} />

      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="font-bold text-gray-800 text-xl">{tabTitle[activeTab]}</h1>
            <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {['overview','hot','warm','normal'].includes(activeTab) && (
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search leads..."
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-56"
              />
            )}
            <button
              onClick={() => setShowUpload(true)}
              className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              📤 Upload Leads
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 76px)' }}>

          {/* OVERVIEW TAB - Stats */}
          {activeTab === 'overview' && (
            <div className="mb-8 grid grid-cols-4 gap-4">
              {[
                { label: 'Total Leads', value: stats.total || 0, icon: '📊', color: 'from-indigo-500 to-indigo-600' },
                { label: 'Hot Leads', value: stats.hot || 0, icon: '🔥', color: 'from-red-500 to-red-600' },
                { label: 'Warm Leads', value: stats.warm || 0, icon: '⚡', color: 'from-amber-500 to-amber-600' },
                { label: 'Normal Leads', value: stats.normal || 0, icon: '📋', color: 'from-blue-500 to-blue-600' }
              ].map(card => (
                <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 text-white`}>
                  <p className="text-3xl mb-1">{card.icon}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                  <p className="text-white/80 text-sm mt-1">{card.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* LEADS TABS */}
          {['overview','hot','warm','normal'].includes(activeTab) && (
            loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-5xl mb-4">📭</p>
                <p className="font-medium text-gray-500">No leads found</p>
                <p className="text-sm mt-1">Upload a file or add leads manually</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLeads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isAdmin={true}
                    salesUsers={salesUsers}
                    onNote={setNoteModal}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )
          )}

          {/* TEAM TAB */}
          {activeTab === 'team' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600 text-sm">{users.length} team members</p>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  + Add Member
                </button>
              </div>

              {showAddUser && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                  <h3 className="font-bold text-gray-800 mb-4">Add Team Member</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
                      { key: 'email', label: 'Email', type: 'email', placeholder: 'john@company.com' },
                      { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' }
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">{f.label}</label>
                        <input
                          type={f.type}
                          value={newUser[f.key]}
                          onChange={e => setNewUser(n => ({ ...n, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role</label>
                      <select value={newUser.role} onChange={e => setNewUser(n => ({ ...n, role: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                        <option value="sales">Sales</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setShowAddUser(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleAddUser} className="px-6 py-2 rounded-xl text-white text-sm font-semibold"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      Add Member
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(u => {
                  const assignedLeads = leads.filter(l => l.assigned_to === u.id).length;
                  return (
                    <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white"
                            style={{ background: u.role === 'admin' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #10b981, #059669)' }}>
                            {u.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{u.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                              {u.role}
                            </span>
                          </div>
                        </div>
                        {u.id !== user.id && (
                          <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-600 text-sm">🗑️</button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">✉️ {u.email}</p>
                      <p className="text-xs text-gray-500">📊 {assignedLeads} leads assigned</p>
                      <p className="text-xs text-gray-400 mt-2">Joined {format(new Date(u.created_at), 'MMM dd, yyyy')}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* REMINDERS TAB */}
          {activeTab === 'reminders' && (
            <div className="space-y-4">
              {reminders.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <p className="text-5xl mb-4">🔔</p>
                  <p className="font-medium text-gray-500">No upcoming reminders</p>
                </div>
              ) : reminders.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-amber-200 p-5 flex items-start gap-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-xl">🔔</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">Follow-up: {r.student_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">By: {r.author_name}</p>
                      </div>
                      <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
                        📅 {format(new Date(r.reminder_date), 'dd MMM yyyy, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2 italic">"{r.note}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* UPLOAD TAB */}
          {activeTab === 'upload' && (
            <div className="max-w-2xl">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <p className="text-6xl mb-4">📤</p>
                <h3 className="font-bold text-gray-800 text-xl mb-2">Upload Lead Files</h3>
                <p className="text-gray-500 mb-6">Import student leads from PDF, Excel, or CSV files. The system will automatically extract and categorize leads.</p>
                <button onClick={() => setShowUpload(true)}
                  className="px-8 py-3 rounded-xl text-white font-semibold"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  Choose File to Upload
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {noteModal && (
        <NoteModal lead={noteModal} onClose={() => setNoteModal(null)} onSaved={fetchAll} />
      )}
      {showUpload && (
        <UploadModal
          salesUsers={salesUsers}
          onClose={() => setShowUpload(false)}
          onSuccess={fetchAll}
        />
      )}
    </div>
  );
}
