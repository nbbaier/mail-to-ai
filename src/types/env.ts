/**
 * Cloudflare Workers environment bindings
 */

export interface Env {
  // Queue bindings
  EMAIL_QUEUE: Queue<QueueMessage>;
  EMAIL_DLQ: Queue<QueueMessage>;

  // Durable Object bindings for Agents SDK
  ECHO_AGENT: DurableObjectNamespace;
  INFO_AGENT: DurableObjectNamespace;

  // Environment variables (set in wrangler.toml)
  ALLOWED_DOMAIN: string;

  // Secrets (set via `wrangler secret put`)
  INBOUND_API_KEY: string;
  INBOUND_WEBHOOK_SECRET: string;
  ANTHROPIC_API_KEY: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
}

import type { QueueMessage } from './email';
