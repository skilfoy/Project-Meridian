'use client';
import { useState } from 'react';
import { THEATERS } from '@/lib/theaters';
import type { Theater } from '@/types';

const HOTSPOT_POSITIONS: Record<string, { x: number; y: number }> = {
  gcc:              { x: 62,  y: 42 },
  'eastern-europe': { x: 54,  y: 27 },
  'indo-pacific':   { x: 77,  y: 40 },
  sahel:            { x: 44,  y: 50 },
  levant:           { x: 56,  y: 38 },
  'horn-of-africa': { x: 58,  y: 52 },
  'south-asia':     { x: 69,  y: 38 },
  'latin-america':  { x: 27,  y: 52 },
};

const SEVERITY_COLORS: Record<string, string> = {
  gcc:              '#ef4444',
  'eastern-europe': '#ef4444',
  'indo-pacific':   '#f59e0b',
  sahel:            '#ef4444',
  levant:           '#ef4444',
  'horn-of-africa': '#f97316',
  'south-asia':     '#f59e0b',
  'latin-america':  '#f59e0b',
};

interface GlobeProps {
  onSelectTheater: (theater: Theater) => void;
  activeTheaterId: string;
}

export function Globe({ onSelectTheater, activeTheaterId }: GlobeProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative w-full h-full bg-[#0a0e1a] overflow-hidden select-none">
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 100 100" preserveAspectRatio="none">
        {Array.from({ length: 18 }, (_, i) => (
          <line key={`v${i}`} x1={i * 100/17} y1="0" x2={i * 100/17} y2="100" stroke="#06b6d4" strokeWidth="0.2" />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 100/8} x2="100" y2={i * 100/8} stroke="#06b6d4" strokeWidth="0.2" />
        ))}
      </svg>

      {/* Scan line animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="animate-scanline absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" style={{ top: '30%' }} />
      </div>

      {/* World map SVG (simplified flat projection) */}
      <svg
        viewBox="0 0 100 60"
        className="absolute inset-0 w-full h-full"
        style={{ padding: '5%' }}
      >
        {/* Simplified continent shapes */}
        {/* North America */}
        <path d="M10,10 L25,8 L30,15 L28,28 L20,32 L12,28 L8,20 Z" fill="#1a2235" stroke="#06b6d4" strokeWidth="0.15" opacity="0.8" />
        {/* South America */}
        <path d="M22,32 L30,30 L32,45 L26,52 L20,48 L19,38 Z" fill="#1a2235" stroke="#06b6d4" strokeWidth="0.15" opacity="0.8" />
        {/* Europe */}
        <path d="M44,10 L54,8 L56,16 L50,20 L44,18 Z" fill="#1a2235" stroke="#06b6d4" strokeWidth="0.15" opacity="0.8" />
        {/* Africa */}
        <path d="M44,20 L56,18 L58,24 L55,40 L50,48 L44,44 L40,30 Z" fill="#1a2235" stroke="#06b6d4" strokeWidth="0.15" opacity="0.8" />
        {/* Middle East */}
        <path d="M56,18 L66,16 L68,24 L62,28 L56,26 Z" fill="#1a2235" stroke="#06b6d4" strokeWidth="0.15" opacity="0.8" />
        {/* Russia/Central Asia */}
        <path d="M54,6 L88,4 L90,14 L70,18 L56,16 Z" fill="#1a2235" stroke="#06b6d4" strokeWidth="0.15" opacity="0.8" />
        {/* South/East Asia */}
        <path d="M68,14 L90,14 L92,30 L80,36 L70,32 L66,22 Z" fill="#1a2235" stroke="#06b6d4" strokeWidth="0.15" opacity="0.8" />
        {/* Australia */}
        <path d="M78,40 L88,38 L90,48 L82,52 L76,48 Z" fill="#1a2235" stroke="#06b6d4" strokeWidth="0.15" opacity="0.8" />
      </svg>

      {/* Theater hotspots */}
      {THEATERS.map((theater) => {
        const pos = HOTSPOT_POSITIONS[theater.id];
        if (!pos) return null;
        const color = SEVERITY_COLORS[theater.id] ?? '#f59e0b';
        const isActive  = activeTheaterId === theater.id;
        const isHovered = hovered === theater.id;

        return (
          <button
            key={theater.id}
            onClick={() => onSelectTheater(theater)}
            onMouseEnter={() => setHovered(theater.id)}
            onMouseLeave={() => setHovered(null)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            title={theater.name}
          >
            {/* Pulse ring */}
            {(isActive || isHovered) && (
              <span
                className="absolute inset-0 rounded-full animate-pulse-ring"
                style={{ backgroundColor: color, opacity: 0.4, width: 20, height: 20, margin: -4 }}
              />
            )}
            {/* Dot */}
            <span
              className="block rounded-full transition-all duration-200"
              style={{
                width:           isActive ? 14 : 10,
                height:          isActive ? 14 : 10,
                backgroundColor: color,
                boxShadow:       `0 0 ${isActive ? 12 : 6}px ${color}`,
                border:          isActive ? `2px solid white` : 'none',
              }}
            />
            {/* Label */}
            {(isActive || isHovered) && (
              <span className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tracking-wider text-white bg-black/70 px-2 py-0.5 rounded pointer-events-none">
                {theater.shortName}
              </span>
            )}
          </button>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 text-[9px] text-slate-500 space-y-0.5">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />CRITICAL</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />HIGH</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />MEDIUM</div>
      </div>
    </div>
  );
}
