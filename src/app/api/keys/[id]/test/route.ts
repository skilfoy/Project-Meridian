import { auth }             from '@clerk/nextjs/server';
import { NextResponse }     from 'next/server';
import { db }               from '@/lib/db';
import { decryptKey }       from '@/lib/crypto';
import { fetchFeedWithCache } from '@/lib/feeds/fetcher';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const resolvedOrgId = orgId ?? userId;

  const key = await db.apiKey.findFirst({ where: { id, orgId: resolvedOrgId } });
  if (!key) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const plainKey = decryptKey(key.encryptedKey, resolvedOrgId);
  const start    = Date.now();

  try {
    await fetchFeedWithCache(key.provider, { limit: 1 }, plainKey);
    const latencyMs = Date.now() - start;

    await db.apiKey.update({
      where: { id },
      data: { lastTestedAt: new Date(), lastStatus: 'ok' },
    });

    return NextResponse.json({ status: 'ok', latencyMs });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Test failed';
    await db.apiKey.update({
      where: { id },
      data: { lastTestedAt: new Date(), lastStatus: `error: ${message}` },
    });
    return NextResponse.json({ status: 'error', error: message }, { status: 502 });
  }
}
