/**
 * BullMQ feed polling worker.
 * Runs as a separate process: npx tsx src/worker/index.ts
 */
import { Worker, Queue } from 'bullmq';
import IORedis           from 'ioredis';
import { FEED_REGISTRY } from '../lib/feeds/registry';
import { fetchFeedWithCache } from '../lib/feeds/fetcher';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', { maxRetriesPerRequest: null });

const feedQueue = new Queue('feed-refresh', { connection });

// Enqueue all default-enabled feeds on startup
async function scheduleFeeds() {
  for (const feed of FEED_REGISTRY.filter((f) => f.defaultEnabled)) {
    await feedQueue.add(
      feed.id,
      { feedId: feed.id },
      { repeat: { every: feed.refreshIntervalSec * 1000 }, jobId: `repeat:${feed.id}` }
    );
  }
  console.log(`Scheduled ${FEED_REGISTRY.filter((f) => f.defaultEnabled).length} feeds`);
}

const worker = new Worker<{ feedId: string }>(
  'feed-refresh',
  async (job) => {
    console.log(`[worker] Refreshing feed: ${job.data.feedId}`);
    try {
      await fetchFeedWithCache(job.data.feedId, { limit: 50 });
    } catch (err) {
      console.error(`[worker] Feed ${job.data.feedId} failed:`, err);
    }
  },
  { connection, concurrency: 3 }
);

worker.on('completed', (job) => console.log(`[worker] ${job.data.feedId} refreshed`));
worker.on('failed',    (job, err) => console.error(`[worker] ${job?.data.feedId} error:`, err.message));

scheduleFeeds().catch(console.error);
