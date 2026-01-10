/**
 * Base agent class for all email agents using Cloudflare Agents SDK
 */

import { type AnthropicProvider, createAnthropic } from "@ai-sdk/anthropic";
import { Agent } from "agents";
import {
	type FilePart,
	generateText,
	type ImagePart,
	type ModelMessage,
	type TextPart,
	type Tool,
} from "ai";
import { marked } from "marked";
import type { AgentResult, EmailReply, Env, ParsedEmail } from "../types";

/**
 * State stored in each agent instance
 */
export interface EmailAgentState {
	conversationHistory: ModelMessage[];
	lastProcessedAt?: string;
}

/**
 * Base class for email agents using Cloudflare Agents SDK
 */
export abstract class BaseAgent extends Agent<Env, EmailAgentState> {
	initialState: EmailAgentState = {
		conversationHistory: [],
	};

	protected get anthropic(): AnthropicProvider {
		return createAnthropic({
			apiKey: this.env.ANTHROPIC_API_KEY,
		});
	}

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
	protected getTools(): Record<string, Tool> {
		return {};
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

		const { text: responseText } = await generateText({
			model: this.anthropic("claude-haiku-4-5"),
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

		return finalText;
	}

	/**
	 * Build the content array for the user message, including text and attachments
	 */
	protected async buildMessageContent(
		email: ParsedEmail,
	): Promise<Array<TextPart | ImagePart | FilePart>> {
		const userMessageText = this.buildUserMessage(email);
		const content: Array<TextPart | ImagePart | FilePart> = [
			{ type: "text", text: userMessageText },
		];

		if (email.attachments && email.attachments.length > 0) {
			for (const attachment of email.attachments) {
				if (attachment.url) {
					try {
						// Fetch attachment content
						const response = await fetch(attachment.url);
						if (!response.ok) {
							console.error(
								`Failed to fetch attachment from ${attachment.url}: ${response.statusText}`,
							);
							continue;
						}

						const arrayBuffer = await response.arrayBuffer();
						const data = new Uint8Array(arrayBuffer);

						if (attachment.contentType.startsWith("image/")) {
							content.push({
								type: "image",
								image: data,
							});
						} else {
							content.push({
								type: "file",
								data,
								mediaType: attachment.contentType,
							});
						}
					} catch (error) {
						console.error(
							`Error processing attachment ${attachment.filename}:`,
							error,
						);
					}
				}
			}
		}

		return content;
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
		const html = marked(text, {
			breaks: true,
			gfm: true, // GitHub Flavored Markdown (includes checklists)
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
    h1 { font-size: 1.5em; margin: 1.2em 0 0.6em; }
    h2 { font-size: 1.3em; margin: 1.1em 0 0.5em; }
    h3 { font-size: 1.1em; margin: 1em 0 0.4em; }
    ul { margin: 0.5em 0; padding-left: 1.5em; }
    li { margin: 0.3em 0; }
    hr { margin: 1.5em 0; border: none; border-top: 1px solid #ddd; }
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
    input[type="checkbox"] { margin-right: 0.5em; }
  </style>
</head>
<body>
  ${html}

  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ddd;">
  <p style="color: #666; font-size: 0.9em;">
    This email was generated by an AI agent. Reply to continue the conversation.
  </p>
</body>
</html>`.trim();
	}
}
