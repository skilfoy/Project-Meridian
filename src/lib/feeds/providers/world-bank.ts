import type { FeedParams, RawFeedResult } from '@/types/feeds';

export async function fetchWorldBank(params: FeedParams): Promise<RawFeedResult> {
  const start = Date.now();
  const limit = Math.min(params.limit ?? 20, 50);

  // Intentional homicide rate per 100k — a proxy for conflict/instability
  const res = await fetch(
    'https://api.worldbank.org/v2/country/all/indicator/VC.IHR.PSRC.P5?format=json&mrv=1&per_page=100',
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) throw new Error(`World Bank HTTP ${res.status}`);

  const data = await res.json() as [unknown, Array<{
    country?: { value?: string };
    value?: number | null;
    date?: string;
    indicator?: { value?: string };
  }>];

  const rows = Array.isArray(data[1]) ? data[1] : [];
  const sorted = rows
    .filter((r) => r.value != null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, limit);

  const items = sorted.map((r) => ({
    title:       `${r.country?.value ?? 'Unknown'}: ${r.indicator?.value ?? 'Violence indicator'} — ${r.value?.toFixed(1)} (${r.date ?? 'N/A'})`,
    url:         'https://data.worldbank.org/indicator/VC.IHR.PSRC.P5',
    publishedAt: r.date ? new Date(`${r.date}-01-01`).toISOString() : undefined,
    tags:        ['world-bank', 'conflict', 'statistics', r.country?.value ?? ''].filter(Boolean),
  }));

  return {
    items,
    meta: { source: 'world-bank', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length },
  };
}
