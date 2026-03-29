'use client';
import { Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { TheaterIntel } from '@/types';

interface ExecSummaryProps {
  intel: TheaterIntel | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
}

export function ExecSummary({ intel, loading, error, onGenerate }: ExecSummaryProps) {
  return (
    <div className="space-y-3">
      {!intel && !loading && (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
          <Sparkles className="w-8 h-8 text-slate-600" />
          <p className="text-slate-500 text-sm">Generate an AI-powered executive summary for this theater</p>
          <Button variant="primary" size="sm" onClick={onGenerate}>
            <Sparkles className="w-3.5 h-3.5" />
            Generate Intel
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
          <p className="text-slate-400 text-sm">Analyzing theater conditions…</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800/40 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {intel && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              intel.threatLevel === 'CRITICAL' ? 'bg-red-900/60 text-red-400' :
              intel.threatLevel === 'HIGH'     ? 'bg-orange-900/60 text-orange-400' :
              intel.threatLevel === 'MEDIUM'   ? 'bg-amber-900/60 text-amber-400' : 'bg-blue-900/60 text-blue-400'
            }`}>{intel.threatLevel}</span>
            <button onClick={onGenerate} className="text-slate-500 hover:text-slate-300 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed">{intel.summary}</p>

          <div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">Key Developments</div>
            <ul className="space-y-1">
              {intel.keyDevelopments.map((d, i) => (
                <li key={i} className="text-[12px] text-slate-400 flex gap-2">
                  <span className="text-cyan-500 mt-0.5 shrink-0">›</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">Watch Items</div>
            <ul className="space-y-1">
              {intel.watchItems.map((w, i) => (
                <li key={i} className="text-[12px] text-slate-400 flex gap-2">
                  <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-[10px] text-slate-600">
            Generated {new Date(intel.generatedAt).toLocaleString()}
            {intel.cachedAt && ' (cached)'}
          </div>
        </div>
      )}
    </div>
  );
}
