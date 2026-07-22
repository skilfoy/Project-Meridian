import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { getSignalCenterOverview } from '@/lib/intelligence/signal-center';

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const theaterId = searchParams.get('theaterId') ?? undefined;

  try {
    const overview = await getSignalCenterOverview(auth.orgId, theaterId);
    return NextResponse.json(overview, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load Signal Center overview' },
      { status: 500 }
    );
  }
}
