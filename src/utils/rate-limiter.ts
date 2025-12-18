/**
 * Rate limiting utilities using Upstash Redis
 */

import { Redis } from '@upstash/redis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Create a Redis client from environment variables
 */
export function createRedisClient(url: string, token: string): Redis {
  return new Redis({
    url,
    token,
  });
}

/**
 * Check rate limit for a sender email
 * Default: 10 emails per hour
 */
export async function checkRateLimit(
  redis: Redis,
  senderEmail: string,
  limit: number = 10,
  windowSeconds: number = 3600
): Promise<RateLimitResult> {
  const key = `ratelimit:${senderEmail}`;
  const now = Date.now();

  // Use Redis pipeline for atomic operations
  const pipeline = redis.pipeline();

  // Increment counter
  pipeline.incr(key);
  // Get TTL to know when it resets
  pipeline.ttl(key);

  const results = await pipeline.exec<[number, number]>();
  const current = results[0];
  const ttl = results[1];

  // If this is the first request, set expiry
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  const resetAt = new Date(now + (ttl > 0 ? ttl * 1000 : windowSeconds * 1000));

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    resetAt,
  };
}

/**
 * Get cached agent prompt from Redis
 */
export async function getCachedAgentPrompt(
  redis: Redis,
  agentAddress: string
): Promise<string | null> {
  const key = `agent-prompt:${agentAddress}`;
  return redis.get<string>(key);
}

/**
 * Cache agent prompt in Redis
 * Default: 7 days TTL
 */
export async function cacheAgentPrompt(
  redis: Redis,
  agentAddress: string,
  prompt: string,
  ttlSeconds: number = 604800 // 7 days
): Promise<void> {
  const key = `agent-prompt:${agentAddress}`;
  await redis.setex(key, ttlSeconds, prompt);
}

/**
 * Increment total emails counter for stats
 */
export async function incrementEmailCount(redis: Redis): Promise<number> {
  return redis.incr('stats:total-emails');
}

/**
 * Track agent usage
 */
export async function trackAgentUsage(
  redis: Redis,
  agentType: string,
  processingTimeMs: number
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const key = `stats:agent:${agentType}:${today}`;

  // Increment count and add to processing time
  const pipeline = redis.pipeline();
  pipeline.hincrby(key, 'count', 1);
  pipeline.hincrbyfloat(key, 'totalTime', processingTimeMs);
  pipeline.expire(key, 86400 * 30); // Keep for 30 days

  await pipeline.exec();
}
