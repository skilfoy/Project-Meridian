import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isAuthError } from '@/lib/api-auth';

export async function GET() {
  const ctx = await requireAuth();
  if (isAuthError(ctx)) return ctx;

  const org = await db.organization.findUnique({
    where: { id: ctx.orgId },
    select: { id: true, name: true, slug: true, plan: true, tlpDefault: true, createdAt: true },
  });

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  return NextResponse.json({ org });
}

export async function PATCH(req: Request) {
  const ctx = await requireAuth();
  if (isAuthError(ctx)) return ctx;

  const body = await req.json() as { name?: string; tlpDefault?: 'WHITE' | 'GREEN' | 'AMBER' | 'RED' };

  const org = await db.organization.update({
    where: { id: ctx.orgId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.tlpDefault !== undefined && { tlpDefault: body.tlpDefault }),
    },
    select: { id: true, name: true, slug: true, plan: true, tlpDefault: true },
  });

  return NextResponse.json({ org });
}
