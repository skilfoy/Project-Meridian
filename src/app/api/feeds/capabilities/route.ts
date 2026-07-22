import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { getTenantSourceHealth } from '@/lib/feeds/health';

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const health = await getTenantSourceHealth(auth.orgId);
  return NextResponse.json(health, {
    headers: {
      'Cache-Control': 'private, max-age=30',
    },
  });
}
