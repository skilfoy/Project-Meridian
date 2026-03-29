'use client';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, ExternalLink, RefreshCw, CheckCircle, XCircle, Clock, Key, Wifi } from 'lucide-react';
import { FEED_REGISTRY } from '@/lib/feeds/registry';
import { Badge }   from '@/components/ui/Badge';
import { Toggle }  from '@/components/ui/Toggle';
import { Button }  from '@/components/ui/Button';
import type { FeedCategory, FeedTier } from '@/types/feeds';

const CATEGORY_ORDER: FeedCategory[] = ['conflict', 'government', 'cyber', 'news', 'maritime', 'aviation', 'environmental'];

interface FeedState {
  enabled:    boolean;
  apiKey:     string;
  showKey:    boolean;
  testing:    boolean;
  testResult: 'ok' | 'error' | null;
  lastError?: string;
}

type FeedStates = Record<string, FeedState>;

const TIER_BADGE_MAP: Record<FeedTier, 'free' | 'key' | 'paid'> = {
  FREE:         'free',
  KEY_REQUIRED: 'key',
  PAID:         'paid',
};

export function FeedsPage() {
  const [states, setStates] = useState<FeedStates>(() =>
    Object.fromEntries(
      FEED_REGISTRY.map((f) => [f.id, { enabled: f.defaultEnabled, apiKey: '', showKey: false, testing: false, testResult: null }])
    )
  );
  const [filter, setFilter] = useState<FeedCategory | 'all'>('all');

  const updateState = (feedId: string, patch: Partial<FeedState>) =>
    setStates((prev) => ({ ...prev, [feedId]: { ...prev[feedId], ...patch } }));

  const testFeed = async (feedId: string) => {
    updateState(feedId, { testing: true, testResult: null });
    try {
      const params = new URLSearchParams({ limit: '1' });
      const res = await fetch(`/api/feeds/${feedId}?${params}`);
      updateState(feedId, { testing: false, testResult: res.ok ? 'ok' : 'error', lastError: res.ok ? undefined : `HTTP ${res.status}` });
    } catch (e) {
      updateState(feedId, { testing: false, testResult: 'error', lastError: String(e) });
    }
  };

  const saveKey = async (feedId: string, key: string) => {
    await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: feedId, label: feedId, key }),
    });
  };

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    feeds: FEED_REGISTRY.filter((f) => f.category === cat && (filter === 'all' || f.category === filter)),
  })).filter((g) => g.feeds.length > 0);

  const totalEnabled = Object.values(states).filter((s) => s.enabled).length;
  const totalLive    = Object.values(states).filter((s) => s.testResult === 'ok').length;

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-bold text-white">API Feed Management</h1>
          <div className="flex items-center gap-4 text-[12px] text-slate-500">
            <span><span className="text-emerald-400 font-bold">{totalEnabled}</span> enabled</span>
            <span><span className="text-cyan-400 font-bold">{totalLive}</span> verified live</span>
            <span className="text-slate-600">{FEED_REGISTRY.length} total feeds</span>
          </div>
        </div>
        <p className="text-slate-500 text-xs">Configure API keys, enable/disable feeds, and test connections</p>

        {/* Category filter */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
          {(['all', ...CATEGORY_ORDER] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap capitalize ${
                filter === cat ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-white/10'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feed cards */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {grouped.map(({ category, feeds }) => (
          <div key={category}>
            <div className="text-[11px] text-slate-500 uppercase tracking-widest mb-3 capitalize">{category}</div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {feeds.map((feed) => {
                const st = states[feed.id];
                if (!st) return null;

                return (
                  <div key={feed.id} className={`bg-[#111827] border rounded-xl p-4 transition-all ${st.enabled ? 'border-white/[0.08]' : 'border-white/[0.03] opacity-60'}`}>
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-[13px] text-white">{feed.name}</span>
                          {st.testResult === 'ok'    && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          {st.testResult === 'error' && <XCircle    className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant={TIER_BADGE_MAP[feed.tier]}>{feed.tier === 'KEY_REQUIRED' ? 'KEY' : feed.tier}</Badge>
                          <Badge variant={feed.category as 'cyber' | 'conflict' | 'news' | 'maritime' | 'government' | 'environmental' | 'aviation'} className="capitalize">{feed.category}</Badge>
                          <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {feed.refreshIntervalSec < 60 ? `${feed.refreshIntervalSec}s` : `${feed.refreshIntervalSec / 60}m`}
                          </span>
                        </div>
                      </div>
                      <Toggle checked={st.enabled} onChange={(v) => updateState(feed.id, { enabled: v })} />
                    </div>

                    <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">{feed.description}</p>

                    {/* API key input */}
                    {feed.requiresKey && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="relative flex-1">
                          <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
                          <input
                            type={st.showKey ? 'text' : 'password'}
                            placeholder="Enter API key…"
                            value={st.apiKey}
                            onChange={(e) => updateState(feed.id, { apiKey: e.target.value })}
                            onBlur={() => st.apiKey && saveKey(feed.id, st.apiKey)}
                            className="w-full bg-black/30 border border-white/[0.08] rounded-lg pl-8 pr-8 py-1.5 text-[12px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                          />
                          <button
                            onClick={() => updateState(feed.id, { showKey: !st.showKey })}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                          >
                            {st.showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => testFeed(feed.id)}
                        disabled={st.testing}
                        className="flex-1 justify-center"
                      >
                        {st.testing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
                        {st.testing ? 'Testing…' : 'Test'}
                      </Button>
                      <a
                        href={feed.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/[0.08] text-slate-500 hover:text-slate-300 text-[11px] transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Docs
                      </a>
                    </div>

                    {st.lastError && (
                      <div className="mt-2 text-[10px] text-red-400 bg-red-900/10 rounded p-1.5">{st.lastError}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
