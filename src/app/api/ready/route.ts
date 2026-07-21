import { NextResponse } from 'next/server';

const REQUIRED_ENVIRONMENT = [
  'DATABASE_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'ENCRYPTION_MASTER_SECRET',
] as const;

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
      missing,
      ts: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 }
  );
}
