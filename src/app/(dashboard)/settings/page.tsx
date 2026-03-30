import { Suspense } from 'react';
import { SettingsLayout } from '@/components/meridian/settings/SettingsLayout';

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-slate-600 text-sm">Loading…</div>}>
      <SettingsLayout />
    </Suspense>
  );
}
