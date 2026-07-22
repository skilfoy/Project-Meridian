import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRedis } from '@/lib/redis';

const redisConfigured = Boolean(
  (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
    process.env.REDIS_URL
);

export async function GET() {
  const health: Record<string, string> = {
    status: 'ok',
    ts: new Date().toISOString(),
  };

  try {
    await db.$queryRaw`SELECT 1`;
    health.db = 'ok';
  } catch {
    health.db = 'error';
    health.status = 'unhealthy';
  }

  if (!redisConfigured) {
    health.redis = 'disabled';
  } else {
    try {
      await getRedis().ping();
      health.redis = 'ok';
    } catch {
      health.redis = 'error';
      if (health.status === 'ok') {
        health.status = 'degraded';
      }
    }
  }

  const statusCode = health.status === 'unhealthy' ? 503 : 200;
  return NextResponse.json(health, { status: statusCode });
}
