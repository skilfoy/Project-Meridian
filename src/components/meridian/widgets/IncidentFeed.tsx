'use client';
import { ExternalLink, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { NormalizedIncident } from '@/types/feeds';

const SEV_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH:     'bg-orange-500',
  MEDIUM:   'bg-amber-500',
  LOW:      'bg-blue-500',
  INFO:     'bg-slate-500',
};

interface IncidentFeedProps {
  incidents: NormalizedIncident[];
  loading?: boolean;
}

export function IncidentFeed({ incidents, loading }: IncidentFeedProps) {
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
    <div className="space-y-1.5 overflow-y-auto max-h-[400px] pr-1">
      {incidents.map((inc) => (
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
              {inc.url && (
                <a href={inc.url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
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
      ))}
    </div>
  );
}
