import { NextRequest, NextResponse } from 'next/server';
import { isAuthError, requireAuth } from '@/lib/api-auth';
import { createGraphRelationship } from '@/lib/graph/service';
import type { CreateGraphRelationshipInput } from '@/lib/graph/contracts';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const input = (await request.json()) as CreateGraphRelationshipInput;
    const relationship = await createGraphRelationship(auth.orgId, input);
    return NextResponse.json({ relationship }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create graph relationship' },
      { status: 400 }
    );
  }
}
