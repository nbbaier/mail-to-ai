/**
 * Rate limiting utilities using Cloudflare KV
 */

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: Date;
}

interface RateLimitData {
	count: number;
	windowStart: number;
}

/**
 * Check rate limit for a sender email
 * Default: 10 emails per hour
 */
export async function checkRateLimit(
	kv: KVNamespace,
	senderEmail: string,
	limit: number = 10,
	windowSeconds: number = 3600,
): Promise<RateLimitResult> {
	const key = `ratelimit:${senderEmail}`;
	const now = Date.now();

	const existing = await kv.get<RateLimitData>(key, "json");

	let count: number;
	let windowStart: number;

	if (existing && now - existing.windowStart < windowSeconds * 1000) {
		count = existing.count + 1;
		windowStart = existing.windowStart;
	} else {
		count = 1;
		windowStart = now;
	}

	await kv.put(
		key,
		JSON.stringify({ count, windowStart }),
		{ expirationTtl: windowSeconds },
	);

	const resetAt = new Date(windowStart + windowSeconds * 1000);

	return {
		allowed: count <= limit,
		remaining: Math.max(0, limit - count),
		resetAt,
	};
}

/**
 * Get cached agent prompt from KV
 */
export async function getCachedAgentPrompt(
	kv: KVNamespace,
	agentAddress: string,
): Promise<string | null> {
	const key = `agent-prompt:${agentAddress}`;
	return kv.get(key);
}

/**
 * Cache agent prompt in KV
 * Default: 7 days TTL
 */
export async function cacheAgentPrompt(
	kv: KVNamespace,
	agentAddress: string,
	prompt: string,
	ttlSeconds: number = 604800,
): Promise<void> {
	const key = `agent-prompt:${agentAddress}`;
	await kv.put(key, prompt, { expirationTtl: ttlSeconds });
}

/**
 * Increment total emails counter for stats
 */
export async function incrementEmailCount(kv: KVNamespace): Promise<number> {
	const key = "stats:total-emails";
	const current = await kv.get<number>(key, "json") || 0;
	const newCount = current + 1;
	await kv.put(key, JSON.stringify(newCount));
	return newCount;
}

interface AgentStats {
	count: number;
	totalTime: number;
}

/**
 * Track agent usage
 */
export async function trackAgentUsage(
	kv: KVNamespace,
	agentType: string,
	processingTimeMs: number,
): Promise<void> {
	const today = new Date().toISOString().split("T")[0];
	const key = `stats:agent:${agentType}:${today}`;

	const existing = await kv.get<AgentStats>(key, "json") || { count: 0, totalTime: 0 };

	const updated: AgentStats = {
		count: existing.count + 1,
		totalTime: existing.totalTime + processingTimeMs,
	};

	await kv.put(key, JSON.stringify(updated), { expirationTtl: 86400 * 30 });
}
