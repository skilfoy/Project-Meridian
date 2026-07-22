import { NextRequest, NextResponse } from 'next/server';
import { isAuthError, requireAuth } from '@/lib/api-auth';
import { createGraphEvidenceLink } from '@/lib/graph/service';
import type { CreateGraphEvidenceLinkInput } from '@/lib/graph/contracts';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const input = (await request.json()) as CreateGraphEvidenceLinkInput;
    const evidenceLink = await createGraphEvidenceLink(auth.orgId, input);
    return NextResponse.json({ evidenceLink }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create graph evidence link' },
      { status: 400 }
    );
  }
}
