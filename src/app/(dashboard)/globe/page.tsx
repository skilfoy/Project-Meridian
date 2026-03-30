'use client';
import { useState, useMemo } from 'react';
import { Globe }     from '@/components/meridian/Globe';
import { Dashboard } from '@/components/meridian/Dashboard';
import { useTheater } from '@/hooks/useTheater';
import { useFeed }    from '@/hooks/useFeeds';
import type { Theater } from '@/types';
import type { IncidentPin } from '@/components/meridian/Globe';

export default function GlobePage() {
  const { activeTheater, setActiveTheaterId } = useTheater();
  const [showPanel, setShowPanel] = useState(true);

  const { data: usgsData }  = useFeed('usgs-earthquake');
  const { data: gdacsData } = useFeed('gdacs');

  const incidentPins = useMemo<IncidentPin[]>(() => {
    const pins: IncidentPin[] = [];

    for (const inc of (usgsData?.incidents ?? [])) {
      if (inc.lat != null && inc.lng != null) {
        pins.push({ id: inc.id, lat: inc.lat, lng: inc.lng, title: inc.title, type: 'earthquake', occurredAt: inc.occurredAt });
      }
    }

    for (const inc of (gdacsData?.incidents ?? [])) {
      if (inc.lat != null && inc.lng != null) {
        pins.push({ id: inc.id, lat: inc.lat, lng: inc.lng, title: inc.title, type: 'disaster', occurredAt: inc.occurredAt });
      }
    }

    return pins;
  }, [usgsData, gdacsData]);

  const handleSelect = (theater: Theater) => {
    setActiveTheaterId(theater.id);
    setShowPanel(true);
  };

  return (
    <div className="flex h-full">
      {/* Globe — takes remaining space */}
      <div className={`relative transition-all duration-300 ${showPanel ? 'w-1/2' : 'flex-1'}`}>
        <Globe
          onSelectTheater={handleSelect}
          activeTheaterId={activeTheater.id}
          incidentPins={incidentPins}
        />
        <div className="absolute top-4 left-4 text-[10px] text-slate-600 uppercase tracking-widest font-mono">
          MERIDIAN / GLOBE VIEW
        </div>
        {incidentPins.length > 0 && (
          <div className="absolute bottom-4 left-4 flex items-center gap-3 text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Earthquakes
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Disasters
            </span>
          </div>
        )}
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
