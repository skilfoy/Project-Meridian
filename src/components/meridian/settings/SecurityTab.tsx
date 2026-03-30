'use client';
import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

interface AuditEntry {
  id:        string;
  action:    string;
  resource:  string | null;
  ip:        string | null;
  createdAt: string;
}

export function SecurityTab() {
  const [logs,    setLogs]    = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit?limit=50')
      .then((r) => r.json())
      .then((d: { logs?: AuditEntry[] }) => setLogs(d.logs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <section>
        <h2 className="text-[11px] text-slate-500 uppercase tracking-widest mb-3">API Key Usage Log</h2>
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-slate-600 text-[12px]">Loading audit log…</div>
          ) : logs.length === 0 ? (
            <div className="p-6 flex flex-col items-center gap-2 text-slate-600">
              <Shield className="w-8 h-8 opacity-30" />
              <p className="text-[12px]">No audit events yet</p>
            </div>
          ) : (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-500 text-left">
                  <th className="px-4 py-2 font-medium">Time</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                  <th className="px-4 py-2 font-medium">Resource</th>
                  <th className="px-4 py-2 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-4 py-2 text-slate-500 font-mono whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-slate-300">{log.action}</td>
                    <td className="px-4 py-2 text-slate-500">{log.resource ?? '—'}</td>
                    <td className="px-4 py-2 text-slate-600 font-mono">{log.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
