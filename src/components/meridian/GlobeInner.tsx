'use client';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { THEATERS } from '@/lib/theaters';
import type { Theater } from '@/types';

function FlyToActive({ theaterId }: { theaterId: string }) {
  const map = useMap();
  useEffect(() => {
    const theater = THEATERS.find((t) => t.id === theaterId);
    if (theater) {
      map.flyTo([theater.lat, theater.lng], theater.zoom, { duration: 1.2 });
    }
  }, [theaterId, map]);
  return null;
}

interface Props {
  onSelectTheater: (t: Theater) => void;
  activeTheaterId: string;
}

export default function GlobeInner({ onSelectTheater, activeTheaterId }: Props) {
  const activeTheater = THEATERS.find((t) => t.id === activeTheaterId);

  return (
    <MapContainer
      center={[20, 10]}
      zoom={2}
      minZoom={2}
      maxZoom={8}
      className="w-full h-full"
      zoomControl={false}
      attributionControl={true}
      style={{ background: '#0a0e1a' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
      />

      <FlyToActive theaterId={activeTheaterId} />

      {THEATERS.map((theater) => {
        const isActive = theater.id === activeTheaterId;
        return (
          <CircleMarker
            key={theater.id}
            center={[theater.lat, theater.lng]}
            radius={isActive ? 14 : 8}
            pathOptions={{
              color: isActive ? '#ffffff' : theater.color,
              fillColor: theater.color,
              fillOpacity: isActive ? 0.9 : 0.7,
              weight: isActive ? 2.5 : 1.5,
            }}
            eventHandlers={{
              click: () => onSelectTheater(theater),
            }}
          >
            <Popup>
              <div className="p-1">
                <div className="font-bold text-sm mb-1">{theater.name}</div>
                <div className="text-xs text-gray-400 mb-2">{theater.description}</div>
                <button
                  onClick={() => onSelectTheater(theater)}
                  className="text-xs px-2 py-1 rounded"
                  style={{ background: theater.color, color: '#fff' }}
                >
                  View Dashboard
                </button>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
