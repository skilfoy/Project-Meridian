import { NextRequest, NextResponse } from 'next/server';
import { isAuthError, requireAuth } from '@/lib/api-auth';
import { createGraphAssertion } from '@/lib/graph/service';
import type { CreateGraphAssertionInput } from '@/lib/graph/contracts';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const input = (await request.json()) as CreateGraphAssertionInput;
    const assertion = await createGraphAssertion(auth.orgId, input);
    return NextResponse.json({ assertion }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create graph assertion' },
      { status: 400 }
    );
  }
}
