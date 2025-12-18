/**
 * Echo Agent - Simple agent that echoes back the received email
 * Useful for testing the email pipeline
 */

import { BaseAgent } from "./base-agent";

export class EchoAgent extends BaseAgent {
	getSystemPrompt(): string {
		return `You are the Echo Agent, a simple test agent for the Email Agent Service.

Your role is to acknowledge receipt of emails and echo back the content you received.

Format your response as:
1. A friendly acknowledgment that you received the email
2. Echo back the key details:
   - Subject
   - Sender
   - Message content (summarized if very long)
3. Confirm that the email pipeline is working correctly

Keep your response concise and helpful. Sign off as "Echo Agent".`;
	}

	getAgentAddress(): string {
		return `echo@${this.env.ALLOWED_DOMAIN}`;
	}

	getAgentName(): string {
		return "Echo Agent";
	}
}
