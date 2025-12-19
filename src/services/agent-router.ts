/**
 * Agent router - maps email addresses to the appropriate agent via Durable Objects
 */

import { type AgentNamespace, getAgentByName } from "agents";
import type { BaseAgent } from "../agents/base-agent";
import type { AgentResult, Env, ParsedEmail } from "../types";
import { extractAgentName } from "../utils/email-parser";

/**
 * Registry mapping agent names to their DO binding keys
 */
const AGENT_REGISTRY: Map<
	string,
	keyof Pick<
		Env,
		| "ECHO_AGENT"
		| "INFO_AGENT"
		| "META_AGENT"
		| "RESEARCH_AGENT"
		| "SUMMARIZE_AGENT"
	>
> = new Map([
	["echo", "ECHO_AGENT"],
	["info", "INFO_AGENT"],
	["research", "RESEARCH_AGENT"],
	["summarize", "SUMMARIZE_AGENT"],
]);

/**
 * Route an email to the appropriate agent and process it
 */
export async function routeToAgent(
	email: ParsedEmail,
	env: Env,
): Promise<AgentResult> {
	const agentName = extractAgentName(email.to);

	// Determine which DO binding to use
	let bindingKey = AGENT_REGISTRY.get(agentName);
	if (!bindingKey) {
		// Unknown agent address - use MetaAgent to interpret it dynamically
		console.log(`Unknown agent "${agentName}", using MetaAgent to interpret`);
		bindingKey = "META_AGENT";
	} else {
		console.log(`Routing to agent: ${agentName}`);
	}

	// Get the Durable Object namespace and use getAgentByName for proper routing
	const namespace = env[bindingKey] as unknown as AgentNamespace<BaseAgent>;

	// Use email thread ID or sender as the instance ID for conversation continuity
	const instanceId = email.threadId || email.from.email;
	const agent = await getAgentByName(namespace, instanceId);

	// Send the email to the agent for processing
	const request = new Request("https://agent/process", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email }),
	});
	const response = await agent.fetch(request);

	if (!response.ok) {
		const error = await response.text();
		return { success: false, error };
	}

	return (await response.json()) as AgentResult;
}

/**
 * Check if an agent address is a built-in agent
 */
export function isBuiltInAgent(agentName: string): boolean {
	return AGENT_REGISTRY.has(agentName.toLowerCase());
}

/**
 * Get list of all built-in agent names
 */
export function getBuiltInAgentNames(): string[] {
	return Array.from(AGENT_REGISTRY.keys());
}
