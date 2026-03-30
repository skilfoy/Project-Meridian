import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isAuthError } from '@/lib/api-auth';

export async function GET() {
  const ctx = await requireAuth();
  if (isAuthError(ctx)) return ctx;

  const watchlist = await db.watchlist.findUnique({
    where: { orgId_userId: { orgId: ctx.orgId, userId: ctx.userId } },
  });

  return NextResponse.json({ theaterIds: watchlist?.theaterIds ?? [] });
}

export async function POST(req: Request) {
  const ctx = await requireAuth();
  if (isAuthError(ctx)) return ctx;

  const { theaterId } = await req.json() as { theaterId: string };
  if (!theaterId) {
    return NextResponse.json({ error: 'theaterId required' }, { status: 400 });
  }

  const existing = await db.watchlist.findUnique({
    where: { orgId_userId: { orgId: ctx.orgId, userId: ctx.userId } },
  });

  const theaterIds = Array.from(new Set([...(existing?.theaterIds ?? []), theaterId]));

  const watchlist = await db.watchlist.upsert({
    where:  { orgId_userId: { orgId: ctx.orgId, userId: ctx.userId } },
    create: { orgId: ctx.orgId, userId: ctx.userId, theaterIds },
    update: { theaterIds },
  });

  return NextResponse.json({ theaterIds: watchlist.theaterIds });
}

export async function DELETE(req: Request) {
  const ctx = await requireAuth();
  if (isAuthError(ctx)) return ctx;

  const { searchParams } = new URL(req.url);
  const theaterId = searchParams.get('theaterId');
  if (!theaterId) {
    return NextResponse.json({ error: 'theaterId query param required' }, { status: 400 });
  }

  const existing = await db.watchlist.findUnique({
    where: { orgId_userId: { orgId: ctx.orgId, userId: ctx.userId } },
  });

  const theaterIds = (existing?.theaterIds ?? []).filter((id) => id !== theaterId);

  await db.watchlist.upsert({
    where:  { orgId_userId: { orgId: ctx.orgId, userId: ctx.userId } },
    create: { orgId: ctx.orgId, userId: ctx.userId, theaterIds },
    update: { theaterIds },
  });

  return NextResponse.json({ theaterIds });
}
