'use client';
import { Dashboard } from '@/components/meridian/Dashboard';
import { useTheater } from '@/hooks/useTheater';
import { THEATERS }   from '@/lib/theaters';

export default function DashboardPage() {
  const { activeTheater, setActiveTheaterId } = useTheater();

  return (
    <div className="flex flex-col h-full">
      {/* Theater selector */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] overflow-x-auto shrink-0">
        {THEATERS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTheaterId(t.id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wider transition-all whitespace-nowrap ${
              activeTheater.id === t.id
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
            }`}
          >
            {t.shortName}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        <Dashboard theater={activeTheater} />
      </div>
    </div>
  );
}
