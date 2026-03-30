'use client';
import { useFeed } from '@/hooks/useFeeds';
import { useDashboard } from '@/hooks/useDashboard';
import { KPIStrip }       from './widgets/KPIStrip';
import { IncidentFeed }   from './widgets/IncidentFeed';
import { TrendChart }     from './widgets/TrendChart';
import { ThreatMatrix }   from './widgets/ThreatMatrix';
import { ExecSummary }    from './widgets/ExecSummary';
import type { Theater } from '@/types';
import type { NormalizedIncident } from '@/types/feeds';

interface DashboardProps {
  theater: Theater;
}

function buildTrend(incidents: NormalizedIncident[]) {
  const now = Date.now();
  return Array.from({ length: 14 }, (_, i) => {
    const dayStart = now - (13 - i) * 86400000;
    const dayEnd   = dayStart + 86400000;
    return {
      date:      new Date(dayStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      incidents: incidents.filter((inc) => {
        const t = new Date(inc.occurredAt).getTime();
        return t >= dayStart && t < dayEnd;
      }).length,
    };
  });
}

export function Dashboard({ theater }: DashboardProps) {
  const { data: gdeltData,    isLoading: gdeltLoading }    = useFeed('gdelt', theater.id);
  const { data: cisaData }                                  = useFeed('cisa-kev');
  const { data: reliefData }                                = useFeed('reliefweb', theater.id);
  const { data: interpolData }                              = useFeed('interpol-notices');
  const { data: usgsData }                                  = useFeed('usgs-earthquake');
  const { intel, loading: aiLoading, error: aiError, generateIntel } = useDashboard(theater.id);

  const allIncidents = [
    ...(gdeltData?.incidents    ?? []),
    ...(cisaData?.incidents     ?? []),
    ...(reliefData?.incidents   ?? []),
    ...(interpolData?.incidents ?? []),
    ...(usgsData?.incidents     ?? []),
  ].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  const criticalCount = allIncidents.filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;
  const feedsOnline   = [gdeltData, cisaData, reliefData, interpolData, usgsData].filter(Boolean).length;
  const trendData     = buildTrend(allIncidents);

  return (
    <div className="flex flex-col h-full overflow-auto p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide">{theater.name}</h1>
          <p className="text-slate-500 text-xs mt-0.5">{theater.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600 uppercase tracking-wider">Countries:</span>
          <div className="flex gap-1">
            {theater.countries.slice(0, 5).map((c) => (
              <span key={c} className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-mono text-slate-400">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <KPIStrip
        threatLevel={intel?.threatLevel ?? 'UNKNOWN'}
        activeIncidents={criticalCount}
        feedsOnline={feedsOnline}
        lastUpdated={gdeltData?.meta.fetchedAt ? new Date(gdeltData.meta.fetchedAt).toLocaleTimeString() : '—'}
      />

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-4 flex-1">
        {/* Incident Feed — 2 cols */}
        <div className="col-span-2 bg-[#111827] border border-white/[0.06] rounded-xl p-4">
          <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Live Incident Feed</span>
            <span className="text-slate-600">{allIncidents.length} events</span>
          </div>
          <IncidentFeed incidents={allIncidents.slice(0, 30)} loading={gdeltLoading} theaterId={theater.id} />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* AI Executive Summary */}
          <div className="bg-[#111827] border border-white/[0.06] rounded-xl p-4">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="text-cyan-500">✦</span> AI Executive Summary
            </div>
            <ExecSummary intel={intel} loading={aiLoading} error={aiError} onGenerate={() => generateIntel(allIncidents)} />
          </div>

          {/* Threat Matrix */}
          <div className="bg-[#111827] border border-white/[0.06] rounded-xl p-4">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-3">Threat Matrix</div>
            <ThreatMatrix incidents={allIncidents} />
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-[#111827] border border-white/[0.06] rounded-xl p-4">
        <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-3">14-Day Incident Trend</div>
        <TrendChart data={trendData} />
      </div>
    </div>
  );
}
