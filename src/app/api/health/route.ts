import { NextResponse } from 'next/server';
import { db }          from '@/lib/db';
import { getRedis }    from '@/lib/redis';

export async function GET() {
  const health: Record<string, string> = { status: 'ok', ts: new Date().toISOString() };

  // DB check
  try {
    await db.$queryRaw`SELECT 1`;
    health.db = 'ok';
  } catch {
    health.db     = 'error';
    health.status = 'degraded';
  }

  // Redis check
  try {
    await getRedis().ping();
    health.redis = 'ok';
  } catch {
    health.redis  = 'error';
    health.status = 'degraded';
  }

  return NextResponse.json(health, { status: health.status === 'ok' ? 200 : 503 });
}
