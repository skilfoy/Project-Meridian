import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeIncidents } from '@/lib/intelligence/engine';

const SeveritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']);

const IncidentSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  sourceId: z.string().optional(),
  title: z.string().min(1),
  summary: z.string().optional(),
  url: z.string().url().optional(),
  severity: SeveritySchema,
  domain: z.string().min(1),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  occurredAt: z.string().datetime(),
  tags: z.array(z.string()).default([]),
});

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
  incidents: z.array(IncidentSchema).max(5000),
  options: OptionsSchema,
});

export async function POST(req: Request) {
  let userId: string | null = null;

  try {
    ({ userId } = await auth());
  } catch {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!userId && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid intelligence analysis request',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  try {
    const analysis = analyzeIncidents(parsed.data.incidents, parsed.data.options);
    return NextResponse.json(analysis, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Meridian-Method-Version': analysis.methodVersion,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Intelligence analysis failed';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
