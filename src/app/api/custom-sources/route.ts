import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encryptKey } from '@/lib/crypto';
import { requireAuth, isAuthError } from '@/lib/api-auth';

export async function GET() {
  const ctx = await requireAuth();
  if (isAuthError(ctx)) return ctx;

  const sources = await db.customSource.findMany({
    where: { orgId: ctx.orgId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, description: true, type: true, url: true,
      authType: true, enabled: true, refreshInterval: true,
      lastFetchedAt: true, lastError: true, createdAt: true,
    },
  });

  return NextResponse.json({ sources });
}

export async function POST(req: Request) {
  const ctx = await requireAuth();
  if (isAuthError(ctx)) return ctx;

  const body = await req.json() as {
    name: string;
    description?: string;
    type: 'RSS' | 'REST_API' | 'WEB_URL';
    url: string;
    authType?: string;
    credentials?: string;
    refreshInterval?: number;
  };

  if (!body.name || !body.url || !body.type) {
    return NextResponse.json({ error: 'name, url, and type are required' }, { status: 400 });
  }

  const encryptedCreds = body.credentials
    ? encryptKey(body.credentials, ctx.orgId)
    : undefined;

  const source = await db.customSource.create({
    data: {
      orgId:           ctx.orgId,
      name:            body.name,
      description:     body.description,
      type:            body.type,
      url:             body.url,
      authType:        body.authType,
      encryptedCreds,
      refreshInterval: body.refreshInterval ?? 3600,
    },
    select: {
      id: true, name: true, description: true, type: true, url: true,
      authType: true, enabled: true, refreshInterval: true, createdAt: true,
    },
  });

  return NextResponse.json({ source }, { status: 201 });
}
