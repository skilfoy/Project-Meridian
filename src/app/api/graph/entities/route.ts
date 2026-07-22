import { NextRequest, NextResponse } from 'next/server';
import { isAuthError, requireAuth } from '@/lib/api-auth';
import { searchGraphEntities, upsertGraphEntity } from '@/lib/graph/service';
import type { CreateGraphEntityInput } from '@/lib/graph/contracts';

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const query = request.nextUrl.searchParams.get('q') ?? undefined;
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? 50);
  const entities = await searchGraphEntities(auth.orgId, query, limit);
  return NextResponse.json({ entities });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const input = (await request.json()) as CreateGraphEntityInput;
    const entity = await upsertGraphEntity(auth.orgId, input);
    return NextResponse.json({ entity }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create graph entity' },
      { status: 400 }
    );
  }
}
