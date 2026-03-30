import type { FeedParams, RawFeedResult } from '@/types/feeds';

function parseRssItems(xml: string): Array<{ title: string; link?: string; pubDate?: string; description?: string }> {
  const items: Array<{ title: string; link?: string; pubDate?: string; description?: string }> = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title   = block.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? '';
    const link    = block.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1]?.trim();
    const pubDate = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();
    items.push({ title: title.trim(), link, pubDate });
  }
  return items;
}

export async function fetchWhoDisease(params: FeedParams): Promise<RawFeedResult> {
  const start = Date.now();
  const limit = Math.min(params.limit ?? 20, 50);

  const res = await fetch('https://www.who.int/rss-feeds/news-releases.xml', {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`WHO RSS HTTP ${res.status}`);

  const xml = await res.text();
  const raw = parseRssItems(xml).slice(0, limit);

  const items = raw.map((r) => ({
    title:       r.title || 'WHO News Release',
    url:         r.link,
    publishedAt: r.pubDate ? new Date(r.pubDate).toISOString() : undefined,
    tags:        ['who', 'disease', 'health'],
  }));

  return {
    items,
    meta: { source: 'who-disease', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length },
  };
}
