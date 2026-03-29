import { auth }        from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z }            from 'zod';
import { db }           from '@/lib/db';
import { encryptKey }   from '@/lib/crypto';

const CreateSchema = z.object({
  provider: z.string().min(1),
  label:    z.string().min(1),
  key:      z.string().min(1),
});

export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const resolvedOrgId = orgId ?? userId;

  const keys = await db.apiKey.findMany({
    where: { orgId: resolvedOrgId },
    select: { id: true, provider: true, label: true, enabled: true, lastTestedAt: true, lastStatus: true, createdAt: true },
  });

  return NextResponse.json({ keys });
}

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const resolvedOrgId = orgId ?? userId;

  const body = await req.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { provider, label, key } = parsed.data;
  const encryptedKey = encryptKey(key, resolvedOrgId);

  const apiKey = await db.apiKey.upsert({
    where:  { orgId_provider: { orgId: resolvedOrgId, provider } },
    create: { orgId: resolvedOrgId, provider, label, encryptedKey },
    update: { encryptedKey, label },
    select: { id: true, provider: true, label: true },
  });

  return NextResponse.json({ apiKey });
}
