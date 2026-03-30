/**
 * Server-side ONLY — never import in client components.
 * All Claude calls go through this module.
 */
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { cacheGet, cacheSet } from './redis';
import { logger } from './logger';
import type { Theater, TheaterIntel, OrgContext } from '@/types';
import type { NormalizedIncident } from '@/types/feeds';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TheaterIntelSchema = z.object({
  summary: z.string(),
  threatLevel: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
  keyDevelopments: z.array(z.string()),
  watchItems: z.array(z.string()),
});

export async function generateTheaterIntel(
  theater: Theater,
  orgContext: OrgContext,
  recentIncidents?: NormalizedIncident[]
): Promise<TheaterIntel> {
  const cacheKey = `ai:theater-intel:${orgContext.orgId}:${theater.id}`;
  const cached = await cacheGet<TheaterIntel>(cacheKey);
  if (cached) {
    return { ...cached, cachedAt: cached.generatedAt };
  }

  const start = Date.now();
  logger.info('Generating theater intel via Claude', { theaterId: theater.id, orgId: orgContext.orgId });

  const incidentBlock = recentIncidents && recentIncidents.length > 0
    ? '\n\nRecent intelligence (latest 20 incidents from live feeds):\n' +
      recentIncidents.slice(0, 20).map((inc) =>
        `- [${inc.severity}] ${inc.title} — ${inc.source} (${inc.occurredAt.slice(0, 10)})`
      ).join('\n')
    : '';

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a geopolitical intelligence analyst. Provide a structured threat assessment for the following theater of operations.

Theater: ${theater.name} (${theater.shortName})
Description: ${theater.description}
Countries: ${theater.countries.join(', ')}${incidentBlock}

Respond with valid JSON matching this schema exactly:
{
  "summary": "2-3 sentence executive summary of current threat environment",
  "threatLevel": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
  "keyDevelopments": ["up to 5 recent key developments"],
  "watchItems": ["up to 5 items to monitor closely"]
}

Base your assessment on your knowledge of geopolitical events and any recent intelligence provided above. Be specific and actionable.`,
      },
    ],
  });

  const latencyMs = Date.now() - start;
  logger.info('Claude response received', { latencyMs, theaterId: theater.id });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in Claude response');

  const parsed = TheaterIntelSchema.parse(JSON.parse(jsonMatch[0]));
  const result: TheaterIntel = {
    ...parsed,
    theaterId: theater.id,
    generatedAt: new Date().toISOString(),
  };

  await cacheSet(cacheKey, result, 1800); // 30-minute TTL
  return result;
}
