import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateTheaterIntel, getAIConfigurationStatus } from '@/lib/ai';
import { getTheater } from '@/lib/theaters';
import type { OrgContext } from '@/types';

const BodySchema = z.object({
  theaterId: z.string().min(1),
  incidents: z.array(z.object({
    id: z.string(),
    source: z.string(),
    title: z.string(),
    severity: z.string(),
    domain: z.string(),
    occurredAt: z.string(),
    tags: z.array(z.string()),
  })).optional(),
});

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const theater = getTheater(parsed.data.theaterId);
  if (!theater) return NextResponse.json({ error: 'Unknown theater' }, { status: 404 });

  const orgContext: OrgContext = {
    orgId: orgId ?? userId,
    userId,
    plan: 'FREE',
    role: 'ANALYST',
  };

  try {
    const intel = await generateTheaterIntel(
      theater,
      orgContext,
      parsed.data.incidents as Parameters<typeof generateTheaterIntel>[2]
    );

    return NextResponse.json({
      ...intel,
      generation: getAIConfigurationStatus(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Assessment generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
