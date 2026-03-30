'use client';
import dynamic from 'next/dynamic';
import type { Theater } from '@/types';

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
}: {
  onSelectTheater: (t: Theater) => void;
  activeTheaterId: string;
}) {
  return <GlobeInner onSelectTheater={onSelectTheater} activeTheaterId={activeTheaterId} />;
}
