import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isAuthError } from '@/lib/api-auth';

export async function GET(req: Request) {
  const ctx = await requireAuth();
  if (isAuthError(ctx)) return ctx;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  const [incidents, total] = await Promise.all([
    db.savedIncident.findMany({
      where: { orgId: ctx.orgId, userId: ctx.userId },
      orderBy: { savedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    db.savedIncident.count({ where: { orgId: ctx.orgId, userId: ctx.userId } }),
  ]);

  return NextResponse.json({ incidents, total });
}

export async function POST(req: Request) {
  const ctx = await requireAuth();
  if (isAuthError(ctx)) return ctx;

  const body = await req.json() as {
    incidentId: string;
    source: string;
    title: string;
    summary?: string;
    url?: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    theaterId?: string;
    occurredAt: string;
    notes?: string;
  };

  if (!body.incidentId || !body.source || !body.title || !body.severity || !body.occurredAt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const incident = await db.savedIncident.upsert({
    where: { orgId_userId_incidentId: { orgId: ctx.orgId, userId: ctx.userId, incidentId: body.incidentId } },
    create: {
      orgId:      ctx.orgId,
      userId:     ctx.userId,
      incidentId: body.incidentId,
      source:     body.source,
      title:      body.title,
      summary:    body.summary,
      url:        body.url,
      severity:   body.severity,
      theaterId:  body.theaterId,
      occurredAt: new Date(body.occurredAt),
      notes:      body.notes,
    },
    update: { notes: body.notes },
  });

  return NextResponse.json({ incident }, { status: 201 });
}
