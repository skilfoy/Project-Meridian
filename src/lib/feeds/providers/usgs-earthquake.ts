import type { FeedParams, RawFeedResult } from '@/types/feeds';

export async function fetchUsgsEarthquake(params: FeedParams): Promise<RawFeedResult> {
  const start = Date.now();
  const limit = Math.min(params.limit ?? 20, 50);

  const res = await fetch(
    'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson',
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`USGS HTTP ${res.status}`);

  const data = await res.json() as {
    features?: Array<{
      properties?: { title?: string; time?: number; mag?: number; place?: string; url?: string; type?: string };
      geometry?: { coordinates?: [number, number, number] };
    }>;
  };

  const items = (data.features ?? []).slice(0, limit).map((f) => {
    const p = f.properties ?? {};
    return {
      title:       p.title ?? 'Earthquake',
      url:         p.url,
      publishedAt: p.time ? new Date(p.time).toISOString() : undefined,
      tags:        ['usgs', 'earthquake', 'seismic', p.place ?? ''].filter(Boolean),
    };
  });

  return {
    items,
    meta: { source: 'usgs-earthquake', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length },
  };
}
