import type { FeedParams, RawFeedResult } from '@/types/feeds';

export async function fetchOpenSanctions(params: FeedParams): Promise<RawFeedResult> {
  const start = Date.now();
  const limit = Math.min(params.limit ?? 20, 20);
  const query = params.filters?.q ?? 'sanctioned';

  const url = `https://api.opensanctions.org/search/default?q=${encodeURIComponent(query as string)}&schema=Person&limit=${limit}`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`OpenSanctions HTTP ${res.status}`);

  const data = await res.json() as {
    results?: Array<{
      id?: string;
      caption?: string;
      properties?: { birthDate?: string[]; nationality?: string[]; topics?: string[] };
    }>;
  };

  const items = (data.results ?? []).map((r) => ({
    title:       r.caption ?? 'Sanctioned Entity',
    url:         `https://www.opensanctions.org/entities/${r.id ?? ''}`,
    publishedAt: undefined,
    tags:        [
      'opensanctions', 'sanctions',
      ...(r.properties?.nationality ?? []),
      ...(r.properties?.topics ?? []),
    ].filter(Boolean),
  }));

  return {
    items,
    meta: { source: 'opensanctions', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length },
  };
}
