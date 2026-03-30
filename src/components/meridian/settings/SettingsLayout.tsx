'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { SourcesTab }        from './SourcesTab';
import { AccountTab }        from './AccountTab';
import { SecurityTab }       from './SecurityTab';
import { NotificationsTab }  from './NotificationsTab';

type Tab = 'sources' | 'account' | 'security' | 'notifications';

const TABS: { id: Tab; label: string }[] = [
  { id: 'sources',       label: 'Sources' },
  { id: 'account',       label: 'Account' },
  { id: 'security',      label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
];

export function SettingsLayout() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const activeTab    = (searchParams.get('tab') as Tab) ?? 'sources';

  const setTab = (tab: Tab) => router.push(`/settings?tab=${tab}`);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] shrink-0">
        <h1 className="text-lg font-bold text-white mb-3">Settings</h1>
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'sources'       && <SourcesTab />}
        {activeTab === 'account'       && <AccountTab />}
        {activeTab === 'security'      && <SecurityTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
      </div>
    </div>
  );
}
