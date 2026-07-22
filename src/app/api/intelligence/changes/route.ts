import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { getLatestIntelligenceChanges } from '@/lib/intelligence/history';

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const theaterId = searchParams.get('theaterId') ?? undefined;

  const changes = await getLatestIntelligenceChanges(auth.orgId, theaterId);
  if (!changes) {
    return NextResponse.json(
      {
        status: 'insufficient_history',
        message: 'At least two persisted intelligence runs are required for comparison.',
      },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.json(changes, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
