import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import LeadCard from '../components/LeadCard';
import NoteModal from '../components/NoteModal';
import { format } from 'date-fns';

export default function SalesDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({});
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [noteModal, setNoteModal] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadNotes, setLeadNotes] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, statsRes, remRes] = await Promise.all([
        api.get('/leads'),
        api.get('/leads/stats'),
        api.get('/notes/reminders')
      ]);
      setLeads(leadsRes.data.leads);
      setStats(statsRes.data.stats);
      setReminders(remRes.data.reminders);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openLeadDetail = async (lead) => {
    setSelectedLead(lead);
    try {
      const res = await api.get(`/leads/${lead.id}`);
      setLeadNotes(res.data.notes || []);
    } catch {
      setLeadNotes([]);
    }
  };

  const filteredLeads = leads.filter(l => {
    const matchStatus = activeTab === 'overview' || l.status === activeTab;
    const matchSearch = !search || [l.name, l.email, l.phone, l.course].some(
      v => v?.toLowerCase().includes(search.toLowerCase())
    );
    return matchStatus && matchSearch;
  });

  const tabTitle = {
    overview: 'My Leads', hot: '🔥 Hot Leads', warm: '⚡ Warm Leads',
    normal: '📋 Normal Leads', reminders: '🔔 My Reminders'
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} stats={stats} />

      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="font-bold text-gray-800 text-xl">{tabTitle[activeTab] || 'Dashboard'}</h1>
            <p className="text-sm text-gray-500">Hello, {user?.name} 👋</p>
          </div>
          {['overview','hot','warm','normal'].includes(activeTab) && (
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your leads..."
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-56"
            />
          )}
        </div>

        <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 76px)' }}>

          {/* Stats overview */}
          {activeTab === 'overview' && (
            <div className="mb-8 grid grid-cols-4 gap-4">
              {[
                { label: 'My Total Leads', value: stats.total || 0, icon: '📊', color: 'from-indigo-500 to-indigo-600' },
                { label: 'Hot Leads', value: stats.hot || 0, icon: '🔥', color: 'from-red-500 to-red-600' },
                { label: 'Warm Leads', value: stats.warm || 0, icon: '⚡', color: 'from-amber-500 to-amber-600' },
                { label: 'Reminders', value: reminders.length, icon: '🔔', color: 'from-green-500 to-green-600' }
              ].map(card => (
                <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 text-white`}>
                  <p className="text-3xl mb-1">{card.icon}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                  <p className="text-white/80 text-sm mt-1">{card.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Lead Cards */}
          {['overview','hot','warm','normal'].includes(activeTab) && (
            loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-5xl mb-4">📭</p>
                <p className="font-medium text-gray-500">No leads assigned yet</p>
                <p className="text-sm mt-1">Contact your admin to get leads assigned to you</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLeads.map(lead => (
                  <div key={lead.id} onClick={() => openLeadDetail(lead)} className="cursor-pointer">
                    <LeadCard
                      lead={lead}
                      isAdmin={false}
                      onNote={(l) => { setNoteModal(l); }}
                    />
                  </div>
                ))}
              </div>
            )
          )}

          {/* REMINDERS TAB */}
          {activeTab === 'reminders' && (
            <div className="space-y-4">
              {reminders.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-5xl mb-4">✅</p>
                  <p className="font-medium text-gray-500">No upcoming reminders</p>
                  <p className="text-sm text-gray-400 mt-1">Great job staying on top of your follow-ups!</p>
                </div>
              ) : reminders.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border-l-4 border-amber-400 p-5 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">🔔</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className="font-semibold text-gray-800">{r.student_name}</p>
                      <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
                        {format(new Date(r.reminder_date), 'dd MMM, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 italic">"{r.note}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Lead detail side panel */}
      {selectedLead && (
        <div className="fixed inset-0 z-40 flex" onClick={() => setSelectedLead(null)}>
          <div className="flex-1 bg-black/40" />
          <div className="w-full max-w-md bg-white overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{selectedLead.name}</h3>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  selectedLead.status === 'hot' ? 'bg-red-100 text-red-700' :
                  selectedLead.status === 'warm' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {selectedLead.status === 'hot' ? '🔥 Hot' : selectedLead.status === 'warm' ? '⚡ Warm' : '📋 Normal'}
                </span>
              </div>
              <button onClick={() => setSelectedLead(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                {selectedLead.email && <p className="text-sm">✉️ {selectedLead.email}</p>}
                {selectedLead.phone && <p className="text-sm">📞 {selectedLead.phone}</p>}
                {selectedLead.course && <p className="text-sm">📚 {selectedLead.course}</p>}
              </div>

              {/* Add note button */}
              <button
                onClick={() => setNoteModal(selectedLead)}
                className="w-full py-3 rounded-xl text-white font-semibold"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                + Add Follow-up Note
              </button>

              {/* Notes history */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Follow-up History</h4>
                {leadNotes.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No notes yet. Add your first follow-up!</p>
                ) : (
                  <div className="space-y-3">
                    {leadNotes.map(n => (
                      <div key={n.id} className="bg-gray-50 rounded-xl p-4 border-l-4 border-indigo-300">
                        <p className="text-sm text-gray-700">{n.note}</p>
                        {n.reminder_date && (
                          <p className="text-xs text-green-600 mt-2 font-medium">
                            🔔 Reminder: {format(new Date(n.reminder_date), 'dd MMM yyyy, HH:mm')}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {n.author_name} • {format(new Date(n.created_at), 'dd MMM yyyy, HH:mm')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModal && (
        <NoteModal
          lead={noteModal}
          onClose={() => setNoteModal(null)}
          onSaved={() => {
            fetchAll();
            if (selectedLead) openLeadDetail(selectedLead);
          }}
        />
      )}
    </div>
  );
}
