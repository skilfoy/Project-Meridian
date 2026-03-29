import type { FeedParams, RawFeedResult } from '@/types/feeds';

const THEATER_TAGS: Record<string, string> = {
  gcc:              'conflict,middle-east,saudi-arabia,uae',
  'eastern-europe': 'ukraine,russia,war',
  'indo-pacific':   'south-china-sea,taiwan,philippines',
  sahel:            'mali,niger,africa,terrorism',
  levant:           'israel,gaza,lebanon,syria',
  'horn-of-africa': 'somalia,ethiopia,horn-of-africa',
  'south-asia':     'afghanistan,pakistan',
  'latin-america':  'mexico,venezuela,colombia',
};

export async function fetchGuardian(params: FeedParams, apiKey?: string): Promise<RawFeedResult> {
  if (!apiKey) throw new Error('Guardian API key required');
  const start = Date.now();
  const limit = Math.min(params.limit ?? 20, 50);
  const tags = params.theaterId ? (THEATER_TAGS[params.theaterId] ?? 'conflict') : 'conflict';

  const url = new URL('https://content.guardianapis.com/search');
  url.searchParams.set('api-key', apiKey);
  url.searchParams.set('q', tags.split(',')[0]);
  url.searchParams.set('page-size', String(limit));
  url.searchParams.set('show-fields', 'trailText');
  url.searchParams.set('order-by', 'newest');

  const res = await fetch(url.toString(), { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`Guardian HTTP ${res.status}`);

  const data = await res.json() as {
    response?: { results?: Array<{
      id?: string; webTitle?: string; webPublicationDate?: string;
      webUrl?: string; fields?: { trailText?: string };
    }> };
  };

  const items = (data.response?.results ?? []).map((a) => ({
    id:          a.id,
    title:       a.webTitle ?? 'Untitled',
    summary:     a.fields?.trailText,
    url:         a.webUrl,
    publishedAt: a.webPublicationDate,
    tags:        ['guardian', 'news'],
  }));

  return { items, meta: { source: 'guardian', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length } };
}
