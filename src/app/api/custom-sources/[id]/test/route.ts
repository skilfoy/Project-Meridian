import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decryptKey } from '@/lib/crypto';
import { requireAuth, isAuthError } from '@/lib/api-auth';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAuth();
  if (isAuthError(ctx)) return ctx;

  const { id } = await params;
  const source = await db.customSource.findFirst({
    where: { id, orgId: ctx.orgId },
  });

  if (!source) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const headers: Record<string, string> = { 'User-Agent': 'MERIDIAN/1.0' };
    if (source.encryptedCreds && source.authType === 'bearer') {
      const token = decryptKey(source.encryptedCreds, ctx.orgId);
      headers['Authorization'] = `Bearer ${token}`;
    }

    const start = Date.now();
    const res = await fetch(source.url, { headers, signal: AbortSignal.timeout(10000) });
    const latencyMs = Date.now() - start;

    const status = res.ok ? 'ok' : `http_${res.status}`;
    await db.customSource.update({
      where: { id },
      data: { lastFetchedAt: new Date(), lastError: res.ok ? null : `HTTP ${res.status}` },
    });

    return NextResponse.json({ status, latencyMs, httpStatus: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Fetch failed';
    await db.customSource.update({
      where: { id },
      data: { lastError: message },
    });
    return NextResponse.json({ status: 'error', error: message }, { status: 502 });
  }
}
