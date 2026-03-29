import { auth }        from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { FEED_REGISTRY } from '@/lib/feeds/registry';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const statuses = FEED_REGISTRY.map((f) => ({
    feedId:      f.id,
    name:        f.name,
    category:    f.category,
    tier:        f.tier,
    requiresKey: f.requiresKey,
    enabled:     f.defaultEnabled,
    status:      'unknown',
  }));

  return NextResponse.json({ feeds: statuses });
}
