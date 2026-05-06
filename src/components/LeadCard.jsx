import { useState } from 'react';
import { format } from 'date-fns';

const statusConfig = {
  hot: { label: '🔥 Hot', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500 animate-hot' },
  warm: { label: '⚡ Warm', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500 animate-warm' },
  normal: { label: '📋 Normal', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' }
};

export default function LeadCard({ lead, onNote, onStatusChange, onDelete, isAdmin, salesUsers = [] }) {
  const [showActions, setShowActions] = useState(false);
  const cfg = statusConfig[lead.status] || statusConfig.normal;

  return (
    <div
      className={`lead-card rounded-2xl border-2 ${cfg.bg} ${cfg.border} p-5 relative overflow-hidden`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}>

      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
              {lead.name?.[0]?.toUpperCase() || '?'}
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${cfg.dot}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm leading-tight">{lead.name}</p>
            {lead.course && <p className="text-xs text-gray-500 mt-0.5">📚 {lead.course}</p>}
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>

      {/* Contact info */}
      <div className="space-y-1 mb-3">
        {lead.email && (
          <p className="text-xs text-gray-600 flex items-center gap-1.5">
            <span className="text-gray-400">✉️</span> {lead.email}
          </p>
        )}
        {lead.phone && (
          <p className="text-xs text-gray-600 flex items-center gap-1.5">
            <span className="text-gray-400">📞</span> {lead.phone}
          </p>
        )}
        {lead.assigned_name && (
          <p className="text-xs text-gray-600 flex items-center gap-1.5">
            <span className="text-gray-400">👤</span> Assigned: <span className="font-medium text-indigo-700">{lead.assigned_name}</span>
          </p>
        )}
      </div>

      {/* Reminder */}
      {lead.next_reminder && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 mb-3">
          <p className="text-xs text-orange-700 font-medium">
            🔔 Reminder: {format(new Date(lead.next_reminder), 'dd MMM yyyy')}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5">
        <p className="text-xs text-gray-400">
          {format(new Date(lead.created_at), 'dd MMM yyyy')}
        </p>

        <div className={`flex items-center gap-2 transition-all duration-200 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => onNote(lead)}
            className="text-xs bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-700 px-3 py-1.5 rounded-lg font-medium shadow-sm transition-all">
            + Note
          </button>

          {isAdmin && (
            <>
              <select
                value={lead.status}
                onChange={e => onStatusChange(lead.id, e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300">
                <option value="hot">🔥 Hot</option>
                <option value="warm">⚡ Warm</option>
                <option value="normal">📋 Normal</option>
              </select>
              <button
                onClick={() => onDelete(lead.id)}
                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-all">
                🗑️
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
