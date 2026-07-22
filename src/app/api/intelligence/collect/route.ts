import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { collectAndAnalyze } from '@/lib/intelligence/orchestrator';

const OptionsSchema = z.object({
  referenceTime: z.string().datetime().optional(),
  observedAt: z.string().datetime().optional(),
  sourceReliability: z.record(z.string(), z.number().min(0).max(1)).optional(),
  minimumIndependentSources: z.number().int().min(1).max(20).optional(),
  convergenceWindowHours: z.number().positive().max(24 * 30).optional(),
  geographicPrecisionDegrees: z.number().positive().max(30).optional(),
  recentWindowHours: z.number().positive().max(24 * 30).optional(),
  baselineWindowHours: z.number().positive().max(24 * 365).optional(),
  velocityRatioThreshold: z.number().positive().max(100).optional(),
  topicSimilarityThreshold: z.number().min(0).max(1).optional(),
}).optional();

const RequestSchema = z.object({
  theaterId: z.string().min(1).max(100),
  feedIds: z.array(z.string().min(1)).max(100).optional(),
  persist: z.boolean().default(true),
  options: OptionsSchema,
});

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid collection request',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  try {
    const result = await collectAndAnalyze({
      orgId: auth.orgId,
      theaterId: parsed.data.theaterId,
      feedIds: parsed.data.feedIds,
      persist: parsed.data.persist,
      options: parsed.data.options,
    });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Meridian-Method-Version': result.analysis.methodVersion,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Collection and analysis failed';
    const status = message.startsWith('Unknown feeds:') ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
