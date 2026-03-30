'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Eye, EyeOff, ExternalLink, RefreshCw, CheckCircle, XCircle,
  Clock, Key, Wifi, Search, Plus, Trash2, Globe,
} from 'lucide-react';
import { FEED_REGISTRY }          from '@/lib/feeds/registry';
import { Badge }                   from '@/components/ui/Badge';
import { Toggle }                  from '@/components/ui/Toggle';
import { Button }                  from '@/components/ui/Button';
import { AddCustomSourceModal }    from './AddCustomSourceModal';
import type { FeedCategory, FeedTier } from '@/types/feeds';

const ALL_CATEGORIES: FeedCategory[] = [
  'conflict', 'government', 'cyber', 'news', 'maritime', 'aviation', 'environmental', 'sanctions',
];

const TIER_BADGE_MAP: Record<FeedTier, 'free' | 'key' | 'paid'> = {
  FREE:         'free',
  KEY_REQUIRED: 'key',
  PAID:         'paid',
};

interface FeedState {
  enabled:    boolean;
  apiKey:     string;
  showKey:    boolean;
  testing:    boolean;
  testResult: 'ok' | 'error' | null;
  lastError?: string;
}

interface CustomSource {
  id:          string;
  name:        string;
  description: string | null;
  type:        string;
  url:         string;
  authType:    string | null;
  enabled:     boolean;
  lastError:   string | null;
}

type SortKey = 'name' | 'category' | 'tier' | 'status';

export function SourcesTab() {
  const [states, setStates] = useState<Record<string, FeedState>>(() =>
    Object.fromEntries(
      FEED_REGISTRY.map((f) => [f.id, { enabled: f.defaultEnabled, apiKey: '', showKey: false, testing: false, testResult: null }])
    )
  );
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState<FeedCategory | 'all'>('all');
  const [tierFilter,   setTierFilter]   = useState<FeedTier | 'all'>('all');
  const [sortKey,      setSortKey]      = useState<SortKey>('category');
  const [showModal,    setShowModal]    = useState(false);
  const [customSources, setCustomSources] = useState<CustomSource[]>([]);

  useEffect(() => {
    fetch('/api/custom-sources')
      .then((r) => r.json())
      .then((d: { sources?: CustomSource[] }) => setCustomSources(d.sources ?? []))
      .catch(() => {});
  }, []);

  const refreshCustomSources = () => {
    fetch('/api/custom-sources')
      .then((r) => r.json())
      .then((d: { sources?: CustomSource[] }) => setCustomSources(d.sources ?? []))
      .catch(() => {});
  };

  const updateState = (feedId: string, patch: Partial<FeedState>) =>
    setStates((prev) => ({ ...prev, [feedId]: { ...prev[feedId], ...patch } }));

  const testFeed = async (feedId: string) => {
    updateState(feedId, { testing: true, testResult: null });
    try {
      const res = await fetch(`/api/feeds/${feedId}?limit=1`);
      updateState(feedId, {
        testing:    false,
        testResult: res.ok ? 'ok' : 'error',
        lastError:  res.ok ? undefined : `HTTP ${res.status}`,
      });
    } catch (e) {
      updateState(feedId, { testing: false, testResult: 'error', lastError: String(e) });
    }
  };

  const saveKey = async (feedId: string, key: string) => {
    await fetch('/api/keys', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ provider: feedId, label: feedId, key }),
    });
  };

  const enableAllFree = () => {
    setStates((prev) => {
      const next = { ...prev };
      FEED_REGISTRY.filter((f) => f.tier === 'FREE').forEach((f) => {
        next[f.id] = { ...next[f.id], enabled: true };
      });
      return next;
    });
  };

  const deleteCustomSource = async (id: string) => {
    await fetch(`/api/custom-sources/${id}`, { method: 'DELETE' });
    refreshCustomSources();
  };

  const filtered = useMemo(() => {
    let feeds = [...FEED_REGISTRY];
    if (search)               feeds = feeds.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase()));
    if (catFilter  !== 'all') feeds = feeds.filter((f) => f.category === catFilter);
    if (tierFilter !== 'all') feeds = feeds.filter((f) => f.tier     === tierFilter);
    feeds.sort((a, b) => {
      if (sortKey === 'name')     return a.name.localeCompare(b.name);
      if (sortKey === 'category') return a.category.localeCompare(b.category);
      if (sortKey === 'tier')     return a.tier.localeCompare(b.tier);
      if (sortKey === 'status') {
        const sa = states[a.id]?.testResult ?? 'z';
        const sb = states[b.id]?.testResult ?? 'z';
        return sa.localeCompare(sb);
      }
      return 0;
    });
    return feeds;
  }, [search, catFilter, tierFilter, sortKey, states]);

  const totalEnabled = Object.values(states).filter((s) => s.enabled).length;
  const totalLive    = Object.values(states).filter((s) => s.testResult === 'ok').length;

  return (
    <div className="p-6 space-y-6">
      {/* Stats + bulk action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-[12px] text-slate-500">
          <span><span className="text-emerald-400 font-bold">{totalEnabled}</span> enabled</span>
          <span><span className="text-cyan-400 font-bold">{totalLive}</span> verified live</span>
          <span className="text-slate-600">{FEED_REGISTRY.length} feeds · {customSources.length} custom</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={enableAllFree}>Enable all free feeds</Button>
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Source
          </Button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            className="bg-black/30 border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 w-52"
            placeholder="Search feeds…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value as FeedCategory | 'all')}
          className="bg-black/30 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[12px] text-slate-400 focus:outline-none"
        >
          <option value="all">All categories</option>
          {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as FeedTier | 'all')}
          className="bg-black/30 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[12px] text-slate-400 focus:outline-none"
        >
          <option value="all">All tiers</option>
          <option value="FREE">Free</option>
          <option value="KEY_REQUIRED">Key required</option>
          <option value="PAID">Paid</option>
        </select>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="bg-black/30 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[12px] text-slate-400 focus:outline-none"
        >
          <option value="category">Sort: Category</option>
          <option value="name">Sort: Name A-Z</option>
          <option value="tier">Sort: Tier</option>
          <option value="status">Sort: Status</option>
        </select>
      </div>

      {/* Feed cards grid */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {filtered.map((feed) => {
          const st = states[feed.id];
          if (!st) return null;
          return (
            <div key={feed.id} className={`bg-[#111827] border rounded-xl p-4 transition-all ${st.enabled ? 'border-white/[0.08]' : 'border-white/[0.03] opacity-60'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[13px] text-white truncate">{feed.name}</span>
                    {st.testResult === 'ok'    && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    {st.testResult === 'error' && <XCircle     className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant={TIER_BADGE_MAP[feed.tier]}>{feed.tier === 'KEY_REQUIRED' ? 'KEY' : feed.tier}</Badge>
                    <Badge variant={feed.category as 'cyber'} className="capitalize">{feed.category}</Badge>
                    <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {feed.refreshIntervalSec < 60 ? `${feed.refreshIntervalSec}s` : `${feed.refreshIntervalSec / 60}m`}
                    </span>
                  </div>
                </div>
                <Toggle checked={st.enabled} onChange={(v) => updateState(feed.id, { enabled: v })} />
              </div>
              <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">{feed.description}</p>
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
                    <button onClick={() => updateState(feed.id, { showKey: !st.showKey })} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                      {st.showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => testFeed(feed.id)} disabled={st.testing} className="flex-1 justify-center">
                  {st.testing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
                  {st.testing ? 'Testing…' : 'Test'}
                </Button>
                <a href={feed.docsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/[0.08] text-slate-500 hover:text-slate-300 text-[11px] transition-colors">
                  <ExternalLink className="w-3 h-3" /> Docs
                </a>
              </div>
              {st.lastError && <div className="mt-2 text-[10px] text-red-400 bg-red-900/10 rounded p-1.5">{st.lastError}</div>}
            </div>
          );
        })}
      </div>

      {/* Custom Sources */}
      {customSources.length > 0 && (
        <div>
          <h2 className="text-[11px] text-slate-500 uppercase tracking-widest mb-3">Custom Sources</h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {customSources.map((cs) => (
              <div key={cs.id} className="bg-[#111827] border border-white/[0.08] rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="font-semibold text-[13px] text-white truncate">{cs.name}</span>
                    </div>
                    <Badge variant="free">{cs.type}</Badge>
                    {cs.description && <p className="text-[11px] text-slate-500 mt-1.5">{cs.description}</p>}
                    {cs.lastError && <p className="text-[10px] text-red-400 mt-1.5">{cs.lastError}</p>}
                  </div>
                  <button onClick={() => deleteCustomSource(cs.id)} className="text-slate-600 hover:text-red-400 transition-colors shrink-0 mt-0.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <AddCustomSourceModal
          onClose={() => setShowModal(false)}
          onCreated={refreshCustomSources}
        />
      )}
    </div>
  );
}
