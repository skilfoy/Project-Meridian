import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isAuthError } from '@/lib/api-auth';

export async function GET() {
  const ctx = await requireAuth();
  if (isAuthError(ctx)) return ctx;

  const dashboards = await db.dashboard.findMany({
    where: { orgId: ctx.orgId },
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    select: {
      id: true, name: true, theaterId: true, config: true,
      aiData: true, pinned: true, tlp: true, createdAt: true, updatedAt: true,
    },
  });

  return NextResponse.json({ dashboards });
}
