/**
 * Agent router - maps email addresses to the appropriate agent
 */

import type { ParsedEmail } from '../types';
import { BaseAgent, EchoAgent, InfoAgent } from '../agents';
import { extractAgentName } from '../utils/email-parser';

/**
 * Registry of built-in agents
 */
type AgentConstructor = new (
  email: ParsedEmail,
  apiKey: string,
  domain: string
) => BaseAgent;

const AGENT_REGISTRY: Map<string, AgentConstructor> = new Map([
  ['echo', EchoAgent],
  ['info', InfoAgent],
  // Future agents will be added here:
  // ['research', ResearchAgent],
  // ['summarize', SummarizeAgent],
  // ['write', WriteAgent],
]);

/**
 * Route an email to the appropriate agent
 */
export function routeToAgent(
  email: ParsedEmail,
  apiKey: string,
  domain: string
): BaseAgent {
  const agentName = extractAgentName(email.to);

  // Check for built-in agent
  const AgentClass = AGENT_REGISTRY.get(agentName);
  if (AgentClass) {
    console.log(`Routing to built-in agent: ${agentName}`);
    return new AgentClass(email, apiKey, domain);
  }

  // For now, fallback to info agent for unknown addresses
  // TODO: Implement meta-agent for dynamic agent creation (Week 3)
  console.log(`Unknown agent "${agentName}", falling back to info agent`);
  return new InfoAgent(email, apiKey, domain);
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
