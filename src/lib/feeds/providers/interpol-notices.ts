import type { FeedParams, RawFeedResult } from '@/types/feeds';

export async function fetchInterpolNotices(params: FeedParams): Promise<RawFeedResult> {
  const start = Date.now();
  const limit = Math.min(params.limit ?? 20, 20);

  const res = await fetch(
    `https://ws-public.interpol.int/notices/v1/red?resultPerPage=${limit}&page=1`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`Interpol HTTP ${res.status}`);

  const data = await res.json() as {
    _embedded?: {
      notices?: Array<{
        entity_id?: string;
        forename?: string;
        name?: string;
        nationalities?: string[];
        date_of_birth?: string;
        _links?: { self?: { href?: string } };
      }>;
    };
  };

  const notices = data._embedded?.notices ?? [];

  const items = notices.map((n) => {
    const fullName = [n.forename, n.name].filter(Boolean).join(' ') || 'Unknown Subject';
    return {
      title:       `RED NOTICE: ${fullName}`,
      url:         n._links?.self?.href ?? 'https://www.interpol.int/How-we-work/Notices/Red-Notices/View-Red-Notices',
      publishedAt: undefined,
      tags:        ['interpol', 'red-notice', 'law-enforcement', ...(n.nationalities ?? [])].filter(Boolean),
    };
  });

  return {
    items,
    meta: { source: 'interpol-notices', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length },
  };
}
