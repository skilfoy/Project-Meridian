'use client';
import { AlertTriangle, Shield, Radio, Activity } from 'lucide-react';

interface KPIProps {
  threatLevel: string;
  activeIncidents: number;
  feedsOnline: number;
  lastUpdated: string;
}

export function KPIStrip({ threatLevel, activeIncidents, feedsOnline, lastUpdated }: KPIProps) {
  const levelColor =
    threatLevel === 'CRITICAL' ? 'text-red-400' :
    threatLevel === 'HIGH'     ? 'text-orange-400' :
    threatLevel === 'MEDIUM'   ? 'text-amber-400' : 'text-blue-400';

  return (
    <div className="grid grid-cols-4 gap-3">
      {[
        { icon: AlertTriangle, label: 'Threat Level', value: threatLevel, valueClass: levelColor },
        { icon: Shield,        label: 'Active Incidents', value: String(activeIncidents), valueClass: 'text-orange-400' },
        { icon: Radio,         label: 'Feeds Online', value: String(feedsOnline), valueClass: 'text-emerald-400' },
        { icon: Activity,      label: 'Last Updated', value: lastUpdated, valueClass: 'text-cyan-400' },
      ].map(({ icon: Icon, label, value, valueClass }) => (
        <div key={label} className="bg-[#111827] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3">
          <Icon className="w-5 h-5 text-slate-500 shrink-0" strokeWidth={1.5} />
          <div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</div>
            <div className={`font-bold text-sm ${valueClass}`}>{value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
