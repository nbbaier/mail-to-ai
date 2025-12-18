import { InfoAgent } from "./src/agents/info-agent";
/**
 * Alchemy Configuration for mail-to-ai
 *
 * Run with: npx alchemy run alchemy.run.ts
 * Deploy with: npx alchemy run alchemy.run.ts --stage production
 *
 * Learn more: https://alchemy.run
 */

import alchemy from "alchemy";
import {
	DurableObjectNamespace,
	KVNamespace,
	Queue,
	Worker,
} from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";

const app = await alchemy("mail-to-ai", {
	stage: process.env.ALCHEMY_STAGE ?? "dev",
	stateStore: (scope) => new CloudflareStateStore(scope),
	password: process.env.ALCHEMY_PASSWORD,
});

// KV namespace for caching and rate limiting
export const cache_kv = await KVNamespace("mta-cache_kv", {
	title: `${app.name}-${app.stage}-cache`,
	adopt: true,
});

// Dead letter queue for failed messages
export const email_dlq = await Queue("mta-email_dlq", {
	name: `${app.name}-${app.stage}-email-processing-dlq`,
	adopt: true,
});

// Main email processing queue
export const email_queue = await Queue("mta-email_queue", {
	name: `${app.name}-${app.stage}-email-processing`,
	adopt: true,
});

// Durable Object namespaces for agents
export const echo_agent = DurableObjectNamespace("mta-echo_agent", {
	className: `EchoAgent`,
});

export const info_agent = DurableObjectNamespace("mta-info_agent", {
	className: `InfoAgent`,
});

// Main worker
export const worker = await Worker("mail-to-ai", {
	name: `${app.name}-${app.stage}`,
	entrypoint: "src/index.ts",
	compatibilityDate: "2024-12-01",
	compatibilityFlags: ["nodejs_compat"],
	url: true,
	bindings: {
		CACHE_KV: cache_kv,
		EMAIL_QUEUE: email_queue,
		EMAIL_DLQ: email_dlq,
		ECHO_AGENT: echo_agent,
		INFO_AGENT: info_agent,

		ALLOWED_DOMAIN: "mail-to-ai.com",

		INBOUND_API_KEY: alchemy.secret(
			process.env.INBOUND_API_KEY || "dev-placeholder",
		),
		INBOUND_WEBHOOK_SECRET: alchemy.secret(
			process.env.INBOUND_WEBHOOK_SECRET || "dev-placeholder",
		),
		ANTHROPIC_API_KEY: alchemy.secret(
			process.env.ANTHROPIC_API_KEY || "dev-placeholder",
		),
	},
	eventSources: [
		{
			queue: email_queue,
			settings: {
				batchSize: 10,
				maxWaitTimeMs: 30000,
				maxRetries: 3,
				deadLetterQueue: email_dlq.name,
			},
		},
	],
});

console.log(`Worker deployed to: ${worker.url}`);

await app.finalize();
