/**
 * Email processor - handles the full email processing pipeline
 */

import type { Redis } from '@upstash/redis';
import type { Inbound } from '@inboundemail/sdk';
import type { ParsedEmail } from '../types';
import { routeToAgent } from './agent-router';
import { sendEmailReply, sendErrorEmail, sendRateLimitEmail } from './email-sender';
import {
  checkRateLimit,
  incrementEmailCount,
  trackAgentUsage,
} from '../utils/rate-limiter';
import { extractAgentName } from '../utils/email-parser';

export interface ProcessorDependencies {
  redis: Redis;
  inbound: Inbound;
  anthropicApiKey: string;
  domain: string;
}

/**
 * Process a single email through the agent pipeline
 */
export async function processEmail(
  email: ParsedEmail,
  deps: ProcessorDependencies
): Promise<{ success: boolean; error?: string }> {
  const startTime = Date.now();
  const agentName = extractAgentName(email.to);

  console.log(`Processing email ${email.id} for agent: ${agentName}`);

  try {
    // 1. Check rate limit
    const rateLimit = await checkRateLimit(deps.redis, email.from.email);
    if (!rateLimit.allowed) {
      console.log(`Rate limit exceeded for ${email.from.email}`);
      await sendRateLimitEmail(
        deps.inbound,
        email.from.email,
        email.subject,
        email.messageId,
        rateLimit.resetAt,
        `noreply@${deps.domain}`
      );
      return { success: true }; // Successfully handled (just rate limited)
    }

    // 2. Route to appropriate agent
    const agent = routeToAgent(email, deps.anthropicApiKey, deps.domain);

    // 3. Generate response
    const result = await agent.generateReply();

    if (!result.success || !result.reply) {
      throw new Error(result.error || 'Agent failed to generate reply');
    }

    // 4. Send email reply
    const sendResult = await sendEmailReply(deps.inbound, result.reply);
    if (!sendResult.success) {
      throw new Error(sendResult.error || 'Failed to send email');
    }

    // 5. Track metrics
    const processingTime = Date.now() - startTime;
    await Promise.all([
      incrementEmailCount(deps.redis),
      trackAgentUsage(deps.redis, agentName, processingTime),
    ]);

    console.log(
      `Email ${email.id} processed successfully in ${processingTime}ms by ${agent.constructor.name}`
    );

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to process email ${email.id}:`, error);

    // Try to send error email to user
    try {
      await sendErrorEmail(
        deps.inbound,
        email.from.email,
        email.subject,
        email.messageId,
        'We encountered a technical issue processing your request. Please try again.',
        `noreply@${deps.domain}`
      );
    } catch (sendError) {
      console.error('Failed to send error email:', sendError);
    }

    return { success: false, error: errorMessage };
  }
}
