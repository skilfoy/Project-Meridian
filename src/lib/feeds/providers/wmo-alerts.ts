import type { FeedParams, RawFeedResult } from '@/types/feeds';

export async function fetchWmoAlerts(params: FeedParams): Promise<RawFeedResult> {
  const start = Date.now();
  const limit = Math.min(params.limit ?? 20, 50);

  const res = await fetch(
    'https://api.weather.gov/alerts/active?status=actual&message_type=alert',
    {
      headers: { 'User-Agent': 'MERIDIAN/1.0 (intel-platform)' },
      next: { revalidate: 900 },
    }
  );
  if (!res.ok) throw new Error(`NWS Alerts HTTP ${res.status}`);

  const data = await res.json() as {
    features?: Array<{
      properties?: {
        headline?: string;
        event?: string;
        areaDesc?: string;
        effective?: string;
        severity?: string;
        certainty?: string;
        instruction?: string;
      };
    }>;
  };

  const items = (data.features ?? []).slice(0, limit).map((f) => {
    const p = f.properties ?? {};
    return {
      title:       p.headline ?? p.event ?? 'Weather Alert',
      url:         'https://www.weather.gov/alerts',
      publishedAt: p.effective,
      tags:        ['nws', 'weather', 'alert', p.event ?? '', p.severity ?? ''].filter(Boolean),
    };
  });

  return {
    items,
    meta: { source: 'wmo-alerts', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length },
  };
}
