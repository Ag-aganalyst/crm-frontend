import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

export default function NoteModal({ lead, onClose, onSaved }) {
  const [note, setNote] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Calculate default reminder options
  const today = new Date();
  const in7days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const in3days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const handleSubmit = async () => {
    if (!note.trim()) return toast.error('Please enter a note');
    setLoading(true);
    try {
      await api.post('/notes', {
        lead_id: lead.id,
        note: note.trim(),
        reminder_date: reminderDate || null
      });
      toast.success('Note saved!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Add Follow-up Note</h3>
              <p className="text-sm text-gray-500 mt-0.5">For: <span className="font-medium text-indigo-600">{lead.name}</span></p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Follow-up Note *</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              placeholder="e.g. Student is interested but wants to discuss with family. Will call back after 7 days..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Set Reminder (optional)</label>
            
            {/* Quick select buttons */}
            <div className="flex gap-2 mb-3">
              {[
                { label: 'Tomorrow', val: tomorrow },
                { label: '3 Days', val: in3days },
                { label: '7 Days', val: in7days },
              ].map(opt => (
                <button
                  key={opt.label}
                  onClick={() => setReminderDate(opt.val)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                    reminderDate === opt.val
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}>
                  + {opt.label}
                </button>
              ))}
            </div>

            <input
              type="datetime-local"
              value={reminderDate}
              onChange={e => setReminderDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />

            {reminderDate && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <span>✅</span> A reminder email will be sent to you on the selected date/time
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !note.trim()}
            className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {loading ? 'Saving...' : '💾 Save Note'}
          </button>
        </div>
      </div>
    </div>
  );
}
