'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';

type TLP = 'WHITE' | 'GREEN' | 'AMBER' | 'RED';

interface OrgData {
  id:         string;
  name:       string;
  slug:       string;
  plan:       string;
  tlpDefault: TLP;
  createdAt:  string;
}

const TLP_COLORS: Record<TLP, string> = {
  WHITE: 'bg-white/10 text-white border-white/20',
  GREEN: 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30',
  AMBER: 'bg-amber-900/30 text-amber-400 border-amber-500/30',
  RED:   'bg-red-900/30 text-red-400 border-red-500/30',
};

export function AccountTab() {
  const { user }         = useUser();
  const [org,      setOrg]      = useState<OrgData | null>(null);
  const [orgName,  setOrgName]  = useState('');
  const [tlp,      setTlp]      = useState<TLP>('AMBER');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    fetch('/api/settings/account')
      .then((r) => r.json())
      .then((d: { org?: OrgData }) => {
        if (d.org) {
          setOrg(d.org);
          setOrgName(d.org.name);
          setTlp(d.org.tlpDefault);
        }
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings/account', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: orgName, tlpDefault: tlp }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-xl space-y-6">
      {/* User info */}
      <section>
        <h2 className="text-[11px] text-slate-500 uppercase tracking-widest mb-3">User</h2>
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-4 space-y-2">
          <Row label="Name"  value={user?.fullName  ?? '—'} />
          <Row label="Email" value={user?.primaryEmailAddress?.emailAddress ?? '—'} />
          <Row label="Role"  value="Analyst" />
        </div>
      </section>

      {/* Org info */}
      <section>
        <h2 className="text-[11px] text-slate-500 uppercase tracking-widest mb-3">Organization</h2>
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-4 space-y-4">
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Organization name</label>
            <input
              className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-1.5 text-[12px] text-slate-300 focus:outline-none focus:border-cyan-500/50"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>
          <Row label="Slug" value={org?.slug ?? '—'} />
          <Row label="Plan" value={org?.plan ?? '—'} />
          <div>
            <label className="block text-[11px] text-slate-500 mb-2">Default TLP Classification</label>
            <div className="flex gap-2">
              {(['WHITE', 'GREEN', 'AMBER', 'RED'] as TLP[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTlp(t)}
                  className={`px-3 py-1 rounded border text-[11px] font-medium transition-all ${TLP_COLORS[t]} ${tlp === t ? 'ring-1 ring-offset-1 ring-offset-[#111827]' : 'opacity-50'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300">{value}</span>
    </div>
  );
}
