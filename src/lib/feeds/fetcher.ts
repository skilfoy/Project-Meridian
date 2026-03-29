import pRetry from 'p-retry';
import pLimit from 'p-limit';
import { cacheGet, cacheSet } from '../redis';
import { normalizeItem }      from './normalizer';
import { getFeed }            from './registry';
import { logger }             from '../logger';
import type { FeedParams, FeedResult, AggregatedFeedResult } from '@/types/feeds';

const CACHE_TTL_SEC = 600; // 10 minutes default

export async function fetchFeedWithCache(
  feedId: string,
  params: FeedParams,
  apiKey?: string
): Promise<FeedResult> {
  const cacheKey = `feed:${feedId}:${params.theaterId ?? 'global'}:${params.limit ?? 25}`;
  const cached = await cacheGet<FeedResult>(cacheKey);
  if (cached) return { ...cached, meta: { ...cached.meta, cached: true } };

  const def = getFeed(feedId);
  if (!def) throw new Error(`Unknown feed: ${feedId}`);

  const start = Date.now();
  const raw = await pRetry(
    () => def.fetch(params, apiKey),
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 8000,
      onFailedAttempt: (err) => {
        logger.warn('Feed fetch attempt failed', { feedId, attempt: err.attemptNumber, error: String(err) });
      },
    }
  );

  const incidents = raw.items.map((item) => normalizeItem(item, feedId));
  const result: FeedResult = {
    feedId,
    incidents,
    meta: {
      source:     feedId,
      latencyMs:  Date.now() - start,
      fetchedAt:  new Date().toISOString(),
      cached:     false,
      total:      incidents.length,
    },
  };

  await cacheSet(cacheKey, result, def.refreshIntervalSec ?? CACHE_TTL_SEC);
  return result;
}

export async function fetchAllFeedsForTheater(
  theaterId: string,
  enabledFeedIds: string[],
  apiKeys: Map<string, string>
): Promise<AggregatedFeedResult> {
  const limit = pLimit(5); // Max 5 concurrent feed fetches
  const params: FeedParams = { theaterId, limit: 25 };

  const results = await Promise.allSettled(
    enabledFeedIds.map((feedId) =>
      limit(() => fetchFeedWithCache(feedId, params, apiKeys.get(feedId)))
    )
  );

  const feedResults: FeedResult[] = [];
  const errors: Array<{ feedId: string; error: string }> = [];

  results.forEach((r, idx) => {
    if (r.status === 'fulfilled') {
      feedResults.push(r.value);
    } else {
      errors.push({ feedId: enabledFeedIds[idx], error: r.reason?.message ?? 'Unknown error' });
      logger.error('Feed fetch failed', { feedId: enabledFeedIds[idx], error: r.reason?.message });
    }
  });

  const allIncidents = feedResults.flatMap((r) => r.incidents)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  return {
    incidents: allIncidents,
    feedResults,
    errors,
    meta: {
      totalFeeds:      enabledFeedIds.length,
      successfulFeeds: feedResults.length,
      failedFeeds:     errors.length,
      fetchedAt:       new Date().toISOString(),
    },
  };
}
