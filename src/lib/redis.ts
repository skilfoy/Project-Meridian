/**
 * Redis client singleton.
 * Uses Upstash REST when configured, ioredis when REDIS_URL is configured,
 * and an explicit no-op client when Redis is disabled.
 */

let redisClient: RedisClient | null = null;

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { ex?: number }): Promise<unknown>;
  del(key: string): Promise<unknown>;
  ping(): Promise<string>;
}

const disabledRedisClient: RedisClient = {
  async get() {
    return null;
  },
  async set() {
    return 0;
  },
  async del() {
    return 0;
  },
  async ping() {
    return 'DISABLED';
  },
};

function createClient(): RedisClient {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    const { Redis } = require('@upstash/redis');
    return new Redis({ url: upstashUrl, token: upstashToken }) as RedisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return disabledRedisClient;
  }

  const IORedis = require('ioredis');
  const client = new IORedis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  client.on('error', () => {
    // Callers treat Redis as optional and degrade to cache misses.
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
    // Non-fatal: cache misses remain acceptable when Redis is unavailable.
  }
}
