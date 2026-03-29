import type { FeedParams, RawFeedResult } from '@/types/feeds';

export async function fetchGdacs(params: FeedParams): Promise<RawFeedResult> {
  const start = Date.now();
  const res = await fetch('https://www.gdacs.org/xml/rss.xml', { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`GDACS HTTP ${res.status}`);

  const text = await res.text();
  const limit = params.limit ?? 20;

  // Simple regex-based RSS parse — avoids xml2js in edge runtime
  const items: Array<{ title: string; url?: string; publishedAt?: string; summary?: string; tags: string[] }> = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRe.exec(text)) !== null && items.length < limit) {
    const block = match[1];
    const title  = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? block.match(/<title>(.*?)<\/title>/)?.[1] ?? 'Unknown';
    const link   = block.match(/<link>(.*?)<\/link>/)?.[1];
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
    const desc   = block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]?.slice(0, 200);

    items.push({ title, url: link, publishedAt: pubDate, summary: desc, tags: ['gdacs', 'disaster', 'environmental'] });
  }

  return { items, meta: { source: 'gdacs', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length } };
}
