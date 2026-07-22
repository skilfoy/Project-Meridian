'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Bookmark,
  BriefcaseBusiness,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  MessageSquarePlus,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { useTheater } from '@/hooks/useTheater';

type Signal = {
  runId: string;
  signalId: string;
  family: string;
  title: string;
  summary: string;
  detectedAt: string;
  dimensions: Record<string, unknown>;
  priority: number;
  changeType: string;
};

type SignalOverview = {
  status: 'ready' | 'no_runs';
  signals: Signal[];
};

type SignalCaseNote = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
};

type SignalCase = {
  id: string;
  signalKey: string;
  theaterId?: string | null;
  family: string;
  title: string;
  status: CaseStatus;
  disposition?: CaseDisposition | null;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
  assignedTo?: string | null;
  watched: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  latestRunId?: string | null;
  latestSignalId?: string | null;
  updatedAt: string;
  notes: SignalCaseNote[];
};

type CaseStatus = 'OPEN' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'MONITORING' | 'CLOSED';
type CaseDisposition =
  | 'TRUE_POSITIVE'
  | 'FALSE_POSITIVE'
  | 'BENIGN'
  | 'INFORMATIONAL'
  | 'DUPLICATE'
  | 'MITIGATED'
  | 'ACCEPTED_RISK';

const STATUSES: CaseStatus[] = ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'MONITORING', 'CLOSED'];
const DISPOSITIONS: CaseDisposition[] = [
  'TRUE_POSITIVE',
  'FALSE_POSITIVE',
  'BENIGN',
  'INFORMATIONAL',
  'DUPLICATE',
  'MITIGATED',
  'ACCEPTED_RISK',
];

function humanize(value: string): string {
  return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeTitle(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function signalKey(signal: Signal): string {
  const discriminator = [
    signal.dimensions.domain,
    signal.dimensions.locationBucket,
    signal.dimensions.topicKey,
  ].find((value) => typeof value === 'string' && value.length > 0);

  return `${signal.family}:${typeof discriminator === 'string' ? discriminator : normalizeTitle(signal.title)}`;
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString();
}

export function SignalCaseWorkbench() {
  const { activeTheater } = useTheater();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [cases, setCases] = useState<SignalCase[]>([]);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [assignedTo, setAssignedTo] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const selectedSignal = useMemo(
    () => signals.find((signal) => signal.signalId === selectedSignalId) ?? signals[0] ?? null,
    [signals, selectedSignalId]
  );

  const selectedCase = useMemo(() => {
    if (!selectedSignal) return null;
    const key = signalKey(selectedSignal);
    return cases.find((item) => item.signalKey === key) ?? null;
  }, [cases, selectedSignal]);

  async function load() {
    if (!open) return;
    setLoading(true);
    setError(null);
    try {
      const query = encodeURIComponent(activeTheater.id);
      const [signalsResponse, casesResponse] = await Promise.all([
        fetch(`/api/intelligence/signals?theaterId=${query}`, { cache: 'no-store' }),
        fetch(`/api/intelligence/cases?theaterId=${query}`, { cache: 'no-store' }),
      ]);

      if (!signalsResponse.ok) throw new Error('Could not load current signals');
      if (!casesResponse.ok) throw new Error('Could not load investigation cases');

      const signalData = await signalsResponse.json() as SignalOverview;
      const caseData = await casesResponse.json() as { cases: SignalCase[] };
      setSignals(signalData.signals ?? []);
      setCases(caseData.cases ?? []);
      setSelectedSignalId((current) =>
        signalData.signals.some((signal) => signal.signalId === current)
          ? current
          : signalData.signals[0]?.signalId ?? null
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load investigations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSelectedSignalId(null);
    setAssignedTo('');
    setNote('');
    void load();
  }, [activeTheater.id, open]);

  useEffect(() => {
    setAssignedTo(selectedCase?.assignedTo ?? '');
  }, [selectedCase?.id, selectedCase?.assignedTo]);

  async function ensureCase(): Promise<SignalCase> {
    if (!selectedSignal) throw new Error('Select a signal before opening an investigation');
    if (selectedCase) return selectedCase;

    const response = await fetch('/api/intelligence/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signalKey: signalKey(selectedSignal),
        theaterId: activeTheater.id,
        family: selectedSignal.family,
        title: selectedSignal.title,
        firstSeenAt: selectedSignal.detectedAt,
        lastSeenAt: selectedSignal.detectedAt,
        latestRunId: selectedSignal.runId,
        latestSignalId: selectedSignal.signalId,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error ?? 'Could not open investigation');
    }

    const created = await response.json() as SignalCase;
    setCases((current) => [created, ...current.filter((item) => item.id !== created.id)]);
    return created;
  }

  async function patchCase(changes: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const currentCase = await ensureCase();
      const response = await fetch(`/api/intelligence/cases/${encodeURIComponent(currentCase.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Could not update investigation');
      }

      const updated = await response.json() as SignalCase;
      setCases((current) => [updated, ...current.filter((item) => item.id !== updated.id)]);
      return updated;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update investigation');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function openInvestigation() {
    setSaving(true);
    setError(null);
    try {
      await ensureCase();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open investigation');
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    const body = note.trim();
    if (!body) return;
    const updated = await patchCase({ note: body });
    if (updated) setNote('');
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-5 right-5 z-40 flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-[#111827]/95 px-4 py-3 text-xs font-semibold text-cyan-300 shadow-2xl backdrop-blur hover:bg-[#162033]"
      >
        <BriefcaseBusiness className="h-4 w-4" />
        Investigation Workbench
        {cases.filter((item) => item.status !== 'CLOSED').length > 0 && (
          <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px]">
            {cases.filter((item) => item.status !== 'CLOSED').length}
          </span>
        )}
      </button>
    );
  }

  return (
    <aside className="absolute bottom-4 right-4 top-4 z-40 flex w-[430px] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f1629]/98 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <BriefcaseBusiness className="h-4 w-4 text-cyan-400" />
            Investigation Workbench
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">{activeTheater.name}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed((value) => !value)}
            className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300"
            aria-label={collapsed ? 'Expand workbench' : 'Collapse workbench'}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300"
            aria-label="Close workbench"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="min-h-0 flex-1 overflow-auto p-4">
          {error && (
            <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-xs text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading investigations
            </div>
          ) : signals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
              Run collection to create signals before opening an investigation.
            </div>
          ) : (
            <>
              <label className="text-[10px] uppercase tracking-wider text-slate-600">Signal</label>
              <select
                value={selectedSignal?.signalId ?? ''}
                onChange={(event) => setSelectedSignalId(event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500/40"
              >
                {signals.map((signal) => (
                  <option key={signal.signalId} value={signal.signalId}>
                    {signal.title}
                  </option>
                ))}
              </select>

              {selectedSignal && (
                <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/15 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-cyan-500">{selectedSignal.family}</div>
                      <div className="mt-1 text-sm font-semibold text-slate-100">{selectedSignal.title}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{Math.round(selectedSignal.priority * 100)}%</div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-600">Priority</div>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-3 text-[11px] leading-5 text-slate-500">{selectedSignal.summary}</p>
                </div>
              )}

              {!selectedCase ? (
                <button
                  onClick={() => void openInvestigation()}
                  disabled={saving}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/15 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Open investigation
                </button>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-slate-600">Status</label>
                      <select
                        value={selectedCase.status}
                        disabled={saving}
                        onChange={(event) => void patchCase({ status: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500/40"
                      >
                        {STATUSES.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-slate-600">Disposition</label>
                      <select
                        value={selectedCase.disposition ?? ''}
                        disabled={saving}
                        onChange={(event) => void patchCase({ disposition: event.target.value || null })}
                        className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500/40"
                      >
                        <option value="">Unassigned</option>
                        {DISPOSITIONS.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-black/10 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-4 w-4 text-slate-500" />
                      <div>
                        <div className="text-xs font-medium text-slate-300">Watch this signal</div>
                        <div className="text-[10px] text-slate-600">Keep it pinned in the investigation queue.</div>
                      </div>
                    </div>
                    <button
                      disabled={saving}
                      onClick={() => void patchCase({ watched: !selectedCase.watched })}
                      className={`rounded-lg border p-2 ${selectedCase.watched ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' : 'border-white/10 text-slate-500'}`}
                    >
                      {selectedCase.watched ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-600">
                      <UserRound className="h-3.5 w-3.5" />
                      Assigned analyst
                    </label>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={assignedTo}
                        onChange={(event) => setAssignedTo(event.target.value)}
                        placeholder="User ID, email, or analyst name"
                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-500/40"
                      />
                      <button
                        onClick={() => void patchCase({ assignedTo: assignedTo.trim() || null })}
                        disabled={saving}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 text-slate-400 hover:bg-white/10 hover:text-slate-200 disabled:opacity-50"
                        aria-label="Save assignment"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-600">
                      <MessageSquarePlus className="h-3.5 w-3.5" />
                      Analyst note
                    </label>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={3}
                      placeholder="Record assessment, actions, or handoff context"
                      className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs leading-5 text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-500/40"
                    />
                    <button
                      onClick={() => void addNote()}
                      disabled={saving || !note.trim()}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}
                      Add note
                    </button>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-600">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Case history
                      </div>
                      <div className="text-[10px] text-slate-700">Updated {formatTime(selectedCase.updatedAt)}</div>
                    </div>
                    {selectedCase.acknowledgedAt && (
                      <div className="mb-3 rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-3 py-2 text-[10px] text-emerald-300">
                        Acknowledged {formatTime(selectedCase.acknowledgedAt)}
                      </div>
                    )}
                    {selectedCase.notes.length === 0 ? (
                      <div className="text-[11px] text-slate-600">No analyst notes recorded.</div>
                    ) : (
                      <div className="space-y-2">
                        {selectedCase.notes.map((item) => (
                          <div key={item.id} className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5">
                            <div className="text-[10px] leading-5 text-slate-400">{item.body}</div>
                            <div className="mt-1 flex items-center justify-between text-[9px] text-slate-700">
                              <span>{item.authorId}</span>
                              <span>{formatTime(item.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </aside>
  );
}
