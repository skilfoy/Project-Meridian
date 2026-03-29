'use client';

interface ThreatMatrixProps {
  theaterId: string;
}

const DOMAINS = ['Military', 'Cyber', 'Economic', 'Political', 'Humanitarian'];
const LEVELS  = [1, 2, 3, 4, 5];

// Seed-based pseudorandom for consistent display per theater
function seededRandom(seed: string, index: number): number {
  const hash = seed.split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), index * 17);
  return ((hash * 2654435761) >>> 0) % 5 + 1;
}

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-blue-900/60 text-blue-400',
  2: 'bg-blue-800/60 text-blue-300',
  3: 'bg-amber-900/60 text-amber-400',
  4: 'bg-orange-900/60 text-orange-400',
  5: 'bg-red-900/60 text-red-400',
};

export function ThreatMatrix({ theaterId }: ThreatMatrixProps) {
  return (
    <div className="space-y-2">
      {DOMAINS.map((domain, di) => {
        const level = seededRandom(theaterId, di);
        return (
          <div key={domain} className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 w-24 shrink-0">{domain}</span>
            <div className="flex gap-1 flex-1">
              {LEVELS.map((l) => (
                <div
                  key={l}
                  className={`h-4 flex-1 rounded-sm transition-all ${l <= level ? LEVEL_COLORS[level] : 'bg-white/5'}`}
                />
              ))}
            </div>
            <span className={`text-[11px] font-bold w-12 text-right ${LEVEL_COLORS[level]?.split(' ')[1]}`}>
              {['', 'LOW', 'GUARDED', 'ELEVATED', 'HIGH', 'CRITICAL'][level]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
