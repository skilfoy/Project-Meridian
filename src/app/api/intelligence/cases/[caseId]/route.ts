import { NextResponse } from 'next/server';
import { SignalCaseStatus, SignalDisposition } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { addSignalCaseNote, updateSignalCase } from '@/lib/intelligence/cases';

const UpdateSchema = z.object({
  status: z.nativeEnum(SignalCaseStatus).optional(),
  disposition: z.nativeEnum(SignalDisposition).nullable().optional(),
  assignedTo: z.string().max(200).nullable().optional(),
  watched: z.boolean().optional(),
  note: z.string().trim().min(1).max(10000).optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'At least one update is required' });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const { caseId } = await params;
  const parsed = UpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid signal case update', issues: parsed.error.issues }, { status: 400 });
  }

  const { note, ...changes } = parsed.data;
  let signalCase = Object.keys(changes).length > 0
    ? await updateSignalCase({ orgId: auth.orgId, userId: auth.userId, caseId, ...changes })
    : null;

  if (note) {
    signalCase = await addSignalCaseNote({ orgId: auth.orgId, userId: auth.userId, caseId, body: note });
  }

  if (!signalCase) return NextResponse.json({ error: 'Signal case not found' }, { status: 404 });
  return NextResponse.json(signalCase, { headers: { 'Cache-Control': 'no-store' } });
}
