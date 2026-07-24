import pRetry from 'p-retry';
import pLimit from 'p-limit';
import { cacheGet, cacheSet } from '../redis';
import { normalizeItem } from './normalizer';
import { getFeed } from './registry';
import { logger } from '../logger';
import {
  assertCircuitAllowsRequest,
  getCircuitBreakerState,
  recordFeedFailure,
  recordFeedSuccess,
} from './resilience';
import { isCollectableSource } from './capabilities';
import type { FeedParams, FeedResult, AggregatedFeedResult } from '@/types/feeds';

const CACHE_TTL_SEC = 600;
const LAST_KNOWN_GOOD_TTL_SEC = 7 * 24 * 60 * 60;
const RETRYABLE_HTTP_STATUS = new Set([408, 409, 425, 429]);

function cacheKeys(feedId: string, params: FeedParams) {
  const suffix = `${params.theaterId ?? 'global'}:${params.limit ?? 25}`;
  return {
    current: `feed:${feedId}:${suffix}`,
    lastKnownGood: `feed:lkg:${feedId}:${suffix}`,
  };
}

export function shouldRetryFeedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const statusMatch = message.match(/\bHTTP\s+(\d{3})\b/i);

  if (!statusMatch) return true;

  const status = Number(statusMatch[1]);
  if (status >= 500) return true;
  return RETRYABLE_HTTP_STATUS.has(status);
}

async function staleResult(feedId: string, params: FeedParams): Promise<FeedResult | null> {
  const stale = await cacheGet<FeedResult>(cacheKeys(feedId, params).lastKnownGood);
  if (!stale) return null;

  return {
    ...stale,
    meta: {
      ...stale.meta,
      cached: true,
      stale: true,
      circuitBreaker: getCircuitBreakerState(feedId),
    },
  };
}

export async function fetchFeedWithCache(
  feedId: string,
  params: FeedParams,
  apiKey?: string
): Promise<FeedResult> {
  const def = getFeed(feedId);
  if (!def) throw new Error(`Unknown feed: ${feedId}`);
  if (!isCollectableSource(def)) throw new Error(`Feed is planned and not collectable: ${feedId}`);

  const keys = cacheKeys(feedId, params);
  const cached = await cacheGet<FeedResult>(keys.current);
  if (cached) {
    return {
      ...cached,
      meta: {
        ...cached.meta,
        cached: true,
        stale: false,
        circuitBreaker: getCircuitBreakerState(feedId),
      },
    };
  }

  try {
    assertCircuitAllowsRequest(feedId);
  } catch (error) {
    const stale = await staleResult(feedId, params);
    if (stale) return stale;
    throw error;
  }

  const start = Date.now();

  try {
    const raw = await pRetry(() => def.fetch(params, apiKey), {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 8000,
      randomize: true,
      shouldRetry: ({ error }) => shouldRetryFeedError(error),
      onFailedAttempt: (error) => {
        logger.warn('Feed fetch attempt failed', {
          feedId,
          attempt: error.attemptNumber,
          retriesLeft: error.retriesLeft,
          retryable: shouldRetryFeedError(error.error),
          error: error.error instanceof Error ? error.error.message : String(error.error),
        });
      },
    });

    const incidents = raw.items.map((item) => normalizeItem(item, feedId));
    recordFeedSuccess(feedId);

    const result: FeedResult = {
      feedId,
      incidents,
      meta: {
        source: feedId,
        latencyMs: Date.now() - start,
        fetchedAt: new Date().toISOString(),
        cached: false,
        stale: false,
        total: incidents.length,
        circuitBreaker: 'CLOSED',
      },
    };

    await Promise.all([
      cacheSet(keys.current, result, def.refreshIntervalSec ?? CACHE_TTL_SEC),
      cacheSet(keys.lastKnownGood, result, LAST_KNOWN_GOOD_TTL_SEC),
    ]);

    return result;
  } catch (error) {
    const state = recordFeedFailure(feedId);
    logger.error('Feed fetch failed after retries', {
      feedId,
      circuitBreaker: state,
      error: error instanceof Error ? error.message : String(error),
    });

    const stale = await staleResult(feedId, params);
    if (stale) return stale;
    throw error;
  }
}

export async function fetchAllFeedsForTheater(
  theaterId: string,
  enabledFeedIds: string[],
  apiKeys: Map<string, string>
): Promise<AggregatedFeedResult> {
  const limit = pLimit(5);
  const params: FeedParams = { theaterId, limit: 25 };

  const results = await Promise.allSettled(
    enabledFeedIds.map((feedId) =>
      limit(() => fetchFeedWithCache(feedId, params, apiKeys.get(feedId)))
    )
  );

  const feedResults: FeedResult[] = [];
  const errors: Array<{ feedId: string; error: string }> = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      feedResults.push(result.value);
    } else {
      const feedId = enabledFeedIds[index];
      const error = result.reason instanceof Error ? result.reason.message : 'Unknown error';
      errors.push({ feedId, error });
      logger.error('Feed collection unavailable', { feedId, error });
    }
  });

  const incidents = feedResults
    .flatMap((result) => result.incidents)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  return {
    incidents,
    feedResults,
    errors,
    meta: {
      totalFeeds: enabledFeedIds.length,
      successfulFeeds: feedResults.length,
      failedFeeds: errors.length,
      staleFeeds: feedResults.filter((result) => result.meta.stale).length,
      fetchedAt: new Date().toISOString(),
    },
  };
}
