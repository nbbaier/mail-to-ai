import alchemy from "alchemy";
import {
	DurableObjectNamespace,
	KVNamespace,
	Queue,
	Worker,
	WranglerJson,
} from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";
import type {
	EchoAgent,
	InfoAgent,
	MetaAgent,
	ResearchAgent,
	SummarizeAgent,
} from "./src/agents";

const app = await alchemy("mail-to-ai", {
	stage: process.env.ALCHEMY_STAGE ?? "dev",
	stateStore: (scope) => new CloudflareStateStore(scope),
	password: process.env.ALCHEMY_PASSWORD,
});

// KV namespace for caching and rate limiting
export const cache = await KVNamespace("mta-cache_kv", {
	title: `${app.name}-${app.stage}-cache`,
	adopt: true,
});

// Dead letter queue for failed messages
export const emailDLQ = await Queue("mta-email_dlq", {
	name: `${app.name}-${app.stage}-email-processing-dlq`,
	adopt: true,
});

export const emailQueue = await Queue("mta-email_queue", {
	name: `${app.name}-${app.stage}-email-processing`,
	adopt: true,
});

export const echoAgent = DurableObjectNamespace<EchoAgent>("mta-echo_agent", {
	className: `EchoAgent`,
	sqlite: true,
});

export const infoAgent = DurableObjectNamespace<InfoAgent>("mta-info_agent", {
	className: `InfoAgent`,
	sqlite: true,
});

export const researchAgent = DurableObjectNamespace<ResearchAgent>(
	"mta-research_agent",
	{
		className: `ResearchAgent`,
		sqlite: true,
	},
);

export const summarizeAgent = DurableObjectNamespace<SummarizeAgent>(
	"mta-summarize_agent",
	{
		className: `SummarizeAgent`,
		sqlite: true,
	},
);

export const metaAgent = DurableObjectNamespace<MetaAgent>("mta-meta_agent", {
	className: `MetaAgent`,
	sqlite: true,
});

// Main worker
export const worker = await Worker("mail-to-ai", {
	name: `${app.name}-${app.stage}`,
	entrypoint: "src/index.ts",
	compatibilityDate: "2024-12-01",
	compatibilityFlags: ["nodejs_compat"],
	url: true,
	bindings: {
		CACHE_KV: cache,
		EMAIL_QUEUE: emailQueue,
		EMAIL_DLQ: emailDLQ,
		ECHO_AGENT: echoAgent,
		INFO_AGENT: infoAgent,
		RESEARCH_AGENT: researchAgent,
		SUMMARIZE_AGENT: summarizeAgent,
		META_AGENT: metaAgent,
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
			queue: emailQueue,
			settings: {
				batchSize: 10,
				maxWaitTimeMs: 30000,
				maxRetries: 3,
				deadLetterQueue: emailDLQ.name,
			},
		},
	],
});

await WranglerJson({ worker });

console.log(`Worker deployed to: ${worker.url}`);

await app.finalize();
