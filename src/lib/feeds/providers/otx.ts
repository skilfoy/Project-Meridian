import type { FeedParams, RawFeedResult } from '@/types/feeds';

interface OtxPulse {
  id?:               string;
  name?:             string;
  description?:      string;
  tags?:             string[];
  modified?:         string;
  indicators_count?: number;
  tlp?:              string;
}

interface OtxResponse {
  results?: OtxPulse[];
}

export async function fetchOtx(params: FeedParams, apiKey?: string): Promise<RawFeedResult> {
  if (!apiKey) throw new Error('OTX API key required');
  const start = Date.now();
  const limit = Math.min(params.limit ?? 20, 50);

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  const url = `https://otx.alienvault.com/api/v1/pulses/subscribed?limit=${limit}&modified_since=${sevenDaysAgo}`;

  const res = await fetch(url, {
    headers: { 'X-OTX-API-KEY': apiKey },
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`OTX API HTTP ${res.status}`);

  const data = await res.json() as OtxResponse;
  const pulses = data.results ?? [];

  const items = pulses.map((pulse) => ({
    id:          pulse.id,
    title:       pulse.name ?? 'OTX Pulse',
    summary:     pulse.description?.slice(0, 300),
    url:         pulse.id ? `https://otx.alienvault.com/pulse/${pulse.id}` : undefined,
    publishedAt: pulse.modified ? new Date(pulse.modified).toISOString() : undefined,
    tags:        ['otx', 'threat-intel', ...(pulse.tags ?? [])],
  }));

  return {
    items,
    meta: { source: 'otx', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length },
  };
}
