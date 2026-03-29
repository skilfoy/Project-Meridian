import type { FeedParams, RawFeedResult } from '@/types/feeds';

export async function fetchUrlhaus(params: FeedParams): Promise<RawFeedResult> {
  const start = Date.now();
  const res = await fetch('https://urlhaus-api.abuse.ch/v1/urls/recent/limit/100/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: '',
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`URLhaus HTTP ${res.status}`);

  const data = await res.json() as {
    urls?: Array<{
      id?: string; url?: string; url_status?: string; date_added?: string;
      threat?: string; tags?: string[] | null; urlhaus_reference?: string;
    }>;
  };

  const limit = params.limit ?? 25;
  const items = (data.urls ?? []).slice(0, limit).map((u) => ({
    id:          u.id,
    title:       `Malicious URL: ${u.url?.slice(0, 80) ?? 'unknown'}`,
    summary:     `Threat: ${u.threat ?? 'unknown'} | Status: ${u.url_status ?? 'unknown'}`,
    url:         u.urlhaus_reference,
    publishedAt: u.date_added,
    severity:    'HIGH' as const,
    tags:        ['urlhaus', 'malware', u.threat ?? '', ...(u.tags ?? [])].filter(Boolean),
  }));

  return { items, meta: { source: 'urlhaus', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length } };
}
