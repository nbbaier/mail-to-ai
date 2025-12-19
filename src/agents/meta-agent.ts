/**
 * Meta Agent - Dynamically creates agent behavior from email address
 *
 * Interprets arbitrary email addresses as task instructions.
 * e.g., "write-haiku-about-cats@domain.com" creates an agent that writes haikus about cats
 */

import { generateText } from "ai";
import type { ParsedEmail } from "../types";
import {
	cacheAgentPrompt,
	getBlockedResponseMessage,
	getCachedAgentPrompt,
	validateRequest,
} from "../utils";
import { BaseAgent } from "./base-agent";

export class MetaAgent extends BaseAgent {
	/**
	 * Cache for the generated system prompt (per instance)
	 */
	private cachedInstruction = "";
	private cachedSystemPrompt = "";

	/**
	 * The address that triggered this meta-agent instance
	 * Will be set during processing
	 */
	private currentAddress = "";

	/**
	 * Parse email address to human-readable instruction
	 * "write-haiku-about-cats" -> "write haiku about cats"
	 * "writeHaikuAboutCats" -> "write haiku about cats"
	 * "write_haiku_about_cats" -> "write haiku about cats"
	 */
	private parseAddressToInstruction(address: string): string {
		// Extract local part (before @)
		const localPart = address.split("@")[0];

		// Handle camelCase by inserting space before uppercase letters
		let instruction = localPart.replace(/([a-z])([A-Z])/g, "$1 $2");

		// Replace hyphens and underscores with spaces
		instruction = instruction.replace(/[-_]+/g, " ").trim();

		// Lowercase the entire instruction
		instruction = instruction.toLowerCase();

		return instruction;
	}

	/**
	 * Generate a system prompt from the instruction using Claude
	 */
	private async generateSystemPromptFromInstruction(
		instruction: string,
	): Promise<string> {
		const { text } = await generateText({
			model: this.anthropic("claude-haiku-4-5"),
			maxOutputTokens: 1024,
			system: `You are a prompt engineer. Your task is to create a system prompt for an AI assistant based on a short instruction.

The instruction describes what the AI assistant should do when receiving emails. Create a clear, focused system prompt that:
1. Defines the assistant's role based on the instruction
2. Provides clear guidelines for responding to emails
3. Maintains a helpful and professional tone
4. Is specific to the task without being overly restrictive

Output ONLY the system prompt text, nothing else. Do not include any explanations or metadata.`,
			messages: [
				{
					role: "user",
					content: `Create a system prompt for an AI email assistant with this instruction: "${instruction}"`,
				},
			],
		});

		return (
			text ||
			`You are a helpful AI assistant. Your task is to: ${instruction}. Respond to emails professionally and helpfully.`
		);
	}

	/**
	 * Get the system prompt - either from cache or generate new
	 */
	getSystemPrompt(): string {
		// Return cached prompt if available
		if (this.cachedSystemPrompt) {
			return this.cachedSystemPrompt;
		}

		// Fallback for when prompt hasn't been generated yet
		return `You are a helpful AI assistant. Respond to emails professionally and helpfully.`;
	}

	getAgentAddress(): string {
		// Use the original address that created this agent
		return this.currentAddress || `agent@${this.env.ALLOWED_DOMAIN}`;
	}

	getAgentName(): string {
		if (this.cachedInstruction) {
			// Capitalize first letter of instruction for display name
			const name = this.cachedInstruction;
			return name.charAt(0).toUpperCase() + name.slice(1) + " Agent";
		}
		return "Meta Agent";
	}

	/**
	 * Override process to handle dynamic prompt generation
	 */
	async process(email: ParsedEmail): Promise<string> {
		const startTime = Date.now();

		// Set the current address for this request
		this.currentAddress = email.to;

		// Safety validation - check address and body for blocked content
		const safetyResult = validateRequest(email.to, email.body);
		if (!safetyResult.safe) {
			console.log(
				JSON.stringify({
					agent: "MetaAgent",
					blocked: true,
					reason: safetyResult.reason,
					emailId: email.id,
					from: email.from.email,
					timestamp: new Date().toISOString(),
				}),
			);
			return getBlockedResponseMessage(
				safetyResult.reason || "Safety check failed",
			);
		}

		// Parse the instruction from the email address
		const instruction = this.parseAddressToInstruction(email.to);

		// Check cache: first in-memory, then KV
		let promptCached = false;
		let kvCached = false;

		if (
			this.cachedInstruction === instruction &&
			this.cachedSystemPrompt !== ""
		) {
			// Already have it in memory
			promptCached = true;
		} else {
			// Check KV cache
			const kvPrompt = await getCachedAgentPrompt(this.env.CACHE_KV, email.to);
			if (kvPrompt) {
				this.cachedInstruction = instruction;
				this.cachedSystemPrompt = kvPrompt;
				promptCached = true;
				kvCached = true;
				console.log(
					`MetaAgent: Loaded prompt from KV cache for "${instruction}"`,
				);
			}
		}

		if (!promptCached) {
			console.log(
				`MetaAgent: Generating prompt for instruction: "${instruction}"`,
			);

			const generatedPrompt =
				await this.generateSystemPromptFromInstruction(instruction);

			this.cachedInstruction = instruction;
			this.cachedSystemPrompt = generatedPrompt;

			// Cache in KV for future requests (7-day TTL)
			await cacheAgentPrompt(this.env.CACHE_KV, email.to, generatedPrompt);

			console.log(
				`MetaAgent: Generated and cached prompt (${generatedPrompt.length} chars)`,
			);
		}

		// Build the user message
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

		// Generate response using the dynamic system prompt
		const { text: responseText } = await generateText({
			model: this.anthropic("claude-sonnet-4-20250514"),
			maxOutputTokens: 4096,
			system: this.cachedSystemPrompt,
			messages: this.state.conversationHistory.map((msg) => ({
				role: msg.role,
				content: msg.content,
			})),
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
		console.log(
			JSON.stringify({
				agent: "MetaAgent",
				instruction,
				emailId: email.id,
				from: email.from.email,
				promptCached,
				cacheSource: promptCached ? (kvCached ? "kv" : "memory") : "generated",
				responseTime: Date.now() - startTime,
				timestamp: new Date().toISOString(),
			}),
		);

		return finalText;
	}
}
