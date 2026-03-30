import type { FeedParams, RawFeedResult } from '@/types/feeds';

interface FeodoEntry {
  ip_address?: string;
  port?:       number;
  last_online?: string;
  malware?:    string;
}

export async function fetchFeodoTracker(params: FeedParams): Promise<RawFeedResult> {
  const start = Date.now();
  const limit = Math.min(params.limit ?? 50, 200);

  const res = await fetch('https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.json', {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Feodo Tracker HTTP ${res.status}`);

  const data = await res.json() as FeodoEntry[];
  const raw = Array.isArray(data) ? data.slice(0, limit) : [];

  const items = raw.map((entry) => {
    const ip      = entry.ip_address ?? 'unknown';
    const port    = entry.port ?? 0;
    const malware = entry.malware ?? 'unknown';
    return {
      title:       `C2: ${ip}:${port} (${malware})`,
      publishedAt: entry.last_online ? new Date(entry.last_online).toISOString() : undefined,
      tags:        ['feodo-tracker', 'cyber', 'c2', 'botnet', 'ioc', malware.toLowerCase()],
    };
  });

  return {
    items,
    meta: { source: 'feodo-tracker', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length },
  };
}
