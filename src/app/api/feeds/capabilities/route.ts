import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { getSourceCatalog, getSourceCatalogSummary } from '@/lib/feeds/catalog';

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  return NextResponse.json(
    {
      summary: getSourceCatalogSummary(),
      sources: getSourceCatalog(),
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    }
  );
}
