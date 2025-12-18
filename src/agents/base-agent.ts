/**
 * Base agent class for all email agents using Cloudflare Agents SDK
 */

import { Agent } from "agents";
import Anthropic from "@anthropic-ai/sdk";
import type { AgentResult, EmailReply, ParsedEmail, Env } from "../types";

/**
 * State stored in each agent instance
 */
export interface EmailAgentState {
	conversationHistory: Array<{
		role: "user" | "assistant";
		content: string;
	}>;
	lastProcessedAt?: string;
}

/**
 * Base class for email agents using Cloudflare Agents SDK
 */
export abstract class BaseAgent extends Agent<Env, EmailAgentState> {
	initialState: EmailAgentState = {
		conversationHistory: [],
	};

	/**
	 * Each agent must implement its system prompt
	 */
	abstract getSystemPrompt(): string;

	/**
	 * Get the agent's email address for replies
	 */
	abstract getAgentAddress(): string;

	/**
	 * Get the agent's display name
	 */
	getAgentName(): string {
		return "AI Agent";
	}

	/**
	 * Override for agents that need tools (web search, etc.)
	 */
	protected getTools(): Anthropic.Tool[] {
		return [];
	}

	/**
	 * Build the user message from the email
	 */
	protected buildUserMessage(email: ParsedEmail): string {
		return `Subject: ${email.subject}

From: ${email.from.name || email.from.email} <${email.from.email}>

Message:
${email.body}`.trim();
	}

	/**
	 * Handle HTTP requests to the agent
	 */
	async onRequest(request: Request): Promise<Response> {
		if (request.method === "POST") {
			try {
				const { email } = (await request.json()) as { email: ParsedEmail };
				const result = await this.generateReply(email);
				return new Response(JSON.stringify(result), {
					headers: { "Content-Type": "application/json" },
				});
			} catch (error) {
				return new Response(
					JSON.stringify({
						success: false,
						error: error instanceof Error ? error.message : "Unknown error",
					}),
					{
						status: 500,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
		}

		return new Response(JSON.stringify({ agent: this.getAgentName() }), {
			headers: { "Content-Type": "application/json" },
		});
	}

	/**
	 * Process the email and generate a response
	 */
	async process(email: ParsedEmail): Promise<string> {
		const anthropic = new Anthropic({ apiKey: this.env.ANTHROPIC_API_KEY });
		const tools = this.getTools();
		const userMessage = this.buildUserMessage(email);

		// Add to conversation history
		this.setState({
			...this.state,
			conversationHistory: [
				...this.state.conversationHistory,
				{ role: "user", content: userMessage },
			],
			lastProcessedAt: new Date().toISOString(),
		});

		const response = await anthropic.messages.create({
			model: "claude-sonnet-4-20250514",
			max_tokens: 4096,
			system: this.getSystemPrompt(),
			messages: this.state.conversationHistory.map((msg) => ({
				role: msg.role,
				content: msg.content,
			})),
			...(tools.length > 0 && { tools }),
		});

		// Extract text from response
		const textBlock = response.content.find((block) => block.type === "text");
		const responseText =
			textBlock?.text || "Sorry, I could not generate a response.";

		// Store assistant response in history
		this.setState({
			...this.state,
			conversationHistory: [
				...this.state.conversationHistory,
				{ role: "assistant", content: responseText },
			],
		});

		return responseText;
	}

	/**
	 * Generate the full email reply
	 */
	async generateReply(email: ParsedEmail): Promise<AgentResult> {
		try {
			const responseBody = await this.process(email);
			const domain = this.env.ALLOWED_DOMAIN;

			const reply: EmailReply = {
				to: email.from.email,
				from: `${this.getAgentName()} <${this.getAgentAddress().replace("DOMAIN", domain)}>`,
				subject: email.subject.startsWith("Re:")
					? email.subject
					: `Re: ${email.subject}`,
				body: responseBody,
				html: this.formatAsHtml(responseBody),
				inReplyTo: email.messageId,
				references: [...email.references, email.messageId],
			};

			return { success: true, reply };
		} catch (error) {
			console.error(`Agent ${this.constructor.name} failed:`, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Convert plain text response to HTML
	 */
	protected formatAsHtml(text: string): string {
		// Convert markdown-style formatting
		const html = text
			// Code blocks
			.replace(/```(\w*)\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
			// Inline code
			.replace(/`([^`]+)`/g, "<code>$1</code>")
			// Bold
			.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
			// Italic
			.replace(/\*([^*]+)\*/g, "<em>$1</em>")
			// Links
			.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

		// Convert paragraphs
		const paragraphs = html.split("\n\n");
		const htmlParagraphs = paragraphs.map((p) => {
			// Don't wrap pre blocks in paragraphs
			if (p.includes("<pre>")) return p;
			return `<p>${p.replace(/\n/g, "<br>")}</p>`;
		});

		return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
    }
    p { margin: 1em 0; }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', monospace;
    }
    pre {
      background: #f4f4f4;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
    }
    pre code { background: none; padding: 0; }
    a { color: #0066cc; }
  </style>
</head>
<body>
  ${htmlParagraphs.join("\n  ")}

  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ddd;">
  <p style="color: #666; font-size: 0.9em;">
    This email was generated by an AI agent. Reply to continue the conversation.
  </p>
</body>
</html>`.trim();
	}
}
