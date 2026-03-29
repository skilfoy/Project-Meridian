import { auth }        from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db }           from '@/lib/db';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const resolvedOrgId = orgId ?? userId;

  const key = await db.apiKey.findFirst({ where: { id, orgId: resolvedOrgId } });
  if (!key) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.apiKey.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
