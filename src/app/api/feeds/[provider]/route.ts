import { auth }                  from '@clerk/nextjs/server';
import { NextResponse }          from 'next/server';
import { fetchFeedWithCache }    from '@/lib/feeds/fetcher';
import { getFeed }               from '@/lib/feeds/registry';
import { db }                    from '@/lib/db';
import { decryptKey }            from '@/lib/crypto';
import type { FeedParams }       from '@/types/feeds';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  let userId: string | null = null;
  let orgId:  string | null | undefined = null;

  try {
    ({ userId, orgId } = await auth());
  } catch {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!userId && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedOrgId = orgId ?? userId ?? 'dev';

  const { provider } = await params;
  const { searchParams } = new URL(req.url);

  const feedDef = getFeed(provider);
  if (!feedDef) return NextResponse.json({ error: `Unknown feed: ${provider}` }, { status: 404 });

  const feedParams: FeedParams = {
    theaterId: searchParams.get('theater') ?? undefined,
    limit:     searchParams.has('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
    filters:   Object.fromEntries(searchParams.entries()),
  };

  let apiKey: string | undefined;

  if (feedDef.requiresKey && resolvedOrgId !== 'dev') {
    const stored = await db.apiKey.findFirst({
      where: { orgId: resolvedOrgId, provider, enabled: true },
    });
    if (!stored) {
      return NextResponse.json(
        { error: 'API key required — add it in Settings > Sources' },
        { status: 402 }
      );
    }
    apiKey = decryptKey(stored.encryptedKey, resolvedOrgId);
  } else if (feedDef.requiresKey && resolvedOrgId === 'dev') {
    // dev fallback: allow env key for local testing
    apiKey = process.env[`FEED_KEY_${provider.toUpperCase().replace(/-/g, '_')}`];
  }

  try {
    const result = await fetchFeedWithCache(provider, feedParams, apiKey);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Feed fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
