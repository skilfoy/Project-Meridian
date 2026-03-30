'use client';
import { useState, useMemo }      from 'react';
import { ExternalLink, Clock, Bookmark } from 'lucide-react';
import { formatDistanceToNow }  from 'date-fns';
import type { NormalizedIncident } from '@/types/feeds';

const SEV_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH:     'bg-orange-500',
  MEDIUM:   'bg-amber-500',
  LOW:      'bg-blue-500',
  INFO:     'bg-slate-500',
};

const SEV_CHIP: Record<string, string> = {
  CRITICAL: 'bg-red-900/50 text-red-400 border-red-800/50 hover:bg-red-900/70',
  HIGH:     'bg-orange-900/50 text-orange-400 border-orange-800/50 hover:bg-orange-900/70',
  MEDIUM:   'bg-amber-900/50 text-amber-400 border-amber-800/50 hover:bg-amber-900/70',
  LOW:      'bg-blue-900/50 text-blue-400 border-blue-800/50 hover:bg-blue-900/70',
  INFO:     'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-800/70',
};

const SEVERITIES = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const;

interface IncidentFeedProps {
  incidents:  NormalizedIncident[];
  loading?:   boolean;
  onSave?:    (inc: NormalizedIncident) => void;
  theaterId?: string;
}

export function IncidentFeed({ incidents, loading, onSave, theaterId }: IncidentFeedProps) {
  const [saved, setSaved]               = useState<Set<string>>(new Set());
  const [severityFilter, setSeverity]   = useState<string>('ALL');
  const [sourceFilter, setSource]       = useState<string>('ALL');

  const sources = useMemo(() => {
    const unique = Array.from(new Set(incidents.map((i) => i.source))).sort();
    return ['ALL', ...unique];
  }, [incidents]);

  const filtered = useMemo(() => {
    return incidents.filter((i) => {
      if (severityFilter !== 'ALL' && i.severity !== severityFilter) return false;
      if (sourceFilter   !== 'ALL' && i.source   !== sourceFilter)   return false;
      return true;
    });
  }, [incidents, severityFilter, sourceFilter]);

  const handleSave = async (inc: NormalizedIncident) => {
    setSaved((prev) => new Set([...prev, inc.id]));
    try {
      await fetch('/api/saved', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          incidentId: inc.id,
          source:     inc.source,
          title:      inc.title,
          summary:    inc.summary,
          url:        inc.url,
          severity:   inc.severity,
          theaterId:  theaterId,
          occurredAt: inc.occurredAt ?? new Date().toISOString(),
        }),
      });
    } catch {
      setSaved((prev) => { const n = new Set(prev); n.delete(inc.id); return n; });
    }
    onSave?.(inc);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!incidents.length) {
    return <div className="text-slate-500 text-sm text-center py-8">No incidents to display</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1">
        {SEVERITIES.map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverity(sev)}
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
              sev === 'ALL'
                ? severityFilter === 'ALL'
                  ? 'bg-white/10 text-slate-200 border-white/20'
                  : 'bg-white/[0.03] text-slate-500 border-white/10 hover:bg-white/[0.07]'
                : severityFilter === sev
                  ? SEV_CHIP[sev]
                  : 'bg-white/[0.03] text-slate-600 border-white/10 hover:bg-white/[0.07]'
            }`}
          >
            {sev}
          </button>
        ))}
        {sources.length > 2 && (
          <select
            value={sourceFilter}
            onChange={(e) => setSource(e.target.value)}
            className="text-[10px] bg-black/30 border border-white/[0.08] rounded px-1.5 py-0.5 text-slate-500 focus:outline-none ml-1"
          >
            {sources.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'All sources' : s}</option>)}
          </select>
        )}
        {(severityFilter !== 'ALL' || sourceFilter !== 'ALL') && (
          <span className="text-[10px] text-slate-600 ml-1">{filtered.length} shown</span>
        )}
      </div>

      {/* List */}
      <div className="space-y-1.5 overflow-y-auto max-h-[400px] pr-1">
        {filtered.length === 0 ? (
          <div className="text-slate-600 text-xs text-center py-6">No incidents match filters</div>
        ) : (
          filtered.map((inc) => (
            <div
              key={inc.id}
              className="group flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all"
            >
              {/* Severity dot */}
              <div className="mt-1.5 shrink-0">
                <span className={`block w-2 h-2 rounded-full ${SEV_COLORS[inc.severity] ?? 'bg-slate-500'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] text-slate-200 leading-snug line-clamp-2">{inc.title}</p>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                    {onSave && (
                      <button
                        onClick={() => handleSave(inc)}
                        className={`transition-colors ${saved.has(inc.id) ? 'text-cyan-400' : 'text-slate-500 hover:text-cyan-400'}`}
                        title="Save incident"
                      >
                        <Bookmark className={`w-3 h-3 ${saved.has(inc.id) ? 'fill-current' : ''}`} />
                      </button>
                    )}
                    {inc.url && (
                      <a href={inc.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{inc.source}</span>
                  <span className="text-slate-700">·</span>
                  <Clock className="w-3 h-3 text-slate-600" />
                  <span className="text-[10px] text-slate-500">
                    {inc.occurredAt ? formatDistanceToNow(new Date(inc.occurredAt), { addSuffix: true }) : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
