import { NextRequest, NextResponse } from 'next/server';
import { isAuthError, requireAuth } from '@/lib/api-auth';
import { getGraphNeighborhood } from '@/lib/graph/service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ entityId: string }> }
) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const { entityId } = await context.params;
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? 100);
  const neighborhood = await getGraphNeighborhood(auth.orgId, entityId, limit);
  if (!neighborhood) return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
  return NextResponse.json(neighborhood);
}
