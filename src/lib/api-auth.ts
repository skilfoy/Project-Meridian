import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

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
    return { userId, orgId: orgId ?? userId };
  } catch {
    if (process.env.NODE_ENV === 'development') {
      return { userId: 'dev', orgId: 'dev' };
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export function isAuthError(v: AuthContext | NextResponse): v is NextResponse {
  return v instanceof NextResponse;
}
