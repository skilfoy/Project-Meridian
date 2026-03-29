'use client';
import { useState } from 'react';
import { Globe }     from '@/components/meridian/Globe';
import { Dashboard } from '@/components/meridian/Dashboard';
import { useTheater } from '@/hooks/useTheater';
import type { Theater } from '@/types';

export default function GlobePage() {
  const { activeTheater, setActiveTheaterId } = useTheater();
  const [showPanel, setShowPanel] = useState(true);

  const handleSelect = (theater: Theater) => {
    setActiveTheaterId(theater.id);
    setShowPanel(true);
  };

  return (
    <div className="flex h-full">
      {/* Globe — takes remaining space */}
      <div className={`relative transition-all duration-300 ${showPanel ? 'w-1/2' : 'flex-1'}`}>
        <Globe onSelectTheater={handleSelect} activeTheaterId={activeTheater.id} />
        <div className="absolute top-4 left-4 text-[10px] text-slate-600 uppercase tracking-widest font-mono">
          MERIDIAN / GLOBE VIEW
        </div>
      </div>

      {/* Side panel */}
      {showPanel && (
        <div className="w-1/2 border-l border-white/[0.06] overflow-hidden">
          <Dashboard theater={activeTheater} />
        </div>
      )}
    </div>
  );
}
