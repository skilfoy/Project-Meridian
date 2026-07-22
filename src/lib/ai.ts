/**
 * Server-side only. Meridian can run with AI disabled.
 *
 * When enabled, the provider must expose an OpenAI-compatible
 * /chat/completions endpoint. This supports OpenAI, OpenRouter,
 * and local Ollama deployments without coupling Meridian to one vendor.
 */
import { z } from 'zod';
import { cacheGet, cacheSet } from './redis';
import { logger } from './logger';
import type { Severity, Theater, TheaterIntel, OrgContext } from '@/types';
import type { NormalizedIncident } from '@/types/feeds';

const TheaterIntelSchema = z.object({
  summary: z.string(),
  threatLevel: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
  keyDevelopments: z.array(z.string()),
  watchItems: z.array(z.string()),
});

const ProviderSchema = z.enum(['disabled', 'openai', 'openrouter', 'ollama']);
type AIProvider = z.infer<typeof ProviderSchema>;

interface AIConfiguration {
  provider: AIProvider;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
}

function getAIConfiguration(): AIConfiguration {
  const parsedProvider = ProviderSchema.safeParse(
    (process.env.AI_PROVIDER ?? 'disabled').toLowerCase()
  );
  const provider = parsedProvider.success ? parsedProvider.data : 'disabled';

  const defaultBaseUrls: Partial<Record<AIProvider, string>> = {
    openai: 'https://api.openai.com/v1',
    openrouter: 'https://openrouter.ai/api/v1',
    ollama: 'http://127.0.0.1:11434/v1',
  };

  return {
    provider,
    baseUrl: process.env.AI_API_BASE_URL || defaultBaseUrls[provider],
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL,
  };
}

export function getAIConfigurationStatus() {
  const config = getAIConfiguration();
  const enabled = config.provider !== 'disabled';
  const missing: string[] = [];

  if (enabled && !config.model) missing.push('AI_MODEL');
  if (enabled && !config.baseUrl) missing.push('AI_API_BASE_URL');
  if ((config.provider === 'openai' || config.provider === 'openrouter') && !config.apiKey) {
    missing.push('AI_API_KEY');
  }

  return {
    provider: config.provider,
    enabled,
    configured: missing.length === 0,
    missing,
  };
}

function buildDeterministicAssessment(
  theater: Theater,
  recentIncidents: NormalizedIncident[] = []
): TheaterIntel {
  const severityRank: Record<Severity, number> = {
    CRITICAL: 5,
    HIGH: 4,
    MEDIUM: 3,
    LOW: 2,
    INFO: 1,
  };

  const sorted = [...recentIncidents].sort(
    (a, b) => (severityRank[b.severity as Severity] ?? 0) - (severityRank[a.severity as Severity] ?? 0)
  );
  const threatLevel = (sorted[0]?.severity as Severity | undefined) ?? 'INFO';
  const sourceCount = new Set(recentIncidents.map((incident) => incident.source)).size;

  return {
    theaterId: theater.id,
    summary: recentIncidents.length > 0
      ? `${recentIncidents.length} recent incidents from ${sourceCount} source${sourceCount === 1 ? '' : 's'} are associated with ${theater.name}. This assessment reflects collected evidence only and uses the highest observed incident severity as the current threat level.`
      : `No recent collected incidents are available for ${theater.name}. Meridian is operating in evidence-only mode and cannot infer conditions beyond available collection.`,
    threatLevel,
    keyDevelopments: sorted.slice(0, 5).map((incident) =>
      `[${incident.severity}] ${incident.title} (${incident.source})`
    ),
    watchItems: recentIncidents.length > 0
      ? [
          'Monitor for independent-source corroboration of the highest-severity incidents.',
          'Review collection freshness and geographic coverage before escalation.',
          'Track material changes in incident velocity, severity, and affected entities.',
        ]
      : [
          'Restore or expand collection coverage for this theater.',
          'Verify source freshness before drawing an operational conclusion.',
        ],
    generatedAt: new Date().toISOString(),
  };
}

async function generateWithConfiguredProvider(
  theater: Theater,
  recentIncidents: NormalizedIncident[]
): Promise<z.infer<typeof TheaterIntelSchema>> {
  const config = getAIConfiguration();
  const status = getAIConfigurationStatus();

  if (!status.enabled) {
    throw new Error('AI provider is disabled');
  }
  if (!status.configured || !config.baseUrl || !config.model) {
    throw new Error(`AI provider configuration is incomplete: ${status.missing.join(', ')}`);
  }

  const incidentBlock = recentIncidents.length > 0
    ? recentIncidents.slice(0, 20).map((incident) =>
        `- [${incident.severity}] ${incident.title} | source=${incident.source} | occurred=${incident.occurredAt.slice(0, 10)}`
      ).join('\n')
    : 'No recent incidents were provided.';

  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an evidence-bound strategic intelligence analyst. Use only the supplied incident evidence. Distinguish missing collection from low risk. Return valid JSON only.',
        },
        {
          role: 'user',
          content: `Prepare a structured threat assessment for this theater.\n\nTheater: ${theater.name} (${theater.shortName})\nDescription: ${theater.description}\nCountries: ${theater.countries.join(', ')}\n\nCollected incidents:\n${incidentBlock}\n\nReturn this exact JSON shape:\n{\n  "summary": "2-3 sentence evidence-based executive summary",\n  "threatLevel": "CRITICAL|HIGH|MEDIUM|LOW|INFO",\n  "keyDevelopments": ["up to 5 evidence-supported developments"],\n  "watchItems": ["up to 5 collection or monitoring priorities"]\n}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`AI provider returned HTTP ${response.status}${errorText ? `: ${errorText.slice(0, 300)}` : ''}`);
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = payload.choices?.[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI provider returned no JSON object');

  return TheaterIntelSchema.parse(JSON.parse(jsonMatch[0]));
}

export async function generateTheaterIntel(
  theater: Theater,
  orgContext: OrgContext,
  recentIncidents: NormalizedIncident[] = []
): Promise<TheaterIntel> {
  const status = getAIConfigurationStatus();
  const cacheKey = `ai:theater-intel:${status.provider}:${orgContext.orgId}:${theater.id}`;
  const cached = await cacheGet<TheaterIntel>(cacheKey);
  if (cached) return { ...cached, cachedAt: cached.generatedAt };

  if (!status.enabled) {
    return buildDeterministicAssessment(theater, recentIncidents);
  }

  const start = Date.now();
  logger.info('Generating theater intelligence assessment', {
    theaterId: theater.id,
    orgId: orgContext.orgId,
    provider: status.provider,
  });

  try {
    const generated = await generateWithConfiguredProvider(theater, recentIncidents);
    const result: TheaterIntel = {
      ...generated,
      theaterId: theater.id,
      generatedAt: new Date().toISOString(),
    };

    await cacheSet(cacheKey, result, 1800);
    logger.info('AI assessment received', {
      latencyMs: Date.now() - start,
      theaterId: theater.id,
      provider: status.provider,
    });
    return result;
  } catch (error) {
    logger.warn('AI assessment failed; returning deterministic evidence assessment', {
      theaterId: theater.id,
      provider: status.provider,
      error: error instanceof Error ? error.message : String(error),
    });
    return buildDeterministicAssessment(theater, recentIncidents);
  }
}
