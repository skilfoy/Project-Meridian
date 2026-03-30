'use client';
import dynamic from 'next/dynamic';
import type { Theater } from '@/types';

export interface IncidentPin {
  id:         string;
  lat:        number;
  lng:        number;
  title:      string;
  type:       'earthquake' | 'disaster';
  occurredAt: string;
}

const GlobeInner = dynamic(() => import('./GlobeInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0a0e1a] flex items-center justify-center">
      <div className="text-[#06b6d4] text-sm animate-pulse font-mono tracking-widest">
        LOADING MAP...
      </div>
    </div>
  ),
});

export function Globe({
  onSelectTheater,
  activeTheaterId,
  incidentPins,
}: {
  onSelectTheater:  (t: Theater) => void;
  activeTheaterId:  string;
  incidentPins?:    IncidentPin[];
}) {
  return (
    <GlobeInner
      onSelectTheater={onSelectTheater}
      activeTheaterId={activeTheaterId}
      incidentPins={incidentPins}
    />
  );
}
