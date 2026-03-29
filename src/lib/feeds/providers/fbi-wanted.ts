import type { FeedParams, RawFeedResult } from '@/types/feeds';

export async function fetchFbiWanted(params: FeedParams): Promise<RawFeedResult> {
  const start = Date.now();
  const limit = Math.min(params.limit ?? 20, 50);
  const url = `https://api.fbi.gov/wanted/v1/list?pageSize=${limit}&page=1`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`FBI Wanted HTTP ${res.status}`);

  const data = await res.json() as {
    items?: Array<{
      uid?: string; title?: string; description?: string; publication?: string;
      url?: string; subjects?: string[]; field_offices?: string[];
      reward_text?: string;
    }>;
  };

  const items = (data.items ?? []).map((w) => ({
    id:          w.uid,
    title:       w.title ?? 'Unknown',
    summary:     w.description?.slice(0, 200) ?? w.reward_text,
    url:         w.url,
    publishedAt: w.publication,
    severity:    'HIGH' as const,
    tags:        ['fbi', 'wanted', ...(w.subjects ?? []), ...(w.field_offices ?? [])].filter(Boolean),
  }));

  return { items, meta: { source: 'fbi-wanted', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length } };
}
