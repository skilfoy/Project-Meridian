'use client';
import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function AddCustomSourceModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    name:        '',
    description: '',
    type:        'RSS' as 'RSS' | 'REST_API' | 'WEB_URL',
    url:         '',
    authType:    'none',
    credentials: '',
    refreshInterval: 3600,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const update = (k: keyof typeof form, v: string | number) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.url) {
      setError('Name and URL are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/custom-sources', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...form,
          credentials: form.credentials || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111827] border border-white/[0.08] rounded-2xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">Add Custom Source</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Name *">
            <input className={inputCls} placeholder="My Intelligence Feed" value={form.name} onChange={(e) => update('name', e.target.value)} />
          </Field>
          <Field label="Description">
            <input className={inputCls} placeholder="Optional description" value={form.description} onChange={(e) => update('description', e.target.value)} />
          </Field>
          <Field label="Type">
            <select className={inputCls} value={form.type} onChange={(e) => update('type', e.target.value as 'RSS' | 'REST_API' | 'WEB_URL')}>
              <option value="RSS">RSS Feed</option>
              <option value="REST_API">REST API</option>
              <option value="WEB_URL">Web URL</option>
            </select>
          </Field>
          <Field label="URL *">
            <input className={inputCls} placeholder="https://..." value={form.url} onChange={(e) => update('url', e.target.value)} />
          </Field>
          <Field label="Auth Type">
            <select className={inputCls} value={form.authType} onChange={(e) => update('authType', e.target.value)}>
              <option value="none">None</option>
              <option value="bearer">Bearer Token</option>
              <option value="apikey">API Key Header</option>
              <option value="basic">Basic Auth</option>
            </select>
          </Field>
          {form.authType !== 'none' && (
            <Field label="Credentials">
              <input
                type="password"
                className={inputCls}
                placeholder={form.authType === 'basic' ? 'user:password' : 'Token / API Key'}
                value={form.credentials}
                onChange={(e) => update('credentials', e.target.value)}
              />
            </Field>
          )}
          <Field label="Refresh interval (seconds)">
            <input
              type="number"
              className={inputCls}
              min={60}
              value={form.refreshInterval}
              onChange={(e) => update('refreshInterval', parseInt(e.target.value, 10))}
            />
          </Field>
        </div>

        {error && <p className="mt-3 text-[11px] text-red-400 bg-red-900/10 rounded p-2">{error}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={submit} disabled={saving}>
            <Plus className="w-3.5 h-3.5" />
            {saving ? 'Saving…' : 'Add Source'}
          </Button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-1.5 text-[12px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
