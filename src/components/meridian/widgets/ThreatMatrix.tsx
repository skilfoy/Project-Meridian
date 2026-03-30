'use client';
import type { NormalizedIncident } from '@/types/feeds';

interface ThreatMatrixProps {
  incidents: NormalizedIncident[];
}

const CYBER_SOURCES   = new Set(['cisa-kev', 'nvd', 'urlhaus', 'threatfox', 'malwarebazaar', 'bleepingcomputer', 'hacker-news-cyber', 'sans-isc', 'securityweek', 'krebs-security', 'dark-reading', 'exploit-db', 'cisa-advisories', 'ncsc-uk', 'feodo-tracker', 'otx', 'abuseipdb']);
const CONFLICT_SOURCES = new Set(['reliefweb', 'gdelt', 'acled']);
const HUMANITARIAN_SOURCES = new Set(['gdacs', 'who-disease', 'usgs-earthquake', 'wmo-alerts', 'nasa-firms']);
const POLITICAL_SOURCES = new Set(['state-dept', 'un-sc-resolutions', 'nato-news', 'interpol-notices', 'defense-one', 'ncsc-uk']);
const ECONOMIC_SOURCES  = new Set(['opensanctions', 'world-bank', 'feodo-tracker']);

function countToLevel(n: number): number {
  if (n === 0)  return 1;
  if (n <= 2)   return 2;
  if (n <= 5)   return 3;
  if (n <= 10)  return 4;
  return 5;
}

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-blue-900/60 text-blue-400',
  2: 'bg-blue-800/60 text-blue-300',
  3: 'bg-amber-900/60 text-amber-400',
  4: 'bg-orange-900/60 text-orange-400',
  5: 'bg-red-900/60 text-red-400',
};

const LEVEL_LABELS = ['', 'LOW', 'GUARDED', 'ELEVATED', 'HIGH', 'CRITICAL'];

export function ThreatMatrix({ incidents }: ThreatMatrixProps) {
  const cyberCount      = incidents.filter((i) => CYBER_SOURCES.has(i.source)).length;
  const conflictCount   = incidents.filter((i) => CONFLICT_SOURCES.has(i.source) || i.domain === 'conflict').length;
  const humCount        = incidents.filter((i) => HUMANITARIAN_SOURCES.has(i.source) || i.domain === 'environmental').length;
  const politicalCount  = incidents.filter((i) => POLITICAL_SOURCES.has(i.source)).length;
  const economicCount   = incidents.filter((i) => ECONOMIC_SOURCES.has(i.source)).length;

  const rows: Array<{ label: string; level: number }> = [
    { label: 'Military',    level: countToLevel(conflictCount) },
    { label: 'Cyber',       level: countToLevel(cyberCount) },
    { label: 'Economic',    level: countToLevel(economicCount) },
    { label: 'Political',   level: countToLevel(politicalCount) },
    { label: 'Humanitarian',level: countToLevel(humCount) },
  ];

  return (
    <div className="space-y-2">
      {rows.map(({ label, level }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 w-24 shrink-0">{label}</span>
          <div className="flex gap-1 flex-1">
            {[1, 2, 3, 4, 5].map((l) => (
              <div
                key={l}
                className={`h-4 flex-1 rounded-sm transition-all ${l <= level ? LEVEL_COLORS[level] : 'bg-white/5'}`}
              />
            ))}
          </div>
          <span className={`text-[11px] font-bold w-16 text-right ${LEVEL_COLORS[level]?.split(' ')[1]}`}>
            {LEVEL_LABELS[level]}
          </span>
        </div>
      ))}
    </div>
  );
}
