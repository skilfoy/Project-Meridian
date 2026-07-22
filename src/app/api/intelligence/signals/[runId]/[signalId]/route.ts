import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { getSignalCenterDetail } from '@/lib/intelligence/signal-center';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ runId: string; signalId: string }> }
) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const { runId, signalId } = await params;

  try {
    const detail = await getSignalCenterDetail(auth.orgId, runId, signalId);
    if (!detail) {
      return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
    }

    return NextResponse.json(detail, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load signal provenance' },
      { status: 500 }
    );
  }
}
