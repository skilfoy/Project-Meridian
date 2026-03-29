import type { FeedParams, RawFeedResult } from '@/types/feeds';

const THEATER_COUNTRIES: Record<string, string[]> = {
  gcc:              ['Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Yemen'],
  'eastern-europe': ['Ukraine', 'Moldova'],
  'indo-pacific':   ['Philippines', 'Myanmar', 'Bangladesh'],
  sahel:            ['Mali', 'Niger', 'Burkina Faso', 'Chad', 'Nigeria'],
  levant:           ['Israel', 'Palestine', 'Lebanon', 'Syria'],
  'horn-of-africa': ['Somalia', 'Ethiopia', 'Sudan', 'South Sudan'],
  'south-asia':     ['Afghanistan', 'Pakistan'],
  'latin-america':  ['Haiti', 'Venezuela', 'Colombia'],
};

export async function fetchReliefWeb(params: FeedParams): Promise<RawFeedResult> {
  const start = Date.now();
  const countries = params.theaterId ? (THEATER_COUNTRIES[params.theaterId] ?? []) : [];
  const limit = Math.min(params.limit ?? 20, 50);

  const body: Record<string, unknown> = {
    limit,
    sort: ['date:desc'],
    fields: { include: ['name', 'date', 'country', 'primary_type', 'url'] },
  };

  if (countries.length > 0) {
    body.filter = { operator: 'AND', conditions: [{ field: 'country.name', value: countries }] };
  }

  const res = await fetch('https://api.reliefweb.int/v1/disasters?appname=apidoc-samples', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`ReliefWeb HTTP ${res.status}`);

  const data = await res.json() as {
    data?: Array<{
      fields?: {
        title?: string; date?: { created?: string }; country?: Array<{ name?: string }>;
        disaster_type?: Array<{ name?: string }>; url?: string;
      };
    }>;
  };

  const items = (data.data ?? []).map((d) => {
    const f = d.fields ?? {};
    return {
      title:       (f as { name?: string }).name ?? 'Untitled',
      url:         (f as { url?: string }).url,
      publishedAt: (f as { date?: { created?: string } }).date?.created,
      tags:        [
        'reliefweb', 'humanitarian',
        ...((f as { primary_type?: Array<{ name?: string }> }).primary_type ?? []).map((t) => t.name ?? ''),
        ...((f as { country?: Array<{ name?: string }> }).country ?? []).map((c) => c.name ?? ''),
      ].filter(Boolean),
    };
  });

  return { items, meta: { source: 'reliefweb', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length } };
}
