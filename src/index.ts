/**
 * Mail-to-AI: Email Agent Service
 *
 * A Cloudflare Workers application that provides AI agents accessible via email.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Redis } from '@upstash/redis';
import { Inbound } from '@inboundemail/sdk';
import { webhook } from './routes/webhook';
import { processEmail } from './services/email-processor';
import { createRedisClient } from './utils/rate-limiter';
import type { Env, QueueMessage } from './types';

// Create Hono app with environment bindings
const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    service: 'mail-to-ai',
    status: 'healthy',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Mount webhook routes
app.route('/webhook', webhook);

// Export the Hono app for Cloudflare Workers
export default {
  /**
   * HTTP request handler
   */
  fetch: app.fetch,

  /**
   * Queue consumer for processing emails asynchronously
   */
  async queue(
    batch: MessageBatch<QueueMessage>,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    // Initialize dependencies
    const redis = createRedisClient(
      env.UPSTASH_REDIS_REST_URL,
      env.UPSTASH_REDIS_REST_TOKEN
    );
    const inbound = new Inbound(env.INBOUND_API_KEY);

    const deps = {
      redis,
      inbound,
      anthropicApiKey: env.ANTHROPIC_API_KEY,
      domain: env.ALLOWED_DOMAIN,
    };

    // Process each message in the batch
    for (const message of batch.messages) {
      const { email, attempt } = message.body;

      console.log(`Processing queued email ${email.id} (attempt ${attempt})`);

      try {
        const result = await processEmail(email, deps);

        if (result.success) {
          // Acknowledge successful processing
          message.ack();
        } else {
          // Retry on failure (up to max_retries in wrangler.toml)
          console.error(`Email ${email.id} failed: ${result.error}`);
          message.retry();
        }
      } catch (error) {
        console.error(`Unexpected error processing email ${email.id}:`, error);
        message.retry();
      }
    }
  },
};
