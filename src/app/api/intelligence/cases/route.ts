import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { listSignalCases, upsertSignalCase } from '@/lib/intelligence/cases';

const CreateSchema = z.object({
  signalKey: z.string().min(1).max(500),
  theaterId: z.string().min(1).max(100).optional(),
  family: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  firstSeenAt: z.string().datetime(),
  lastSeenAt: z.string().datetime(),
  latestRunId: z.string().min(1).max(200).optional(),
  latestSignalId: z.string().min(1).max(500).optional(),
});

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const theaterId = new URL(req.url).searchParams.get('theaterId') ?? undefined;
  const cases = await listSignalCases(auth.orgId, theaterId);
  return NextResponse.json({ cases }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid signal case', issues: parsed.error.issues }, { status: 400 });
  }
  const signalCase = await upsertSignalCase({ orgId: auth.orgId, userId: auth.userId, ...parsed.data });
  return NextResponse.json(signalCase, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
