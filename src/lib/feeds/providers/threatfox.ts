import type { FeedParams, RawFeedResult } from '@/types/feeds';

export async function fetchThreatFox(params: FeedParams): Promise<RawFeedResult> {
  const start = Date.now();
  const res = await fetch('https://threatfox-api.abuse.ch/api/v1/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'get_iocs', days: 1 }),
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`ThreatFox HTTP ${res.status}`);

  const data = await res.json() as {
    data?: Array<{
      id?: string; ioc?: string; threat_type?: string; malware?: string;
      first_seen?: string; tags?: string[] | null; reference?: string;
      confidence_level?: number;
    }>;
  };

  const limit = params.limit ?? 25;
  const items = (data.data ?? []).slice(0, limit).map((i) => ({
    id:          i.id,
    title:       `IOC: ${i.ioc?.slice(0, 80) ?? 'unknown'} (${i.malware ?? 'unknown'})`,
    summary:     `Type: ${i.threat_type ?? 'unknown'} | Confidence: ${i.confidence_level ?? 0}%`,
    url:         i.reference,
    publishedAt: i.first_seen,
    severity:    'HIGH' as const,
    tags:        ['threatfox', 'ioc', i.malware ?? '', i.threat_type ?? '', ...(i.tags ?? [])].filter(Boolean),
  }));

  return { items, meta: { source: 'threatfox', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length } };
}
