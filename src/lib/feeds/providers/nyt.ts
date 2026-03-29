import type { FeedParams, RawFeedResult } from '@/types/feeds';

export async function fetchNyt(params: FeedParams, apiKey?: string): Promise<RawFeedResult> {
  if (!apiKey) throw new Error('NYT API key required');
  const start = Date.now();
  const limit = Math.min(params.limit ?? 20, 50);
  const query = params.theaterId
    ? `theater:${params.theaterId} conflict war`
    : 'conflict war geopolitics';

  const url = new URL('https://api.nytimes.com/svc/search/v2/articlesearch.json');
  url.searchParams.set('api-key', apiKey);
  url.searchParams.set('q', query);
  url.searchParams.set('sort', 'newest');
  url.searchParams.set('page', '0');

  const res = await fetch(url.toString(), { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`NYT HTTP ${res.status}`);

  const data = await res.json() as {
    response?: { docs?: Array<{
      _id?: string; headline?: { main?: string }; abstract?: string;
      pub_date?: string; web_url?: string; keywords?: Array<{ value?: string }>;
    }> };
  };

  const items = (data.response?.docs ?? []).slice(0, limit).map((a) => ({
    id:          a._id,
    title:       a.headline?.main ?? 'Untitled',
    summary:     a.abstract,
    url:         a.web_url,
    publishedAt: a.pub_date,
    tags:        ['nyt', 'news', ...(a.keywords ?? []).map((k) => k.value ?? '').slice(0, 3)].filter(Boolean),
  }));

  return { items, meta: { source: 'nyt', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length } };
}
