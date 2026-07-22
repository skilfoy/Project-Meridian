'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, CircleDot, Database, RefreshCw, ShieldAlert } from 'lucide-react';
import { useTheater } from '@/hooks/useTheater';
import { THEATERS } from '@/lib/theaters';

type ChangeType = 'NEW' | 'ESCALATED' | 'DEESCALATED' | 'PERSISTING' | 'RESOLVED' | 'UNCOMPARED';

type Signal = {
  runId: string;
  signalId: string;
  family: string;
  title: string;
  summary: string;
  detectedAt: string;
  methodVersion: string;
  scores: { confidence: number; impact: number; urgency: number; novelty: number };
  dimensions: Record<string, unknown>;
  observationCount: number;
  evidenceCount: number;
  sourceCount: number;
  changeType: ChangeType;
  priorityDelta: number | null;
  priority: number;
};

type Overview = {
  status: 'ready' | 'no_runs';
  theaterId?: string;
  run?: {
    runId: string;
    generatedAt: string;
    methodVersion: string;
    coverage: Record<string, number>;
    feedFailureCount: number;
  };
  changeSummary?: {
    previousRunId: string;
    previousGeneratedAt: string;
    counts: Record<'NEW' | 'ESCALATED' | 'DEESCALATED' | 'PERSISTING' | 'RESOLVED', number>;
    collectionDelta: Record<string, number>;
  } | null;
  signals: Signal[];
  resolvedSignals: Array<{
    signalId: string;
    family: string;
    title: string;
    summary: string;
    detectedAt: string;
    priorityDelta: number;
  }>;
};

type SignalDetail = {
  runId: string;
  signalId: string;
  family: string;
  title: string;
  summary: string;
  detectedAt: string;
  methodVersion: string;
  priority: number;
  observations: Array<{
    observationId: string;
    source: string;
    title: string;
    summary?: string;
    severity: string;
    occurredAt: string;
    tags: string[];
    evidence: Array<{
      evidenceId: string;
      source: string;
      url?: string;
      reliability: number;
      occurredAt: string;
      independenceGroup: string;
    }>;
  }>;
};

const CHANGE_STYLES: Record<ChangeType, string> = {
  NEW: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  ESCALATED: 'border-red-500/30 bg-red-500/10 text-red-300',
  DEESCALATED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  PERSISTING: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  RESOLVED: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
  UNCOMPARED: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
};

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString();
}

function DeltaIcon({ type }: { type: ChangeType }) {
  if (type === 'ESCALATED') return <ArrowUp className="h-3.5 w-3.5" />;
  if (type === 'DEESCALATED') return <ArrowDown className="h-3.5 w-3.5" />;
  if (type === 'RESOLVED') return <CheckCircle2 className="h-3.5 w-3.5" />;
  return <CircleDot className="h-3.5 w-3.5" />;
}

export default function SignalCenterPage() {
  const { activeTheater, setActiveTheaterId } = useTheater();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [selected, setSelected] = useState<Signal | null>(null);
  const [detail, setDetail] = useState<SignalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ChangeType | 'ALL'>('ALL');

  async function loadOverview() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/intelligence/signals?theaterId=${encodeURIComponent(activeTheater.id)}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Signal Center could not be loaded');
      const data = await response.json() as Overview;
      setOverview(data);
      setSelected((current) => {
        if (!current) return data.signals[0] ?? null;
        return data.signals.find((signal) => signal.signalId === current.signalId) ?? data.signals[0] ?? null;
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Signal Center could not be loaded');
    } finally {
      setLoading(false);
    }
  }

  async function collect() {
    setCollecting(true);
    setError(null);
    try {
      const response = await fetch('/api/intelligence/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theaterId: activeTheater.id, persist: true }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Collection failed');
      }
      await loadOverview();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Collection failed');
    } finally {
      setCollecting(false);
    }
  }

  useEffect(() => {
    setSelected(null);
    setDetail(null);
    void loadOverview();
  }, [activeTheater.id]);

  useEffect(() => {
    if (!selected) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    fetch(`/api/intelligence/signals/${encodeURIComponent(selected.runId)}/${encodeURIComponent(selected.signalId)}`, {
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Signal provenance could not be loaded');
        return response.json() as Promise<SignalDetail>;
      })
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Signal provenance could not be loaded');
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected?.runId, selected?.signalId]);

  const visibleSignals = useMemo(() => {
    const signals = overview?.signals ?? [];
    return filter === 'ALL' ? signals : signals.filter((signal) => signal.changeType === filter);
  }, [overview, filter]);

  const run = overview?.run;
  const changeCounts = overview?.changeSummary?.counts;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0a0e1a]">
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-white/[0.06] px-4 py-2">
        {THEATERS.map((theater) => (
          <button
            key={theater.id}
            onClick={() => setActiveTheaterId(theater.id)}
            className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-[11px] font-semibold tracking-wider transition-all ${
              activeTheater.id === theater.id
                ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                : 'border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300'
            }`}
          >
            {theater.shortName}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-cyan-400" />
              <h1 className="text-lg font-bold tracking-wide text-white">Signal Center</h1>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Prioritized intelligence signals, movement, evidence, and provenance for {activeTheater.name}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadOverview()}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => void collect()}
              disabled={collecting}
              className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/15 disabled:opacity-50"
            >
              <Activity className={`h-4 w-4 ${collecting ? 'animate-pulse' : ''}`} />
              {collecting ? 'Collecting' : 'Run Collection'}
            </button>
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {overview?.status === 'no_runs' && !loading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#111827] text-center">
            <Database className="mb-4 h-8 w-8 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-200">No persisted intelligence runs</h2>
            <p className="mt-2 max-w-md text-xs leading-5 text-slate-500">
              Run collection to ingest enabled sources, analyze observations, and establish the first historical baseline.
            </p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
              {[
                ['Incidents', run?.coverage.incidentCount ?? 0],
                ['Sources', run?.coverage.sourceCount ?? 0],
                ['Evidence', run?.coverage.evidenceCount ?? 0],
                ['Signals', run?.coverage.signalCount ?? 0],
                ['New', changeCounts?.NEW ?? 0],
                ['Escalated', changeCounts?.ESCALATED ?? 0],
                ['Resolved', changeCounts?.RESOLVED ?? 0],
                ['Feed failures', run?.feedFailureCount ?? 0],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-white/[0.06] bg-[#111827] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-600">{label}</div>
                  <div className="mt-1 text-xl font-semibold text-white">{value}</div>
                </div>
              ))}
            </section>

            <section className="grid min-h-[520px] grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
              <div className="flex min-h-0 flex-col rounded-xl border border-white/[0.06] bg-[#111827]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] p-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">Prioritized signals</div>
                    <div className="mt-1 text-[10px] text-slate-600">
                      {run ? `Generated ${formatTime(run.generatedAt)} · ${run.methodVersion}` : 'Loading current run'}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(['ALL', 'NEW', 'ESCALATED', 'PERSISTING', 'DEESCALATED'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`rounded-md border px-2 py-1 text-[10px] ${
                          filter === type
                            ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                            : 'border-white/10 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-auto p-2">
                  {loading ? (
                    <div className="p-6 text-center text-xs text-slate-500">Loading intelligence signals…</div>
                  ) : visibleSignals.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">No signals match the selected view.</div>
                  ) : visibleSignals.map((signal) => (
                    <button
                      key={signal.signalId}
                      onClick={() => setSelected(signal)}
                      className={`mb-2 w-full rounded-lg border p-3 text-left transition-all ${
                        selected?.signalId === signal.signalId
                          ? 'border-cyan-500/30 bg-cyan-500/[0.07]'
                          : 'border-white/[0.06] bg-black/10 hover:border-white/15 hover:bg-white/[0.025]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold ${CHANGE_STYLES[signal.changeType]}`}>
                              <DeltaIcon type={signal.changeType} />
                              {signal.changeType}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider text-slate-600">{signal.family}</span>
                          </div>
                          <h3 className="truncate text-sm font-semibold text-slate-100">{signal.title}</h3>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{signal.summary}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-lg font-semibold text-white">{pct(signal.priority)}</div>
                          <div className="text-[9px] uppercase tracking-wider text-slate-600">Priority</div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-2 border-t border-white/[0.05] pt-2 text-[10px] text-slate-500">
                        <span>{signal.sourceCount} sources</span>
                        <span>{signal.observationCount} observations</span>
                        <span>{signal.evidenceCount} evidence</span>
                        <span className="text-right">Novelty {pct(signal.scores.novelty)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-0 rounded-xl border border-white/[0.06] bg-[#111827]">
                {!selected ? (
                  <div className="flex h-full items-center justify-center p-8 text-center text-xs text-slate-500">
                    Select a signal to inspect its scoring, observations, and provenance.
                  </div>
                ) : (
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="border-b border-white/[0.06] p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold ${CHANGE_STYLES[selected.changeType]}`}>
                          <DeltaIcon type={selected.changeType} />
                          {selected.changeType}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-600">{selected.family}</span>
                      </div>
                      <h2 className="mt-3 text-base font-semibold text-white">{selected.title}</h2>
                      <p className="mt-2 text-xs leading-5 text-slate-400">{selected.summary}</p>
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        {Object.entries(selected.scores).map(([label, value]) => (
                          <div key={label} className="rounded-lg border border-white/[0.06] bg-black/15 p-2">
                            <div className="text-[9px] uppercase tracking-wider text-slate-600">{label}</div>
                            <div className="mt-1 text-sm font-semibold text-slate-200">{pct(value)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-auto p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-[11px] uppercase tracking-wider text-slate-500">Evidence chain</div>
                        <div className="text-[10px] text-slate-600">
                          {detail?.observations.length ?? 0} observations
                        </div>
                      </div>
                      {detailLoading ? (
                        <div className="py-8 text-center text-xs text-slate-500">Loading provenance…</div>
                      ) : detail?.observations.map((observation) => (
                        <div key={observation.observationId} className="mb-3 rounded-lg border border-white/[0.06] bg-black/10 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[9px] uppercase tracking-wider text-cyan-500">{observation.source}</div>
                              <div className="mt-1 text-xs font-semibold text-slate-200">{observation.title}</div>
                            </div>
                            <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-slate-500">{observation.severity}</span>
                          </div>
                          {observation.summary && <p className="mt-2 text-[11px] leading-5 text-slate-500">{observation.summary}</p>}
                          <div className="mt-2 text-[9px] text-slate-600">Occurred {formatTime(observation.occurredAt)}</div>
                          <div className="mt-3 space-y-2 border-t border-white/[0.05] pt-2">
                            {observation.evidence.map((evidence) => (
                              <div key={evidence.evidenceId} className="flex items-center justify-between gap-3 text-[10px]">
                                <div className="min-w-0">
                                  {evidence.url ? (
                                    <a href={evidence.url} target="_blank" rel="noreferrer" className="truncate text-cyan-400 hover:underline">
                                      {evidence.source}
                                    </a>
                                  ) : (
                                    <span className="text-slate-400">{evidence.source}</span>
                                  )}
                                  <span className="ml-2 text-slate-700">{evidence.independenceGroup}</span>
                                </div>
                                <span className="shrink-0 text-slate-500">Reliability {pct(evidence.reliability)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
