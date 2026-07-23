import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const REQUIRED_ENVIRONMENT = [
  'DATABASE_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'ENCRYPTION_MASTER_SECRET',
] as const;

const hasRedisConfiguration = Boolean(
  (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
    process.env.REDIS_URL
);

async function checkCanonicalSchema(): Promise<'ok' | 'error'> {
  try {
    const result = await db.$queryRaw<Array<{ intelligence_run: string | null; graph_entity: string | null }>>`
      SELECT
        to_regclass('public."IntelligenceRun"')::text AS intelligence_run,
        to_regclass('public."GraphEntity"')::text AS graph_entity
    `;

    return result[0]?.intelligence_run && result[0]?.graph_entity ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}

export async function GET() {
  const missing = REQUIRED_ENVIRONMENT.filter((name) => !process.env[name]);
  const encryptionSecret = process.env.ENCRYPTION_MASTER_SECRET;
  const invalidEncryptionSecret = Boolean(
    encryptionSecret && !/^[a-fA-F0-9]{64}$/.test(encryptionSecret)
  );
  const databaseSchema = missing.includes('DATABASE_URL') ? 'error' : await checkCanonicalSchema();

  const ready = missing.length === 0 && !invalidEncryptionSecret && databaseSchema === 'ok';

  return NextResponse.json(
    {
      status: ready ? 'ready' : 'not_ready',
      checks: {
        requiredEnvironment: missing.length === 0 ? 'ok' : 'error',
        encryptionSecret: invalidEncryptionSecret ? 'error' : encryptionSecret ? 'ok' : 'missing',
        databaseSchema,
      },
      capabilities: {
        redis: hasRedisConfiguration ? 'configured' : 'disabled',
        backgroundCollection: process.env.REDIS_URL ? 'configured' : 'disabled',
        aiSynthesis:
          process.env.AI_PROVIDER && process.env.AI_PROVIDER !== 'disabled'
            ? 'configured'
            : 'disabled',
        sentry: process.env.SENTRY_DSN ? 'configured' : 'disabled',
        posthog: process.env.NEXT_PUBLIC_POSTHOG_KEY ? 'configured' : 'disabled',
        billing: process.env.STRIPE_SECRET_KEY ? 'configured' : 'disabled',
      },
      missing,
      ts: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 }
  );
}
