'use client';
import { useState, useEffect, useCallback } from 'react';
import { Eye, Plus, Trash2, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { THEATERS }  from '@/lib/theaters';
import { Button }    from '@/components/ui/Button';
import type { Theater } from '@/types';

interface WatchedTheater extends Theater {
  incidentCount?: number;
}

export function WatchlistPage() {
  const [theaterIds, setTheaterIds]   = useState<string[]>([]);
  const [loading,    setLoading]      = useState(true);
  const [showModal,  setShowModal]    = useState(false);

  const load = useCallback(() => {
    fetch('/api/watchlist')
      .then((r) => r.json())
      .then((d: { theaterIds?: string[] }) => setTheaterIds(d.theaterIds ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (theaterId: string) => {
    await fetch(`/api/watchlist?theaterId=${theaterId}`, { method: 'DELETE' });
    setTheaterIds((p) => p.filter((id) => id !== theaterId));
  };

  const add = async (theaterId: string) => {
    await fetch('/api/watchlist', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ theaterId }),
    });
    setTheaterIds((p) => Array.from(new Set([...p, theaterId])));
    setShowModal(false);
  };

  const watched: WatchedTheater[] = theaterIds
    .map((id) => THEATERS.find((t) => t.id === id))
    .filter(Boolean) as WatchedTheater[];

  const unwatched = THEATERS.filter((t) => !theaterIds.includes(t.id));

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-6 py-4 border-b border-white/[0.06] shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Watchlist</h1>
          <p className="text-slate-500 text-xs mt-0.5">Monitor specific theaters for threat activity</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-3.5 h-3.5" /> Add Theater
        </Button>
      </div>

      <div className="flex-1 p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3].map((i) => <div key={i} className="h-40 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : watched.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600 gap-3">
            <Eye className="w-10 h-10 opacity-30" />
            <p className="text-sm">No theaters on watchlist</p>
            <Button variant="secondary" size="sm" onClick={() => setShowModal(true)}>
              <Plus className="w-3.5 h-3.5" /> Add your first theater
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {watched.map((theater) => (
              <TheaterCard key={theater.id} theater={theater} onRemove={remove} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddTheaterModal theaters={unwatched} onAdd={add} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

function TheaterCard({ theater, onRemove }: { theater: Theater; onRemove: (id: string) => void }) {
  return (
    <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: theater.color }} />
          <div>
            <div className="font-semibold text-white text-[13px]">{theater.name}</div>
            <div className="text-[10px] text-slate-600 font-mono">{theater.shortName}</div>
          </div>
        </div>
        <button onClick={() => onRemove(theater.id)} className="text-slate-700 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{theater.description}</p>
      <div className="flex items-center gap-3 text-[11px]">
        <span className="text-slate-500">Countries: <span className="text-slate-300">{theater.countries.join(', ')}</span></span>
      </div>
    </div>
  );
}

function AddTheaterModal({ theaters, onAdd, onClose }: { theaters: Theater[]; onAdd: (id: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111827] border border-white/[0.08] rounded-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Add Theater to Watchlist</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg leading-none">×</button>
        </div>
        {theaters.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">All theaters are already on your watchlist</p>
        ) : (
          <div className="space-y-2">
            {theaters.map((t) => (
              <button
                key={t.id}
                onClick={() => onAdd(t.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/10 transition-all text-left"
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color }} />
                <div>
                  <div className="text-[13px] text-white font-medium">{t.name}</div>
                  <div className="text-[11px] text-slate-500">{t.description}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
