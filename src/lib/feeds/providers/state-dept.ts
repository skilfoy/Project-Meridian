import type { FeedParams, RawFeedResult } from '@/types/feeds';
import type { Severity } from '@/types';

function levelToSeverity(title: string): Severity {
  if (title.includes('Level 4') || title.includes('Do Not Travel')) return 'CRITICAL';
  if (title.includes('Level 3') || title.includes('Reconsider')) return 'HIGH';
  if (title.includes('Level 2') || title.includes('Exercise Increased')) return 'MEDIUM';
  return 'LOW';
}

export async function fetchStateDept(params: FeedParams): Promise<RawFeedResult> {
  const start = Date.now();
  const res = await fetch('https://travel.state.gov/_res/rss/TAsTWs.xml', { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`State Dept HTTP ${res.status}`);

  const text = await res.text();
  const limit = params.limit ?? 30;

  const items: Array<{ title: string; url?: string; publishedAt?: string; severity: Severity; tags: string[] }> = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRe.exec(text)) !== null && items.length < limit) {
    const block = match[1];
    const title   = block.match(/<title>(.*?)<\/title>/)?.[1] ?? 'Unknown';
    const link    = block.match(/<link>(.*?)<\/link>/)?.[1];
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];

    items.push({ title, url: link, publishedAt: pubDate, severity: levelToSeverity(title), tags: ['state-dept', 'travel-advisory', 'government'] });
  }

  return { items, meta: { source: 'state-dept', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length } };
}
