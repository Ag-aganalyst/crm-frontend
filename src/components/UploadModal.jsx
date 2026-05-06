import { useState, useRef, useCallback } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

export default function UploadModal({ onClose, onSuccess, salesUsers = [] }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [assignTo, setAssignTo] = useState('');
  const [defaultStatus, setDefaultStatus] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef();

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    if (assignTo) formData.append('assigned_to', assignTo);
    formData.append('default_status', defaultStatus);

    try {
      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreview(res.data);
      toast.success(`✅ ${res.data.message}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (name) => {
    if (!name) return '📄';
    if (name.endsWith('.pdf')) return '📕';
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return '📗';
    if (name.endsWith('.csv')) return '📊';
    return '📄';
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800 text-xl">📤 Upload Leads File</h3>
            <p className="text-sm text-gray-500 mt-0.5">Supports PDF, Excel (.xlsx/.xls), CSV files</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragging ? 'border-indigo-400 bg-indigo-50' : file ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}>
            <input ref={fileInputRef} type="file" accept=".pdf,.xlsx,.xls,.csv,.txt" className="hidden"
              onChange={e => setFile(e.target.files[0])} />
            
            {file ? (
              <div className="space-y-2">
                <span className="text-4xl">{getFileIcon(file.name)}</span>
                <p className="font-semibold text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
                <button onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); }}
                  className="text-xs text-red-500 hover:text-red-700">Remove ✕</button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-5xl">☁️</div>
                <p className="font-semibold text-gray-600">Drag & drop your file here</p>
                <p className="text-sm text-gray-400">or <span className="text-indigo-600 font-medium">click to browse</span></p>
                <div className="flex items-center justify-center gap-2 flex-wrap mt-4">
                  {['PDF', 'Excel', 'CSV'].map(t => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Format guide */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-800 mb-2">📌 Required column names (any order):</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {['name / student_name', 'email / email_address', 'phone / mobile / contact', 'course / program', 'status (hot/warm/normal)'].map(col => (
                <p key={col} className="text-xs text-amber-700 font-mono">• {col}</p>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Default Status</label>
              <select value={defaultStatus} onChange={e => setDefaultStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="normal">📋 Normal</option>
                <option value="warm">⚡ Warm</option>
                <option value="hot">🔥 Hot</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Assign To (optional)</label>
              <select value={assignTo} onChange={e => setAssignTo(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="">Unassigned</option>
                {salesUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview result */}
          {preview && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-green-800 mb-3">
                ✅ Successfully imported {preview.count} leads from "{preview.filename}"
              </p>
              {preview.preview?.length > 0 && (
                <div>
                  <p className="text-xs text-green-700 font-medium mb-2">Preview (first 5):</p>
                  <div className="space-y-1">
                    {preview.preview.map((l, i) => (
                      <p key={i} className="text-xs text-green-700">
                        • {l.name} {l.email ? `(${l.email})` : ''} — <span className="font-medium capitalize">{l.status}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={preview ? () => { onSuccess(); onClose(); } : onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
            {preview ? 'Done ✓' : 'Cancel'}
          </button>
          {!preview && (
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : '🚀 Upload & Import'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
