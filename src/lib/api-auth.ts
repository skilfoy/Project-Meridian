import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { ensureTenant } from '@/lib/tenant';

export interface AuthContext {
  userId: string;
  orgId: string;
}

export async function requireAuth(): Promise<AuthContext | NextResponse> {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedOrgId = orgId ?? userId;
    await ensureTenant({
      orgId: resolvedOrgId,
      userId,
      personalWorkspace: !orgId,
    });

    return { userId, orgId: resolvedOrgId };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      await ensureTenant({ orgId: 'dev', userId: 'dev', personalWorkspace: true });
      return { userId: 'dev', orgId: 'dev' };
    }

    console.error('Authentication or tenant provisioning failed', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export function isAuthError(v: AuthContext | NextResponse): v is NextResponse {
  return v instanceof NextResponse;
}
