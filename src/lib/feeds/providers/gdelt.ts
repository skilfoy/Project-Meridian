import type { FeedParams, RawFeedResult } from '@/types/feeds';

const THEATER_QUERIES: Record<string, string> = {
  gcc:              'Saudi Arabia OR UAE OR Qatar OR Kuwait OR Bahrain OR Oman',
  'eastern-europe': 'Ukraine OR Russia war conflict',
  'indo-pacific':   'South China Sea OR Taiwan OR Philippines',
  sahel:            'Mali OR Niger OR Burkina Faso OR Sahel',
  levant:           'Israel OR Gaza OR Lebanon OR Syria',
  'horn-of-africa': 'Somalia OR Ethiopia OR Red Sea OR Houthi',
  'south-asia':     'Pakistan OR Afghanistan OR Kashmir',
  'latin-america':  'Mexico OR Venezuela OR Colombia cartel',
};

export async function fetchGdelt(params: FeedParams): Promise<RawFeedResult> {
  const start = Date.now();
  const query = params.theaterId ? (THEATER_QUERIES[params.theaterId] ?? 'conflict war') : 'conflict war attack';
  const limit = Math.min(params.limit ?? 25, 50);
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=${limit}&format=json&sort=DateDesc`;

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`GDELT HTTP ${res.status}`);

  const data = await res.json() as { articles?: Array<{
    title?: string; url?: string; seendate?: string; domain?: string; language?: string;
    sourcecountry?: string; tone?: string;
  }> };

  const items = (data.articles ?? []).map((a) => ({
    id:          a.url,
    title:       a.title ?? 'Untitled',
    url:         a.url,
    publishedAt: a.seendate,
    tags:        [a.domain ?? '', a.sourcecountry ?? '', a.language ?? ''].filter(Boolean),
  }));

  return { items, meta: { source: 'gdelt', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length } };
}
