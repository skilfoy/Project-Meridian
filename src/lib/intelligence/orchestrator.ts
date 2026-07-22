import { db } from '@/lib/db';
import { decryptKey } from '@/lib/crypto';
import { fetchAllFeedsForTheater } from '@/lib/feeds/fetcher';
import { FEED_REGISTRY } from '@/lib/feeds/registry';
import type { AggregatedFeedResult } from '@/types/feeds';
import { analyzeIncidents, type IntelligenceEngineOptions } from './engine';
import { persistAnalysis, type PersistAnalysisResult } from './persistence';
import type { IntelligenceAnalysisResult } from './types';

export interface IntelligenceCollectionInput {
  orgId: string;
  theaterId: string;
  feedIds?: string[];
  persist?: boolean;
  options?: IntelligenceEngineOptions;
}

export interface IntelligenceCollectionResult {
  theaterId: string;
  selectedFeedIds: string[];
  feedResult: AggregatedFeedResult;
  analysis: IntelligenceAnalysisResult;
  persisted?: PersistAnalysisResult;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

async function updateFeedHealth(
  orgId: string,
  feedResult: AggregatedFeedResult,
  enabledOnCreate: Map<string, boolean>
): Promise<void> {
  const fetchedAt = new Date(feedResult.meta.fetchedAt);
  const successfulIds = new Set(feedResult.feedResults.map((result) => result.feedId));
  const errors = new Map(feedResult.errors.map((error) => [error.feedId, error.error]));
  const configuredIds = unique([...successfulIds, ...errors.keys()]);

  await Promise.all(
    configuredIds.map((feedId) =>
      db.feedConfig.upsert({
        where: { orgId_feedId: { orgId, feedId } },
        create: {
          orgId,
          feedId,
          enabled: enabledOnCreate.get(feedId) ?? false,
          lastFetchedAt: successfulIds.has(feedId) ? fetchedAt : undefined,
          lastError: errors.get(feedId),
        },
        update: {
          lastFetchedAt: successfulIds.has(feedId) ? fetchedAt : undefined,
          lastError: errors.get(feedId) ?? null,
        },
      })
    )
  );
}

export async function collectAndAnalyze(
  input: IntelligenceCollectionInput
): Promise<IntelligenceCollectionResult> {
  const { orgId, theaterId } = input;
  const requestedFeedIds = input.feedIds ? unique(input.feedIds) : undefined;
  const knownFeedIds = new Set(FEED_REGISTRY.map((feed) => feed.id));
  const unknownFeedIds = requestedFeedIds?.filter((feedId) => !knownFeedIds.has(feedId)) ?? [];

  if (unknownFeedIds.length > 0) {
    throw new Error(`Unknown feeds: ${unknownFeedIds.join(', ')}`);
  }

  const configs = await db.feedConfig.findMany({ where: { orgId } });
  const configByFeed = new Map(configs.map((config) => [config.feedId, config]));
  const selectedDefinitions = FEED_REGISTRY.filter((definition) => {
    if (requestedFeedIds) return requestedFeedIds.includes(definition.id);
    const config = configByFeed.get(definition.id);
    return config?.enabled ?? definition.defaultEnabled;
  });
  const selectedFeedIds = selectedDefinitions.map((definition) => definition.id);
  const credentialFeedIds = selectedDefinitions
    .filter((definition) => definition.requiresKey)
    .map((definition) => definition.id);

  const storedKeys = credentialFeedIds.length === 0
    ? []
    : await db.apiKey.findMany({
        where: {
          orgId,
          enabled: true,
          provider: { in: credentialFeedIds },
        },
      });

  const apiKeys = new Map<string, string>();
  const credentialErrors: Array<{ feedId: string; error: string }> = [];

  for (const storedKey of storedKeys) {
    try {
      apiKeys.set(storedKey.provider, decryptKey(storedKey.encryptedKey, orgId));
    } catch (error) {
      credentialErrors.push({
        feedId: storedKey.provider,
        error: error instanceof Error ? `Credential unavailable: ${error.message}` : 'Credential unavailable',
      });
    }
  }

  const fetchableFeedIds: string[] = [];
  for (const definition of selectedDefinitions) {
    if (definition.requiresKey && !apiKeys.has(definition.id)) {
      if (!credentialErrors.some((error) => error.feedId === definition.id)) {
        credentialErrors.push({ feedId: definition.id, error: 'Credential required but not configured' });
      }
      continue;
    }
    fetchableFeedIds.push(definition.id);
  }

  const fetched = await fetchAllFeedsForTheater(theaterId, fetchableFeedIds, apiKeys);
  const errors = [...fetched.errors, ...credentialErrors];
  const feedResult: AggregatedFeedResult = {
    ...fetched,
    errors,
    meta: {
      ...fetched.meta,
      totalFeeds: selectedDefinitions.length,
      successfulFeeds: fetched.feedResults.length,
      failedFeeds: errors.length,
    },
  };

  const enabledOnCreate = new Map(
    selectedDefinitions.map((definition) => {
      const existing = configByFeed.get(definition.id);
      const enabled = existing?.enabled ?? (requestedFeedIds ? false : definition.defaultEnabled);
      return [definition.id, enabled] as const;
    })
  );

  await updateFeedHealth(orgId, feedResult, enabledOnCreate);

  const analysis = analyzeIncidents(feedResult.incidents, {
    ...input.options,
    referenceTime: input.options?.referenceTime ?? feedResult.meta.fetchedAt,
    observedAt: input.options?.observedAt ?? feedResult.meta.fetchedAt,
  });

  const persisted = input.persist === false
    ? undefined
    : await persistAnalysis({ orgId, theaterId, analysis, feedResult });

  return {
    theaterId,
    selectedFeedIds,
    feedResult,
    analysis,
    persisted,
  };
}
