'use client';
import { useState } from 'react';
import { THEATERS }      from '@/lib/theaters';
import { useFeed }       from '@/hooks/useFeeds';
import type { NormalizedIncident, FeedResult } from '@/types/feeds';
import { TrendingUp, AlertTriangle } from 'lucide-react';

const MAX_COMPARE = 4;

const SEV_ORDER: Record<string, number> = { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFO: 1 };
const SEV_COLORS: Record<string, string> = {
  CRITICAL: 'text-red-400',
  HIGH:     'text-orange-400',
  MEDIUM:   'text-amber-400',
  LOW:      'text-blue-400',
  INFO:     'text-slate-400',
};

function kpi(incidents: NormalizedIncident[]) {
  return {
    total:    incidents.length,
    critical: incidents.filter((i) => i.severity === 'CRITICAL').length,
    high:     incidents.filter((i) => i.severity === 'HIGH').length,
    topDomains: Object.entries(
      incidents.reduce((acc, i) => { acc[i.domain] = (acc[i.domain] ?? 0) + 1; return acc; }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]).slice(0, 5),
    recent: [...incidents].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()).slice(0, 3),
  };
}

function CompareColumn({ theaterId }: { theaterId: string }) {
  const theater = THEATERS.find((t) => t.id === theaterId);
  const { data, isLoading } = useFeed('gdelt', theaterId, 50) as { data?: FeedResult; isLoading: boolean };

  const incidents = data?.incidents ?? [];
  const stats     = kpi(incidents);

  if (!theater) return null;

  return (
    <div className="flex-1 min-w-0 bg-[#111827] border border-white/[0.08] rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: theater.color }} />
        <div>
          <div className="font-bold text-white text-[13px]">{theater.shortName}</div>
          <div className="text-[10px] text-slate-500">{theater.name}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <KPI label="Total" value={stats.total} color="text-slate-300" />
            <KPI label="Critical" value={stats.critical} color="text-red-400" />
            <KPI label="High" value={stats.high} color="text-orange-400" />
          </div>

          {/* Top domains */}
          {stats.topDomains.length > 0 && (
            <div className="mb-4">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Top Domains
              </div>
              <div className="space-y-1">
                {stats.topDomains.map(([domain, count]) => (
                  <div key={domain} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 truncate">{domain}</span>
                    <span className="text-slate-600 shrink-0 ml-2">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent incidents */}
          {stats.recent.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Recent
              </div>
              <div className="space-y-1.5">
                {stats.recent.map((inc) => (
                  <div key={inc.id} className="text-[11px] flex gap-2">
                    <span className={`shrink-0 font-medium ${SEV_COLORS[inc.severity] ?? 'text-slate-500'}`}>
                      {inc.severity[0]}
                    </span>
                    <span className="text-slate-400 line-clamp-2">{inc.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {incidents.length === 0 && (
            <p className="text-[11px] text-slate-600 text-center py-4">No data</p>
          )}
        </>
      )}
    </div>
  );
}

function KPI({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-600">{label}</div>
    </div>
  );
}

export function ComparePage() {
  const [selected, setSelected] = useState<string[]>([THEATERS[0].id, THEATERS[1].id]);

  const addTheater = (id: string) => {
    if (selected.length < MAX_COMPARE && !selected.includes(id)) {
      setSelected((p) => [...p, id]);
    }
  };

  const removeTheater = (id: string) => setSelected((p) => p.filter((t) => t !== id));

  const available = THEATERS.filter((t) => !selected.includes(t.id));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-white">Compare Theaters</h1>
          <span className="text-[11px] text-slate-500">Up to {MAX_COMPARE} theaters</span>
        </div>
        {/* Theater selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {selected.map((id) => {
            const t = THEATERS.find((th) => th.id === id);
            if (!t) return null;
            return (
              <div key={id} className="flex items-center gap-1.5 bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-1">
                <div className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                <span className="text-[11px] text-slate-300">{t.shortName}</span>
                {selected.length > 2 && (
                  <button onClick={() => removeTheater(id)} className="text-slate-600 hover:text-red-400 ml-1">×</button>
                )}
              </div>
            );
          })}
          {selected.length < MAX_COMPARE && available.length > 0 && (
            <select
              className="bg-black/30 border border-white/[0.08] rounded-lg px-2.5 py-1 text-[11px] text-slate-500 focus:outline-none"
              value=""
              onChange={(e) => e.target.value && addTheater(e.target.value)}
            >
              <option value="">+ Add theater</option>
              {available.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-4 h-full min-h-0">
          {selected.map((id) => (
            <CompareColumn key={id} theaterId={id} />
          ))}
        </div>
      </div>
    </div>
  );
}
