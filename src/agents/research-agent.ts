/**
 * Research Agent - Web research with cited sources using Anthropic's native webSearch tool
 */

import { anthropic } from "@ai-sdk/anthropic";
import { generateText, type Tool } from "ai";
import type { ParsedEmail } from "../types";
import { BaseAgent } from "./base-agent";

export class ResearchAgent extends BaseAgent {
	getSystemPrompt(): string {
		return `You are the Research Agent for the Email Agent Service at ${this.env.ALLOWED_DOMAIN}.

Your role is to help users find accurate, up-to-date information on any topic using web search.

## Guidelines

1. **Proactive Search**: Use web search liberally for any factual, current, or verifiable information. When in doubt, search.

2. **Source Citations**: Always cite your sources using markdown links. Format: [Source Name](URL)

3. **Synthesis Over Listing**: Don't just list search results. Synthesize information into a coherent, helpful response.

4. **Current Information**: Prioritize recent sources for time-sensitive topics (news, prices, events).

5. **Accuracy**: If search results are conflicting or unclear, acknowledge this and present multiple perspectives.

6. **Limitations**: If you cannot find reliable information, say so rather than guessing.

## Response Format

CRITICAL: Your response must contain ONLY the final research report. Do NOT include:
- Your internal thoughts or reasoning process
- Phrases like "I found...", "Let me search...", "I'll look for..."
- Meta-commentary about what you're doing or planning to do

Structure your responses clearly:
- Start with a direct answer when possible
- Provide supporting details and context
- Include source citations inline or at the end
- Note any caveats or limitations

Sign off as "Research Agent"

Today's date is ${new Date().toLocaleDateString()}.`;
	}

	getAgentAddress(): string {
		return `research@${this.env.ALLOWED_DOMAIN}`;
	}

	getAgentName(): string {
		return "Research Agent";
	}

	/**
	 * Override getTools to add web search capability
	 */
	protected getTools(): Record<string, Tool> {
		const webSearchTool = anthropic.tools.webSearch_20250305({
			maxUses: 5,
		});
		return { web_search: webSearchTool };
	}

	/**
	 * Override process to use Sonnet 4.5 and add logging
	 */
	async process(email: ParsedEmail): Promise<string> {
		const startTime = Date.now();
		const tools = this.getTools();
		const content = await this.buildMessageContent(email);

		// Add to conversation history
		this.setState({
			...this.state,
			conversationHistory: [
				...this.state.conversationHistory,
				{ role: "user", content },
			],
			lastProcessedAt: new Date().toISOString(),
		});

		const { text: responseText, toolCalls } = await generateText({
			model: this.anthropic("claude-sonnet-4-5-20250929"),
			maxOutputTokens: 4096,
			system: this.getSystemPrompt(),
			messages: this.state.conversationHistory,
			tools,
		});

		const finalText = responseText || "Sorry, I could not generate a response.";

		// Store assistant response in history
		this.setState({
			...this.state,
			conversationHistory: [
				...this.state.conversationHistory,
				{ role: "assistant", content: finalText },
			],
		});

		// Structured logging
		const searchCount =
			toolCalls?.filter((call) => call.toolName === "web_search").length ?? 0;

		console.log(
			JSON.stringify({
				agent: "ResearchAgent",
				emailId: email.id,
				from: email.from.email,
				searchCount,
				responseTime: Date.now() - startTime,
				timestamp: new Date().toISOString(),
			}),
		);

		return finalText;
	}
}
