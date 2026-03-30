'use client';
import { useState, useMemo } from 'react';
import { Search, ExternalLink, X, Shield } from 'lucide-react';
import { THREAT_ACTORS, type ThreatActor } from '@/lib/actors';

const ORIGIN_COLORS: Record<string, string> = {
  'Russia':                    'text-red-400',
  'China':                     'text-yellow-400',
  'Iran':                      'text-orange-400',
  'North Korea':               'text-purple-400',
  'Eastern Europe':            'text-rose-400',
  'Western (English-speaking)': 'text-blue-400',
  'UK / South America':        'text-blue-400',
};

export function ActorsPage() {
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState<ThreatActor | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return THREAT_ACTORS;
    return THREAT_ACTORS.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.aliases.some((al) => al.toLowerCase().includes(q)) ||
        a.origin.toLowerCase().includes(q) ||
        a.motivation.some((m) => m.toLowerCase().includes(q)) ||
        a.targets.some((t) => t.toLowerCase().includes(q))
    );
  }, [search]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Actor list */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] shrink-0">
          <h1 className="text-lg font-bold text-white mb-3">Threat Actors</h1>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input
              className="w-full bg-black/30 border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
              placeholder="Search actors, aliases, origin…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((actor) => (
              <button
                key={actor.id}
                onClick={() => setSelected(actor)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  selected?.id === actor.id
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-[#111827] border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-bold text-white text-[13px]">{actor.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!actor.active && (
                      <span className="text-[9px] text-slate-600 bg-white/5 px-1.5 py-0.5 rounded">INACTIVE</span>
                    )}
                    <span className={`text-[10px] font-medium ${ORIGIN_COLORS[actor.origin] ?? 'text-slate-400'}`}>
                      {actor.origin}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {actor.aliases.slice(0, 3).map((a) => (
                    <span key={a} className="text-[9px] bg-white/5 text-slate-500 px-1.5 py-0.5 rounded">{a}</span>
                  ))}
                  {actor.aliases.length > 3 && (
                    <span className="text-[9px] text-slate-600">+{actor.aliases.length - 3}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {actor.motivation.map((m) => (
                    <span key={m} className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded capitalize">{m}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <ActorDetailDrawer actor={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function ActorDetailDrawer({ actor, onClose }: { actor: ThreatActor; onClose: () => void }) {
  return (
    <div className="w-80 shrink-0 border-l border-white/[0.08] flex flex-col overflow-hidden bg-[#0f1629]">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <h2 className="font-bold text-white text-[13px]">{actor.name}</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4 text-[12px]">
        {/* Origin + TLP */}
        <div className="flex items-center justify-between">
          <span className={`font-medium ${ORIGIN_COLORS[actor.origin] ?? 'text-slate-400'}`}>{actor.origin}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
            actor.tlp === 'WHITE' ? 'text-white border-white/20' :
            actor.tlp === 'GREEN' ? 'text-emerald-400 border-emerald-500/30' :
            'text-amber-400 border-amber-500/30'
          }`}>TLP:{actor.tlp}</span>
        </div>

        {/* Aliases */}
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Aliases</div>
          <div className="flex flex-wrap gap-1">
            {actor.aliases.map((a) => (
              <span key={a} className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded">{a}</span>
            ))}
          </div>
        </div>

        {/* Motivation */}
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Motivation</div>
          <div className="flex flex-wrap gap-1">
            {actor.motivation.map((m) => (
              <span key={m} className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded capitalize">{m}</span>
            ))}
          </div>
        </div>

        {/* Target sectors */}
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Target Sectors</div>
          <div className="flex flex-wrap gap-1">
            {actor.targets.map((t) => (
              <span key={t} className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded capitalize">{t}</span>
            ))}
          </div>
        </div>

        {/* TTPs */}
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> MITRE ATT&CK TTPs
          </div>
          <div className="space-y-1.5">
            {actor.ttps.map((ttp) => (
              <a
                key={ttp.id}
                href={`https://attack.mitre.org/techniques/${ttp.id.replace('.', '/')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all group"
              >
                <div>
                  <span className="font-mono text-[10px] text-cyan-400">{ttp.id}</span>
                  <span className="text-[11px] text-slate-300 ml-2">{ttp.name}</span>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-400 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
