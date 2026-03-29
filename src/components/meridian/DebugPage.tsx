'use client';
import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Download, ChevronDown, ChevronRight, Radio, Cpu, Rss, AlertCircle, Info } from 'lucide-react';
import { useDebugStore, type LogEntryType } from '@/store/debug.store';
import { Button } from '@/components/ui/Button';

const TYPE_ICONS: Record<LogEntryType, React.ReactNode> = {
  api_call: <Radio className="w-3.5 h-3.5 text-cyan-400"   />,
  ai_call:  <Cpu   className="w-3.5 h-3.5 text-purple-400" />,
  feed:     <Rss   className="w-3.5 h-3.5 text-amber-400"  />,
  error:    <AlertCircle className="w-3.5 h-3.5 text-red-400"    />,
  system:   <Info  className="w-3.5 h-3.5 text-slate-400"  />,
};

const FILTERS: Array<{ label: string; value: LogEntryType | 'all' }> = [
  { label: 'All',      value: 'all' },
  { label: 'API Calls', value: 'api_call' },
  { label: 'AI Calls', value: 'ai_call' },
  { label: 'Feeds',    value: 'feed' },
  { label: 'Errors',   value: 'error' },
  { label: 'System',   value: 'system' },
];

export function DebugPage() {
  const { entries, clearLogs } = useDebugStore();
  const [filter, setFilter]    = useState<LogEntryType | 'all'>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () => filter === 'all' ? entries : entries.filter((e) => e.type === filter),
    [entries, filter]
  );

  const stats = useMemo(() => {
    const total      = entries.length;
    const errors     = entries.filter((e) => e.type === 'error' || (e.status && Number(e.status) >= 400)).length;
    const aiCalls    = entries.filter((e) => e.type === 'ai_call').length;
    const successful = entries.filter((e) => e.status && Number(e.status) < 400).length;
    const latencies  = entries.filter((e) => e.latencyMs).map((e) => e.latencyMs!);
    const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
    return { total, errors, aiCalls, successful, avgLatency };
  }, [entries]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `meridian-debug-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor = (status?: number | string) => {
    const n = Number(status);
    if (!status)   return 'text-slate-500';
    if (n < 300)   return 'text-emerald-400';
    if (n < 400)   return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-bold text-white">Debug Log</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={exportLogs} disabled={!entries.length}>
              <Download className="w-3.5 h-3.5" /> Export JSON
            </Button>
            <Button variant="ghost" size="sm" onClick={clearLogs} disabled={!entries.length}>
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2">
          <span><span className="text-white font-bold">{stats.total}</span> total</span>
          <span><span className="text-emerald-400 font-bold">{stats.successful}</span> success</span>
          <span><span className="text-red-400 font-bold">{stats.errors}</span> errors</span>
          <span><span className="text-cyan-400 font-bold">{stats.avgLatency}ms</span> avg latency</span>
          <span><span className="text-purple-400 font-bold">{stats.aiCalls}</span> AI calls</span>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1.5 mt-3">
          {FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                filter === value ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-auto font-mono text-[11px]">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <Radio className="w-8 h-8 mb-3 opacity-30" />
            <p>No log entries yet</p>
            <p className="text-[10px] mt-1">API calls will appear here in real time</p>
          </div>
        )}

        {filtered.map((entry) => {
          const isExpanded = expanded.has(entry.id);
          const hasDetails = entry.requestBody || entry.responseBody || entry.error;

          return (
            <div key={entry.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
              <div
                className={`flex items-center gap-3 px-4 py-2 ${hasDetails ? 'cursor-pointer' : ''}`}
                onClick={() => hasDetails && toggleExpand(entry.id)}
              >
                {/* Expand toggle */}
                <span className="text-slate-700 w-3 shrink-0">
                  {hasDetails ? (isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />) : null}
                </span>

                {/* Type icon */}
                {TYPE_ICONS[entry.type]}

                {/* Timestamp */}
                <span className="text-slate-600 w-20 shrink-0">
                  {new Date(entry.ts).toLocaleTimeString()}
                </span>

                {/* Source */}
                <span className="text-slate-400 w-24 shrink-0 truncate">{entry.source}</span>

                {/* Method + URL */}
                {entry.method && (
                  <span className="text-amber-500 w-10 shrink-0">{entry.method}</span>
                )}
                <span className="text-slate-300 flex-1 truncate">{entry.url ?? entry.message}</span>

                {/* Status */}
                {entry.status !== undefined && (
                  <span className={`w-10 text-right shrink-0 font-bold ${statusColor(entry.status)}`}>{entry.status}</span>
                )}

                {/* Latency */}
                {entry.latencyMs !== undefined && (
                  <span className="text-slate-600 w-16 text-right shrink-0">{entry.latencyMs}ms</span>
                )}
              </div>

              {/* Expanded details */}
              {isExpanded && hasDetails && (
                <div className="px-4 pb-3 ml-10 space-y-2">
                  {entry.error && (
                    <div className="bg-red-900/20 border border-red-800/30 rounded p-2 text-red-300">{entry.error}</div>
                  )}
                  {entry.requestBody != null && (
                    <div>
                      <div className="text-slate-600 mb-1">Request</div>
                      <pre className="bg-black/30 rounded p-2 text-slate-300 overflow-auto max-h-32 text-[10px]">
                        {JSON.stringify(entry.requestBody, null, 2)}
                      </pre>
                    </div>
                  )}
                  {entry.responseBody != null && (
                    <div>
                      <div className="text-slate-600 mb-1">Response</div>
                      <pre className="bg-black/30 rounded p-2 text-slate-300 overflow-auto max-h-48 text-[10px]">
                        {JSON.stringify(entry.responseBody, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
