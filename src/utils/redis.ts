import type Redis from 'ioredis';

export const REDIS_URL = process.env.REDIS_URL ?? null;
export const REDIS_ENABLED = Boolean(REDIS_URL);

let redisClient: Redis | null = null;

export async function getRedisClient(): Promise<Redis | null> {
  if (!REDIS_URL) return null;
  if (redisClient) return redisClient;

  const { default: RedisClient } = await import('ioredis');
  redisClient = new RedisClient(REDIS_URL);
  return redisClient;
}

export async function pingRedis(): Promise<string | null> {
  const client = await getRedisClient();
  if (!client) return null;
  return client.ping();
}
