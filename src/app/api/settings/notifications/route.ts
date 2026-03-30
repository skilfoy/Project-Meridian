import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isAuthError } from '@/lib/api-auth';

export async function GET() {
  const ctx = await requireAuth();
  if (isAuthError(ctx)) return ctx;

  const org = await db.organization.findUnique({
    where: { id: ctx.orgId },
    select: { notificationConfig: true },
  });

  return NextResponse.json({ config: org?.notificationConfig ?? {} });
}

export async function PUT(req: Request) {
  const ctx = await requireAuth();
  if (isAuthError(ctx)) return ctx;

  const config = await req.json();

  await db.organization.update({
    where: { id: ctx.orgId },
    data:  { notificationConfig: config },
  });

  return NextResponse.json({ ok: true });
}
