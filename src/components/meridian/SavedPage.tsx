'use client';
import { useState, useEffect, useCallback } from 'react';
import { Bookmark, Trash2, FileText, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SavedIncident {
  id:         string;
  incidentId: string;
  source:     string;
  title:      string;
  summary:    string | null;
  url:        string | null;
  severity:   string;
  theaterId:  string | null;
  occurredAt: string;
  savedAt:    string;
  notes:      string | null;
}

const SEV_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH:     'bg-orange-500',
  MEDIUM:   'bg-amber-500',
  LOW:      'bg-blue-500',
  INFO:     'bg-slate-500',
};

export function SavedPage() {
  const [incidents, setIncidents] = useState<SavedIncident[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    fetch('/api/saved')
      .then((r) => r.json())
      .then((d: { incidents?: SavedIncident[] }) => setIncidents(d.incidents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const unsave = async (id: string) => {
    await fetch(`/api/saved/${id}`, { method: 'DELETE' });
    setIncidents((p) => p.filter((i) => i.id !== id));
  };

  const saveNotes = async (id: string) => {
    const notes = editNotes[id];
    await fetch(`/api/saved/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ notes }),
    });
    setIncidents((p) => p.map((i) => i.id === id ? { ...i, notes: notes ?? null } : i));
    setEditNotes((p) => { const n = { ...p }; delete n[id]; return n; });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-white/[0.06] shrink-0">
        <h1 className="text-lg font-bold text-white">Saved Incidents</h1>
        <p className="text-slate-500 text-xs mt-0.5">{incidents.length} saved</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4].map((i) => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600 gap-3">
            <Bookmark className="w-10 h-10 opacity-30" />
            <p className="text-sm">No saved incidents yet</p>
            <p className="text-xs text-slate-700">Bookmark incidents from any feed to save them here</p>
          </div>
        ) : (
          <div className="space-y-2 max-w-3xl">
            {incidents.map((inc) => (
              <div key={inc.id} className="bg-[#111827] border border-white/[0.08] rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className={`block w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEV_COLORS[inc.severity] ?? 'bg-slate-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-slate-200 leading-snug">{inc.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{inc.source}</span>
                        <span className="text-slate-700">·</span>
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span className="text-[10px] text-slate-500">
                          {formatDistanceToNow(new Date(inc.occurredAt), { addSuffix: true })}
                        </span>
                      </div>
                      {/* Notes */}
                      {editNotes[inc.id] !== undefined ? (
                        <div className="mt-2 flex items-end gap-2">
                          <textarea
                            className="flex-1 bg-black/30 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                            rows={2}
                            placeholder="Add notes…"
                            value={editNotes[inc.id]}
                            onChange={(e) => setEditNotes((p) => ({ ...p, [inc.id]: e.target.value }))}
                          />
                          <button onClick={() => saveNotes(inc.id)} className="text-[11px] text-cyan-400 hover:text-cyan-300 shrink-0">Save</button>
                          <button onClick={() => setEditNotes((p) => { const n = {...p}; delete n[inc.id]; return n; })} className="text-[11px] text-slate-500 hover:text-slate-300 shrink-0">Cancel</button>
                        </div>
                      ) : (
                        <div className="mt-1.5 flex items-center gap-2">
                          {inc.notes && <p className="text-[11px] text-slate-500 italic">{inc.notes}</p>}
                          <button
                            onClick={() => setEditNotes((p) => ({ ...p, [inc.id]: inc.notes ?? '' }))}
                            className="text-[10px] text-slate-600 hover:text-slate-400 flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            {inc.notes ? 'Edit notes' : 'Add notes'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => unsave(inc.id)} className="text-slate-700 hover:text-red-400 transition-colors shrink-0 mt-0.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
