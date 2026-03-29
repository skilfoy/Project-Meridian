/**
 * Redis client singleton.
 * Uses Upstash REST client in production (UPSTASH_REDIS_REST_URL set),
 * falls back to ioredis for local development.
 */

let redisClient: RedisClient | null = null;

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { ex?: number }): Promise<unknown>;
  del(key: string): Promise<unknown>;
  ping(): Promise<string>;
}

function createClient(): RedisClient {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    // Use Upstash REST client
    const { Redis } = require('@upstash/redis');
    return new Redis({ url: upstashUrl, token: upstashToken }) as RedisClient;
  }

  // Use ioredis for local dev
  const IORedis = require('ioredis');
  const client = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  return {
    async get(key: string) {
      return client.get(key);
    },
    async set(key: string, value: string, options?: { ex?: number }) {
      if (options?.ex) {
        return client.set(key, value, 'EX', options.ex);
      }
      return client.set(key, value);
    },
    async del(key: string) {
      return client.del(key);
    },
    async ping() {
      return client.ping();
    },
  };
}

export function getRedis(): RedisClient {
  if (!redisClient) {
    redisClient = createClient();
  }
  return redisClient;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await getRedis().get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    await getRedis().set(key, JSON.stringify(value), { ex: ttlSeconds });
  } catch {
    // Non-fatal — cache miss is acceptable
  }
}
