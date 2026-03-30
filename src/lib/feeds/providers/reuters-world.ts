import type { FeedParams, RawFeedResult } from '@/types/feeds';

function parseRssItems(xml: string) {
  const items: Array<{ title: string; link?: string; pubDate?: string; description?: string }> = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title   = (block.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ?? block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? '').trim();
    const link    = block.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1]?.trim();
    const pubDate = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();
    const desc    = (block.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ?? block.match(/<description[^>]*>([\s\S]*?)<\/description>/)?.[1] ?? '').trim();
    items.push({ title, link, pubDate, description: desc });
  }
  return items;
}

export async function fetchReutersWorld(params: FeedParams): Promise<RawFeedResult> {
  const start = Date.now();
  const limit = Math.min(params.limit ?? 20, 50);

  const res = await fetch('https://feeds.reuters.com/Reuters/worldNews', {
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`Reuters World RSS HTTP ${res.status}`);

  const xml = await res.text();
  const raw = parseRssItems(xml).slice(0, limit);

  const items = raw.map((r) => ({
    title:       r.title || 'Reuters World News',
    summary:     r.description?.replace(/<[^>]+>/g, '').slice(0, 300),
    url:         r.link,
    publishedAt: r.pubDate ? new Date(r.pubDate).toISOString() : undefined,
    tags:        ['reuters-world', 'news', 'world', 'geopolitics'],
  }));

  return {
    items,
    meta: { source: 'reuters-world', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length },
  };
}
