import type { FeedParams, RawFeedResult } from '@/types/feeds';

interface AbuseIpEntry {
  ipAddress?:             string;
  abuseConfidenceScore?:  number;
  countryCode?:           string;
  isp?:                   string;
  lastReportedAt?:        string;
}

interface AbuseIpResponse {
  data?: AbuseIpEntry[];
}

export async function fetchAbuseIpdb(params: FeedParams, apiKey?: string): Promise<RawFeedResult> {
  if (!apiKey) throw new Error('AbuseIPDB API key required');
  const start = Date.now();
  const limit = Math.min(params.limit ?? 100, 500);

  const res = await fetch(
    `https://api.abuseipdb.com/api/v2/blacklist?confidenceMinimum=90&limit=${limit}`,
    {
      headers: { Key: apiKey, Accept: 'application/json' },
      next: { revalidate: 3600 },
    }
  );
  if (!res.ok) throw new Error(`AbuseIPDB API HTTP ${res.status}`);

  const data = await res.json() as AbuseIpResponse;
  const entries = data.data ?? [];

  const items = entries.map((entry) => {
    const ip      = entry.ipAddress ?? 'unknown';
    const isp     = entry.isp ?? 'unknown ISP';
    const score   = entry.abuseConfidenceScore ?? 0;
    const country = entry.countryCode ?? 'XX';
    return {
      title:       `Abusive IP: ${ip} (${isp}) — ${score}% confidence`,
      publishedAt: entry.lastReportedAt ? new Date(entry.lastReportedAt).toISOString() : undefined,
      tags:        ['abuseipdb', 'cyber', 'ioc', 'malicious-ip', country.toLowerCase()],
    };
  });

  return {
    items,
    meta: { source: 'abuseipdb', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length },
  };
}
