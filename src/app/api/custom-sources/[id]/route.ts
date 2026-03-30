import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encryptKey } from '@/lib/crypto';
import { requireAuth, isAuthError } from '@/lib/api-auth';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAuth();
  if (isAuthError(ctx)) return ctx;

  const { id } = await params;
  const body = await req.json() as {
    name?: string;
    description?: string;
    url?: string;
    authType?: string;
    credentials?: string;
    enabled?: boolean;
    refreshInterval?: number;
  };

  const encryptedCreds = body.credentials
    ? encryptKey(body.credentials, ctx.orgId)
    : undefined;

  const source = await db.customSource.updateMany({
    where: { id, orgId: ctx.orgId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.url !== undefined && { url: body.url }),
      ...(body.authType !== undefined && { authType: body.authType }),
      ...(encryptedCreds !== undefined && { encryptedCreds }),
      ...(body.enabled !== undefined && { enabled: body.enabled }),
      ...(body.refreshInterval !== undefined && { refreshInterval: body.refreshInterval }),
    },
  });

  if (source.count === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAuth();
  if (isAuthError(ctx)) return ctx;

  const { id } = await params;

  const result = await db.customSource.deleteMany({
    where: { id, orgId: ctx.orgId },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
