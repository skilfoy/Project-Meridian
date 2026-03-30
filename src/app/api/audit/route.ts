import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isAuthError } from '@/lib/api-auth';

export async function GET(req: Request) {
  const ctx = await requireAuth();
  if (isAuthError(ctx)) return ctx;

  const { searchParams } = new URL(req.url);
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 500);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);
  const action = searchParams.get('action') ?? undefined;

  const where = {
    orgId: ctx.orgId,
    ...(action ? { action } : {}),
  };

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take:    limit,
      skip:    offset,
    }),
    db.auditLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total });
}
