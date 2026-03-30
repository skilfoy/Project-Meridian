import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isAuthError } from '@/lib/api-auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAuth();
  if (isAuthError(ctx)) return ctx;

  const { id } = await params;
  const { notes } = await req.json() as { notes?: string };

  const result = await db.savedIncident.updateMany({
    where: { id, orgId: ctx.orgId, userId: ctx.userId },
    data: { notes },
  });

  if (result.count === 0) {
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

  const result = await db.savedIncident.deleteMany({
    where: { id, orgId: ctx.orgId, userId: ctx.userId },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
