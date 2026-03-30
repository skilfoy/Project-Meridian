'use client';
import { useState, useEffect } from 'react';
import { THEATERS }  from '@/lib/theaters';
import { Button }    from '@/components/ui/Button';

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
const SEVERITIES: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

const SEV_COLORS: Record<Severity, string> = {
  CRITICAL: 'text-red-400',
  HIGH:     'text-orange-400',
  MEDIUM:   'text-amber-400',
  LOW:      'text-yellow-400',
  INFO:     'text-blue-400',
};

interface NotifConfig {
  webhookUrl?:       string;
  theaterThresholds: Record<string, Severity>;
  emailEnabled?:     boolean;
}

const DEFAULT_CONFIG: NotifConfig = {
  webhookUrl:        '',
  theaterThresholds: {},
  emailEnabled:      false,
};

export function NotificationsTab() {
  const [config,   setConfig]   = useState<NotifConfig>(DEFAULT_CONFIG);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    fetch('/api/settings/notifications')
      .then((r) => r.json())
      .then((d: { config?: NotifConfig }) => setConfig({ ...DEFAULT_CONFIG, ...(d.config ?? {}) }))
      .catch(() => {});
  }, []);

  const setThreshold = (theaterId: string, sev: Severity) =>
    setConfig((p) => ({ ...p, theaterThresholds: { ...p.theaterThresholds, [theaterId]: sev } }));

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings/notifications', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(config),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-xl space-y-6">
      {/* Webhook */}
      <section>
        <h2 className="text-[11px] text-slate-500 uppercase tracking-widest mb-3">Webhook (Slack / Discord)</h2>
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-4">
          <label className="block text-[11px] text-slate-500 mb-1">Webhook URL</label>
          <input
            className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-1.5 text-[12px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
            placeholder="https://hooks.slack.com/…"
            value={config.webhookUrl ?? ''}
            onChange={(e) => setConfig((p) => ({ ...p, webhookUrl: e.target.value }))}
          />
        </div>
      </section>

      {/* Per-theater thresholds */}
      <section>
        <h2 className="text-[11px] text-slate-500 uppercase tracking-widest mb-3">Alert Thresholds by Theater</h2>
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl divide-y divide-white/[0.04]">
          {THEATERS.map((theater) => {
            const current = config.theaterThresholds[theater.id] ?? 'HIGH';
            return (
              <div key={theater.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: theater.color }} />
                  <span className="text-[12px] text-slate-300">{theater.shortName}</span>
                </div>
                <div className="flex items-center gap-1">
                  {SEVERITIES.map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setThreshold(theater.id, sev)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                        current === sev
                          ? `${SEV_COLORS[sev]} bg-white/5 border border-white/10`
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      {sev[0]}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-600 mt-1.5">Alerts fire for the selected severity and above</p>
      </section>

      <Button variant="primary" size="sm" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Notification Settings'}
      </Button>
    </div>
  );
}
