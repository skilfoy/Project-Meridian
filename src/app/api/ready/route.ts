import { NextResponse } from 'next/server';

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

export async function GET() {
  const missing = REQUIRED_ENVIRONMENT.filter((name) => !process.env[name]);
  const encryptionSecret = process.env.ENCRYPTION_MASTER_SECRET;
  const invalidEncryptionSecret = Boolean(
    encryptionSecret && !/^[a-fA-F0-9]{64}$/.test(encryptionSecret)
  );

  const ready = missing.length === 0 && !invalidEncryptionSecret;

  return NextResponse.json(
    {
      status: ready ? 'ready' : 'not_ready',
      checks: {
        requiredEnvironment: missing.length === 0 ? 'ok' : 'error',
        encryptionSecret: invalidEncryptionSecret ? 'error' : encryptionSecret ? 'ok' : 'missing',
      },
      capabilities: {
        redis: hasRedisConfiguration ? 'configured' : 'disabled',
        backgroundCollection: process.env.REDIS_URL ? 'configured' : 'disabled',
        aiSynthesis: process.env.AI_PROVIDER && process.env.AI_PROVIDER !== 'disabled'
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
