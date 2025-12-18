# Email-to-AI Agent MVP: Detailed Implementation Plan

## Project Overview

**Goal**: Build a functional email-to-AI agent service for the inbound.new hackathon that demonstrates both pre-built agents and dynamic “meta-agent” creation from arbitrary email addresses.

**Timeline**: 4 weeks  
**Target Demo Date**: [Insert hackathon date]  
**Core Innovation**: Meta-agent that infers task from email address (e.g., `write-haiku-about-cats@domain.com`)

---

## Technical Architecture

### High-Level System Design

```
┌─────────────────┐
│  Sender Email   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Inbound.new    │ (Email Reception)
│  MX Records     │
└────────┬────────┘
         │ Webhook POST
         ▼
┌─────────────────┐
│  API Server     │ (Bun/TypeScript with Hono)
│  - Verify HMAC  │
│  - Parse Email  │
│  - Route Agent  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Redis Queue    │ (Async Processing)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Agent Processor │
│  - Load Agent   │
│  - Call LLM     │
│  - Format Reply │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Email Sender    │ (SMTP/Resend)
│  - Threading    │
│  - SPF/DKIM     │
└─────────────────┘
```

**Note**: Install Bun first: `curl -fsSL https://bun.sh/install | bash`

### Tech Stack

| Component       | Technology                     | Rationale                                                        |
| --------------- | ------------------------------ | ---------------------------------------------------------------- |
| Email Receiving | inbound.new                    | Purpose-built for AI agents, TypeScript SDK, automatic threading |
| Backend Runtime | Bun 1.0+ with TypeScript       | 3x faster than Node, native TypeScript, built-in test runner     |
| Web Framework   | Hono or Elysia                 | Bun-optimized, lightweight, fast routing                         |
| Queue/Cache     | Redis (Upstash for serverless) | Job queue, caching, rate limiting                                |
| AI/LLM          | Claude API (Sonnet 4)          | High quality, good at following instructions                     |
| Email Sending   | Resend or Postmark             | Good deliverability, simple API                                  |
| Hosting         | Railway or Fly.io              | Easy deployment, both support Bun                                |
| Database        | PostgreSQL (optional)          | Only if storing user data/history                                |

---

## Week 1: Foundation & Infrastructure Setup

### Day 1: Environment & Domain Setup

**Tasks**:

1. Register domain for email agents (e.g., `mailagent.xyz`)
1. Set up inbound.new account
1. Configure DNS records (MX, SPF, DKIM)
1. Initialize Bun project with TypeScript

**Deliverables**:

```bash
# Initialize project
bun init -y

# Project structure
email-agent-mvp/
├── src/
│   ├── config/
│   │   └── environment.ts
│   ├── types/
│   │   └── email.types.ts
│   └── index.ts
├── package.json
├── tsconfig.json
├── .env.example
└── README.md

# Install dependencies
bun add hono @hono/node-server
bun add @anthropic-ai/sdk resend ioredis bullmq
bun add -d @types/node
```

**Environment Variables**:

```env
# Inbound.new
INBOUND_WEBHOOK_SECRET=xxx
INBOUND_API_KEY=xxx

# Claude API
ANTHROPIC_API_KEY=xxx

# Email Sending
RESEND_API_KEY=xxx

# Redis
REDIS_URL=xxx

# App Config
NODE_ENV=development
PORT=3000
ALLOWED_DOMAINS=mailagent.xyz
```

**package.json scripts**:

```json
{
   "scripts": {
      "dev": "bun --hot src/index.ts",
      "start": "bun src/index.ts",
      "test": "bun test",
      "worker": "bun src/worker.ts"
   }
}
```

**DNS Configuration**:

```dns
# MX Records (from inbound.new dashboard)
mailagent.xyz.    MX    10 mx.inbound.new.

# SPF Record
mailagent.xyz.    TXT   "v=spf1 include:inbound.new include:resend.com ~all"

# DKIM (keys from inbound.new and Resend)
default._domainkey.mailagent.xyz.    TXT   "v=DKIM1; k=rsa; p=..."
```

**Acceptance Criteria**:

- [ ] Can receive test email at any@mailagent.xyz
- [ ] Inbound.new webhook fires successfully
- [ ] Bun project runs with `bun run src/index.ts`

---

### Day 2: Webhook Endpoint & Email Parsing

**Tasks**:

1. Create Hono server with webhook endpoint
1. Implement HMAC signature verification
1. Parse inbound email structure
1. Extract key fields (from, to, subject, body, thread_id)

**Why Bun**: Native TypeScript execution (no compilation step), 3x faster JSON parsing than Node.js, built-in test runner with `bun test`

**Code Structure**:

```typescript
// src/server.ts
import { Hono } from "hono";
import { verifyWebhookSignature } from "./utils/security";
import { parseInboundEmail } from "./utils/email-parser";

const app = new Hono();

app.post("/webhook/inbound", async (c) => {
   // 1. Verify signature
   const signature = c.req.header("x-inbound-signature");
   const body = await c.req.json();

   if (!verifyWebhookSignature(body, signature)) {
      return c.json({ error: "Invalid signature" }, 401);
   }

   // 2. Parse email
   const email = parseInboundEmail(body);

   // 3. Queue for processing
   await queueEmailForProcessing(email);

   // 4. Respond quickly (under 5s)
   return c.json({ received: true });
});

export default {
   port: 3000,
   fetch: app.fetch,
};
```

**Email Parser Implementation**:

```typescript
// src/utils/email-parser.ts
import { InboundEmail, ParsedEmail } from "../types/email.types";

export function parseInboundEmail(payload: InboundEmail): ParsedEmail {
   return {
      id: payload.id,
      from: {
         email: payload.from.email,
         name: payload.from.name || payload.from.email,
      },
      to: payload.to[0].email, // Primary recipient
      cc: payload.cc?.map((c) => c.email) || [],
      subject: payload.subject,
      body: extractCleanBody(payload),
      threadId: payload.threadId || payload.messageId,
      inReplyTo: payload.inReplyTo,
      references: payload.references || [],
      attachments: payload.attachments || [],
      receivedAt: new Date(payload.receivedAt),
   };
}

function extractCleanBody(payload: InboundEmail): string {
   // Priority: text/plain > text/html (stripped)
   if (payload.text) {
      return cleanTextBody(payload.text);
   }

   if (payload.html) {
      return htmlToText(payload.html);
   }

   return "";
}

function cleanTextBody(text: string): string {
   // Remove email signatures
   const signaturePatterns = [
      /^--\s*$/m,
      /^Sent from my iPhone$/m,
      /^Get Outlook for iOS$/m,
   ];

   let cleaned = text;
   for (const pattern of signaturePatterns) {
      const match = cleaned.match(pattern);
      if (match?.index) {
         cleaned = cleaned.substring(0, match.index);
      }
   }

   // Remove quoted replies (lines starting with >)
   const lines = cleaned.split("\n");
   const contentLines = [];

   for (const line of lines) {
      if (line.trim().startsWith(">")) break;
      contentLines.push(line);
   }

   return contentLines.join("\n").trim();
}
```

**Acceptance Criteria**:

- [ ] Webhook endpoint responds within 5 seconds
- [ ] Signature verification rejects invalid requests
- [ ] Email body is cleanly extracted (no signatures/quotes)
- [ ] Thread IDs are properly preserved

---

### Day 3: Job Queue & Background Processing

**Tasks**:

1. Set up Redis connection (Upstash recommended)
1. Implement job queue with BullMQ
1. Create worker process for email handling
1. Add basic error handling and retries

**Bun Benefits**: Faster Redis connection pooling, ~30% better throughput on queue processing

**Queue Implementation**:

```typescript
// src/services/queue.service.ts
import { Queue, Worker, Job } from "bullmq";
import { Redis } from "ioredis";
import { ParsedEmail } from "../types/email.types";

const redis = new Redis(process.env.REDIS_URL!);

// Create queue
export const emailQueue = new Queue("email-processing", {
   connection: redis,
   defaultJobOptions: {
      attempts: 3,
      backoff: {
         type: "exponential",
         delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
   },
});

// Add job to queue
export async function queueEmailForProcessing(
   email: ParsedEmail
): Promise<void> {
   await emailQueue.add("process-email", email, {
      jobId: email.id, // Prevent duplicate processing
      timeout: 60000, // 60 second timeout
   });
}

// Worker process
export function startEmailWorker() {
   const worker = new Worker(
      "email-processing",
      async (job: Job<ParsedEmail>) => {
         console.log(`Processing email ${job.data.id}`);

         try {
            await processEmail(job.data);
            return { success: true };
         } catch (error) {
            console.error(`Failed to process email ${job.data.id}:`, error);
            throw error; // Will trigger retry
         }
      },
      {
         connection: redis,
         concurrency: 5, // Process 5 emails concurrently
      }
   );

   worker.on("completed", (job) => {
      console.log(`Job ${job.id} completed`);
   });

   worker.on("failed", (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
   });

   return worker;
}
```

**Rate Limiting**:

```typescript
// src/middleware/rate-limit.ts
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

export async function checkRateLimit(
   senderEmail: string,
   limit: number = 10,
   windowSeconds: number = 3600
): Promise<{ allowed: boolean; remaining: number }> {
   const key = `ratelimit:${senderEmail}`;
   const current = await redis.incr(key);

   if (current === 1) {
      await redis.expire(key, windowSeconds);
   }

   return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
   };
}
```

**Acceptance Criteria**:

- [ ] Emails are queued successfully after webhook
- [ ] Worker processes jobs from queue
- [ ] Failed jobs retry with exponential backoff
- [ ] Rate limiting blocks excessive requests

---

### Day 4-5: Agent Router & Basic Agent Framework

**Tasks**:

1. Create agent registry system
1. Implement routing logic (address → agent)
1. Build base agent class with LLM integration
1. Create 2 simple agents (echo, info)

**Agent Router**:

```typescript
// src/services/agent-router.ts
import { ParsedEmail } from "../types/email.types";
import { BaseAgent } from "./agents/base-agent";
import { ResearchAgent } from "./agents/research-agent";
import { SummarizeAgent } from "./agents/summarize-agent";
import { MetaAgent } from "./agents/meta-agent";

type AgentRegistry = Map<string, typeof BaseAgent>;

const AGENTS: AgentRegistry = new Map([
   ["research", ResearchAgent],
   ["summarize", SummarizeAgent],
   ["info", InfoAgent],
]);

export function routeToAgent(email: ParsedEmail): BaseAgent {
   // Extract local part of recipient email
   // research@mailagent.xyz → research
   const localPart = email.to.split("@")[0].toLowerCase();

   // Check if we have a registered agent
   const AgentClass = AGENTS.get(localPart);

   if (AgentClass) {
      return new AgentClass(email);
   }

   // Fallback to meta-agent for dynamic addresses
   return new MetaAgent(email, localPart);
}
```

**Base Agent Class**:

```typescript
// src/services/agents/base-agent.ts
import Anthropic from "@anthropic-ai/sdk";
import { ParsedEmail } from "../../types/email.types";

export abstract class BaseAgent {
   protected email: ParsedEmail;
   protected anthropic: Anthropic;

   constructor(email: ParsedEmail) {
      this.email = email;
      this.anthropic = new Anthropic({
         apiKey: process.env.ANTHROPIC_API_KEY,
      });
   }

   // Each agent implements this
   abstract getSystemPrompt(): string;

   // Override for agents that need web search, etc.
   protected getTools(): any[] {
      return [];
   }

   // Main processing method
   async process(): Promise<string> {
      const response = await this.anthropic.messages.create({
         model: "claude-sonnet-4-20250514",
         max_tokens: 4096,
         system: this.getSystemPrompt(),
         messages: [
            {
               role: "user",
               content: this.buildUserMessage(),
            },
         ],
         tools: this.getTools(),
      });

      // Extract text from response
      const textBlock = response.content.find((block) => block.type === "text");
      return textBlock?.text || "Sorry, I could not generate a response.";
   }

   protected buildUserMessage(): string {
      return `
Subject: ${this.email.subject}

From: ${this.email.from.name} <${this.email.from.email}>

Message:
${this.email.body}
`.trim();
   }

   // Generate email reply
   async generateReply(): Promise<EmailReply> {
      const responseBody = await this.process();

      return {
         to: this.email.from.email,
         subject: `Re: ${this.email.subject}`,
         body: responseBody,
         inReplyTo: this.email.id,
         references: [...this.email.references, this.email.id],
      };
   }
}

export interface EmailReply {
   to: string;
   subject: string;
   body: string;
   inReplyTo: string;
   references: string[];
}
```

**Info Agent (Simple Example)**:

```typescript
// src/services/agents/info-agent.ts
import { BaseAgent } from "./base-agent";

export class InfoAgent extends BaseAgent {
   getSystemPrompt(): string {
      return `You are an informational assistant for the Email Agent Service.

Your role is to explain how the service works when users email info@mailagent.xyz.

Key points to cover:
- This service provides AI agents accessible via email
- Available agents: research@, summarize@, or any custom address
- Custom addresses (like write-haiku@) create dynamic agents
- Responses arrive via email reply, usually within 1 minute
- All agents are powered by Claude AI

Keep responses friendly, concise, and helpful. Sign off as "The Email Agent Team"`;
   }
}
```

**Acceptance Criteria**:

- [ ] Router correctly maps email addresses to agents
- [ ] Base agent can call Claude API successfully
- [ ] Info agent responds with helpful information
- [ ] Agent responses are properly formatted

---

### Day 6-7: Email Sending & Threading

**Tasks**:

1. Set up Resend or Postmark for sending
1. Implement email sender with proper threading
1. Handle HTML formatting for replies
1. Test full round-trip (receive → process → reply)

**Email Sender Implementation**:

```typescript
// src/services/email-sender.ts
import { Resend } from "resend";
import { EmailReply } from "./agents/base-agent";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailReply(reply: EmailReply): Promise<void> {
   try {
      await resend.emails.send({
         from: `AI Agent <${extractAgentAddress(reply)}>`,
         to: reply.to,
         subject: reply.subject,
         text: reply.body,
         html: formatAsHtml(reply.body),
         headers: {
            "In-Reply-To": reply.inReplyTo,
            References: reply.references.join(" "),
         },
      });

      console.log(`Sent reply to ${reply.to}`);
   } catch (error) {
      console.error("Failed to send email:", error);
      throw error;
   }
}

function extractAgentAddress(reply: EmailReply): string {
   // Extract agent address from References header
   // This ensures replies come from the same address user emailed
   const originalMessageId = reply.references[0];
   // Parse and return appropriate address
   // For now, default to noreply@mailagent.xyz
   return "noreply@mailagent.xyz";
}

function formatAsHtml(text: string): string {
   // Convert plain text to basic HTML
   const paragraphs = text.split("\n\n");
   const htmlParagraphs = paragraphs.map(
      (p) => `<p>${p.replace(/\n/g, "<br>")}</p>`
   );

   return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    p { margin: 1em 0; line-height: 1.5; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  ${htmlParagraphs.join("\n  ")}
  
  <hr style="margin: 2em 0; border: none; border-top: 1px solid #ddd;">
  <p style="color: #666; font-size: 0.9em;">
    This email was generated by an AI agent. Reply to continue the conversation.
  </p>
</body>
</html>
  `.trim();
}
```

**Main Processing Flow**:

```typescript
// src/services/email-processor.ts
import { ParsedEmail } from "../types/email.types";
import { routeToAgent } from "./agent-router";
import { sendEmailReply } from "./email-sender";
import { checkRateLimit } from "../middleware/rate-limit";

export async function processEmail(email: ParsedEmail): Promise<void> {
   // 1. Check rate limit
   const rateCheck = await checkRateLimit(email.from.email);
   if (!rateCheck.allowed) {
      await sendRateLimitEmail(email);
      return;
   }

   // 2. Route to appropriate agent
   const agent = routeToAgent(email);

   // 3. Generate response
   const reply = await agent.generateReply();

   // 4. Send email reply
   await sendEmailReply(reply);

   console.log(`Processed email ${email.id} with ${agent.constructor.name}`);
}

async function sendRateLimitEmail(email: ParsedEmail): Promise<void> {
   await sendEmailReply({
      to: email.from.email,
      subject: `Re: ${email.subject}`,
      body: `You've reached your hourly limit of 10 requests. Please try again later.`,
      inReplyTo: email.id,
      references: [email.id],
   });
}
```

**Acceptance Criteria**:

- [ ] Emails are sent successfully via Resend
- [ ] Email threading works (replies appear in thread)
- [ ] HTML formatting renders correctly
- [ ] Rate limit emails are sent when limit exceeded
- [ ] Full pipeline works: receive → queue → process → reply

---

## Week 2: Core Agents Implementation

### Day 8-9: Research Agent

**Tasks**:

1. Integrate web search tool (via Claude’s native tools)
1. Implement research workflow (search → synthesize → cite)
1. Handle multi-query research requests
1. Format research results clearly

**Research Agent Implementation**:

```typescript
// src/services/agents/research-agent.ts
import { BaseAgent } from "./base-agent";

export class ResearchAgent extends BaseAgent {
   getSystemPrompt(): string {
      return `You are a research assistant that helps users find information via email.

Your capabilities:
- Search the web for current information
- Synthesize findings from multiple sources
- Provide clear, well-cited answers
- Handle follow-up questions in email threads

Guidelines:
- Always cite sources with URLs
- If a topic requires multiple searches, do them
- Be thorough but concise
- Format responses for easy reading in email
- Sign off as "Research Agent"

Today's date is ${new Date().toLocaleDateString()}.`;
   }

   protected getTools(): any[] {
      return [
         {
            type: "web_search_20250305" as const,
            name: "web_search",
         },
      ];
   }

   async process(): Promise<string> {
      // Use Claude with web search enabled
      const response = await this.anthropic.messages.create({
         model: "claude-sonnet-4-20250514",
         max_tokens: 4096,
         system: this.getSystemPrompt(),
         messages: [
            {
               role: "user",
               content: `Please research the following query and provide a comprehensive answer:

${this.email.body}

Remember to cite your sources.`,
            },
         ],
         tools: this.getTools(),
      });

      // Extract text content
      let responseText = "";
      for (const block of response.content) {
         if (block.type === "text") {
            responseText += block.text;
         }
      }

      return responseText || "I was unable to complete the research.";
   }
}
```

**Example Research Request/Response**:

```
TO: research@mailagent.xyz
SUBJECT: Current state of quantum computing
BODY: What are the latest developments in quantum computing?

---

FROM: Research Agent <research@mailagent.xyz>
SUBJECT: Re: Current state of quantum computing

Based on current research, here are the latest developments in quantum computing:

**IBM's Quantum Roadmap**
IBM recently unveiled their 1,121-qubit Condor processor and announced plans
for a 100,000-qubit system by 2033...
[Source: https://research.ibm.com/blog/...]

**Google's Quantum AI Progress**
Google's quantum AI team demonstrated quantum error correction...
[Source: https://blog.google/technology/ai/...]

Let me know if you'd like me to research any specific aspect in more detail.

---
Research Agent
```

**Acceptance Criteria**:

- [ ] Can handle open-ended research questions
- [ ] Uses web search effectively
- [ ] Cites sources properly
- [ ] Responses are well-formatted for email

---

### Day 10-11: Summarize Agent

**Tasks**:

1. Handle forwarded email chains
1. Extract key points from long threads
1. Format summaries with action items
1. Support different summary lengths

**Summarize Agent Implementation**:

```typescript
// src/services/agents/summarize-agent.ts
import { BaseAgent } from "./base-agent";

export class SummarizeAgent extends BaseAgent {
   getSystemPrompt(): string {
      return `You are an email summarization specialist.

Your role is to:
- Summarize forwarded emails or long threads
- Extract key points, decisions, and action items
- Identify important dates and deadlines
- Highlight who needs to do what

Format your summaries as:
1. **Overview** (1-2 sentences)
2. **Key Points** (bullet list)
3. **Action Items** (if any, with owners)
4. **Important Dates** (if any)

Keep summaries concise but complete. Sign off as "Summarize Agent"`;
   }

   async process(): Promise<string> {
      // Check if this is a long thread or forwarded content
      const wordCount = this.email.body.split(/\s+/).length;

      let prompt = `Please summarize the following email content:\n\n${this.email.body}`;

      if (wordCount > 500) {
         prompt +=
            "\n\nThis is a long email - focus on the most important information.";
      }

      const response = await this.anthropic.messages.create({
         model: "claude-sonnet-4-20250514",
         max_tokens: 2048,
         system: this.getSystemPrompt(),
         messages: [{ role: "user", content: prompt }],
      });

      const textBlock = response.content.find((block) => block.type === "text");
      return textBlock?.text || "Unable to generate summary.";
   }
}
```

**Acceptance Criteria**:

- [ ] Handles forwarded email chains
- [ ] Extracts action items accurately
- [ ] Format is consistent and readable
- [ ] Works with threads of varying lengths

---

### Day 12-13: Write Agent

**Tasks**:

1. Handle creative writing requests
1. Support different styles/tones
1. Handle drafting emails, posts, etc.
1. Iterate on drafts via email thread

**Write Agent Implementation**:

```typescript
// src/services/agents/write-agent.ts
import { BaseAgent } from "./base-agent";

export class WriteAgent extends BaseAgent {
   getSystemPrompt(): string {
      return `You are a writing assistant that helps users compose content via email.

Your capabilities:
- Draft emails, social posts, articles, creative content
- Match requested tone/style
- Iterate on drafts based on feedback
- Provide multiple options when requested

Guidelines:
- Always match the requested tone (professional, casual, friendly, etc.)
- Ask clarifying questions if the request is vague
- Provide a single draft unless multiple options are requested
- In threads, treat previous messages as iteration feedback
- Sign off as "Write Agent"`;
   }

   async process(): Promise<string> {
      // Build context from thread if this is a reply
      const threadContext = this.buildThreadContext();

      let userMessage = this.email.body;
      if (threadContext) {
         userMessage = `Previous context:\n${threadContext}\n\nNew request:\n${this.email.body}`;
      }

      const response = await this.anthropic.messages.create({
         model: "claude-sonnet-4-20250514",
         max_tokens: 3072,
         system: this.getSystemPrompt(),
         messages: [{ role: "user", content: userMessage }],
      });

      const textBlock = response.content.find((block) => block.type === "text");
      return textBlock?.text || "Unable to generate content.";
   }

   private buildThreadContext(): string | null {
      // If this is a reply in a thread, fetch previous context
      // For MVP, we'll keep this simple
      return null;
   }
}
```

**Acceptance Criteria**:

- [ ] Generates quality written content
- [ ] Matches requested tone/style
- [ ] Handles iteration in threads
- [ ] Supports various content types

---

### Day 14: Testing & Bug Fixes

**Testing Checklist**:

- [ ] Send emails to all agents, verify responses
- [ ] Test email threading (reply to continue conversation)
- [ ] Verify rate limiting works
- [ ] Test with attachments (should handle gracefully)
- [ ] Test with very long emails
- [ ] Test with non-English emails
- [ ] Verify HTML rendering in Gmail, Outlook
- [ ] Check webhook signature verification blocks invalid requests

**Bug Fixes**:

- [ ] Handle edge cases in email parsing
- [ ] Improve error messages
- [ ] Fix any threading issues
- [ ] Optimize response times

---

## Week 3: Meta-Agent & Dynamic Agent Creation

### Day 15-16: Meta-Agent Foundation

**Tasks**:

1. Create meta-agent that interprets email addresses
1. Build prompt generation system
1. Implement agent caching
1. Add validation for unsafe requests

**Meta-Agent Core Logic**:

```typescript
// src/services/agents/meta-agent.ts
import { BaseAgent } from "./base-agent";
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

export class MetaAgent extends BaseAgent {
   private agentAddress: string;
   private derivedPrompt: string | null = null;

   constructor(email: ParsedEmail, agentAddress: string) {
      super(email);
      this.agentAddress = agentAddress;
   }

   getSystemPrompt(): string {
      return this.derivedPrompt || this.getDefaultPrompt();
   }

   private getDefaultPrompt(): string {
      return `You are a helpful AI assistant responding to emails.`;
   }

   async process(): Promise<string> {
      // Step 1: Interpret the email address to derive agent behavior
      await this.deriveAgentFromAddress();

      // Step 2: Process with derived prompt
      return super.process();
   }

   private async deriveAgentFromAddress(): Promise<void> {
      // Check cache first
      const cached = await this.getCachedPrompt(this.agentAddress);
      if (cached) {
         this.derivedPrompt = cached;
         return;
      }

      // Generate new prompt from address
      const addressInstruction = this.parseAddressToInstruction(
         this.agentAddress
      );
      const prompt = await this.generateAgentPrompt(addressInstruction);

      // Cache for future use
      await this.cachePrompt(this.agentAddress, prompt);

      this.derivedPrompt = prompt;
   }

   private parseAddressToInstruction(address: string): string {
      // Convert kebab-case or snake_case to natural language
      // write-haiku-about-cats → "write haiku about cats"
      return address.replace(/[-_]/g, " ").toLowerCase().trim();
   }

   private async generateAgentPrompt(instruction: string): Promise<string> {
      // Use Claude to generate a system prompt from the instruction
      const response = await this.anthropic.messages.create({
         model: "claude-sonnet-4-20250514",
         max_tokens: 1024,
         system: `You are a meta-agent that creates system prompts for other AI agents.

Given a natural language instruction (derived from an email address), create a clear, 
focused system prompt for an agent that would perform that task.

The prompt should:
- Be 2-4 sentences
- Clearly define the agent's role
- Include any relevant constraints
- Be professional and helpful

Example:
Input: "write haiku about cats"
Output: "You are a creative writing assistant specializing in haiku composition. When users email you, compose original haikus about cats. Each haiku should follow the traditional 5-7-5 syllable structure and capture the essence of feline nature."`,
         messages: [
            {
               role: "user",
               content: `Create a system prompt for an agent that should: ${instruction}`,
            },
         ],
      });

      const textBlock = response.content.find((block) => block.type === "text");
      return textBlock?.text || this.getDefaultPrompt();
   }

   private async getCachedPrompt(address: string): Promise<string | null> {
      const cached = await redis.get(`agent-prompt:${address}`);
      return cached;
   }

   private async cachePrompt(address: string, prompt: string): Promise<void> {
      // Cache for 7 days
      await redis.setex(`agent-prompt:${address}`, 604800, prompt);
   }
}
```

**Safety Validation**:

```typescript
// src/utils/safety-validator.ts
const UNSAFE_PATTERNS = [
   /password/i,
   /hack/i,
   /exploit/i,
   /malware/i,
   /phishing/i,
   /spam/i,
   /illegal/i,
   /weapon/i,
   /drug/i,
];

export function isUnsafeAddress(address: string): boolean {
   return UNSAFE_PATTERNS.some((pattern) => pattern.test(address));
}

export function validateMetaAgentRequest(
   address: string,
   emailBody: string
): { valid: boolean; reason?: string } {
   // Check address
   if (isUnsafeAddress(address)) {
      return {
         valid: false,
         reason: "This agent address is not permitted for safety reasons.",
      };
   }

   // Check for potential prompt injection in body
   if (emailBody.toLowerCase().includes("ignore previous instructions")) {
      return {
         valid: false,
         reason: "This request appears to contain prompt injection.",
      };
   }

   return { valid: true };
}
```

**Acceptance Criteria**:

- [ ] Meta-agent interprets addresses correctly
- [ ] Generated prompts are coherent and relevant
- [ ] Caching works (2nd email to same address is fast)
- [ ] Unsafe addresses are rejected

---

### Day 17-18: Advanced Meta-Agent Features

**Tasks**:

1. Add tool selection based on address
1. Implement multi-step agent workflows
1. Add context memory across emails
1. Create agent discovery system

**Tool Selection Logic**:

```typescript
// src/services/agents/meta-agent.ts (extended)

interface AgentCapabilities {
  needsWebSearch: boolean;
  needsFileProcessing: boolean;
  isCreative: boolean;
}

private analyzeCapabilitiesNeeded(instruction: string): AgentCapabilities {
  const needsWebSearch = /\b(research|find|search|latest|current|news)\b/i.test(instruction);
  const needsFileProcessing = /\b(analyze|read|parse|extract)\b/i.test(instruction);
  const isCreative = /\b(write|create|compose|generate|draft)\b/i.test(instruction);

  return {
    needsWebSearch,
    needsFileProcessing,
    isCreative
  };
}

protected getTools(): any[] {
  const capabilities = this.analyzeCapabilitiesNeeded(this.agentAddress);
  const tools = [];

  if (capabilities.needsWebSearch) {
    tools.push({
      type: 'web_search_20250305' as const,
      name: 'web_search'
    });
  }

  return tools;
}
```

**Context Memory**:

```typescript
// src/services/memory.service.ts
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

export interface ConversationContext {
   senderEmail: string;
   agentAddress: string;
   history: Array<{
      role: "user" | "assistant";
      content: string;
      timestamp: Date;
   }>;
}

export async function getConversationContext(
   senderEmail: string,
   agentAddress: string
): Promise<ConversationContext | null> {
   const key = `context:${senderEmail}:${agentAddress}`;
   const data = await redis.get(key);

   if (!data) return null;

   return JSON.parse(data);
}

export async function saveConversationContext(
   context: ConversationContext
): Promise<void> {
   const key = `context:${context.senderEmail}:${context.agentAddress}`;

   // Keep only last 5 messages
   context.history = context.history.slice(-5);

   // Expire after 7 days
   await redis.setex(key, 604800, JSON.stringify(context));
}

export async function addToConversationHistory(
   senderEmail: string,
   agentAddress: string,
   role: "user" | "assistant",
   content: string
): Promise<void> {
   let context = await getConversationContext(senderEmail, agentAddress);

   if (!context) {
      context = {
         senderEmail,
         agentAddress,
         history: [],
      };
   }

   context.history.push({
      role,
      content,
      timestamp: new Date(),
   });

   await saveConversationContext(context);
}
```

**Agent Discovery System**:

```typescript
// src/services/agents/discover-agent.ts
import { BaseAgent } from "./base-agent";
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

export class DiscoverAgent extends BaseAgent {
   getSystemPrompt(): string {
      return `You are the Agent Discovery assistant.

Your role is to help users discover available agents and suggest agents for their needs.

Built-in agents:
- research@mailagent.xyz - Web research on any topic
- summarize@mailagent.xyz - Summarize long emails or threads
- write@mailagent.xyz - Draft emails, posts, articles
- info@mailagent.xyz - Information about the service

Dynamic agents:
Users can email ANY address and a custom agent will be created. Examples:
- write-haiku-about-cats@mailagent.xyz
- translate-to-spanish@mailagent.xyz
- analyze-my-resume@mailagent.xyz

When users ask what you can do, explain both built-in and dynamic capabilities.
Suggest specific agent addresses based on their needs.`;
   }

   async process(): Promise<string> {
      // Also show recently created meta-agents
      const recentAgents = await this.getRecentMetaAgents();

      const response = await this.anthropic.messages.create({
         model: "claude-sonnet-4-20250514",
         max_tokens: 2048,
         system:
            this.getSystemPrompt() +
            `\n\nRecent dynamic agents created by other users:\n${recentAgents}`,
         messages: [{ role: "user", content: this.email.body }],
      });

      const textBlock = response.content.find((block) => block.type === "text");
      return textBlock?.text || "Unable to provide agent information.";
   }

   private async getRecentMetaAgents(): Promise<string> {
      // Get list of recently cached agent prompts
      const keys = await redis.keys("agent-prompt:*");
      const recentKeys = keys.slice(-10); // Last 10

      const agents = recentKeys.map(
         (key) => key.replace("agent-prompt:", "") + "@mailagent.xyz"
      );

      return agents.length > 0
         ? agents.map((a) => `- ${a}`).join("\n")
         : "None yet - you could be the first!";
   }
}
```

**Acceptance Criteria**:

- [ ] Meta-agents automatically get appropriate tools
- [ ] Context is preserved across emails in thread
- [ ] Discovery agent shows available agents
- [ ] System handles novel agent addresses gracefully

---

### Day 19-20: Polish & Error Handling

**Tasks**:

1. Improve error messages sent to users
1. Add graceful degradation for API failures
1. Implement bounce handling for invalid emails
1. Add monitoring/logging

**Enhanced Error Handling**:

```typescript
// src/services/error-handler.ts
import { ParsedEmail } from "../types/email.types";
import { sendEmailReply } from "./email-sender";

export async function handleProcessingError(
   email: ParsedEmail,
   error: Error
): Promise<void> {
   console.error(`Error processing email ${email.id}:`, error);

   let userMessage = "";

   if (error.message.includes("rate limit")) {
      userMessage = `Sorry, you've hit the rate limit. Please try again in an hour.`;
   } else if (error.message.includes("timeout")) {
      userMessage = `Your request took too long to process. Try breaking it into smaller parts.`;
   } else if (error.message.includes("API")) {
      userMessage = `We're experiencing technical difficulties. Please try again in a few minutes.`;
   } else {
      userMessage = `We encountered an error processing your request. Our team has been notified.`;
   }

   await sendEmailReply({
      to: email.from.email,
      subject: `Re: ${email.subject}`,
      body: `${userMessage}\n\nIf this persists, reply with "help" for assistance.`,
      inReplyTo: email.id,
      references: [email.id],
   });
}
```

**Logging & Monitoring**:

```typescript
// src/utils/logger.ts
import winston from "winston";

export const logger = winston.createLogger({
   level: process.env.LOG_LEVEL || "info",
   format: winston.format.json(),
   defaultMeta: { service: "email-agent" },
   transports: [
      new winston.transports.File({ filename: "error.log", level: "error" }),
      new winston.transports.File({ filename: "combined.log" }),
      new winston.transports.Console({
         format: winston.format.simple(),
      }),
   ],
});

// Usage tracking
export async function logAgentUsage(
   agentType: string,
   senderEmail: string,
   processingTimeMs: number
): Promise<void> {
   logger.info("Agent usage", {
      agentType,
      senderEmail: hashEmail(senderEmail), // Privacy
      processingTimeMs,
      timestamp: new Date(),
   });
}

function hashEmail(email: string): string {
   // Simple hash for privacy
   return email.split("@")[0].substring(0, 3) + "***@" + email.split("@")[1];
}
```

**Acceptance Criteria**:

- [ ] Users receive helpful error messages
- [ ] System degrades gracefully during API outages
- [ ] All errors are logged properly
- [ ] Usage metrics are tracked

---

## Week 4: Dashboard, Demo Prep & Launch

### Day 21-22: Simple Web Dashboard

**Tasks**:

1. Create basic dashboard UI
1. Show agent activity/stats
1. Display example agent addresses
1. Add waitlist/feedback form

**Dashboard Structure**:

```
dashboard/
├── public/
│   └── index.html
├── src/
│   ├── pages/
│   │   ├── home.tsx
│   │   ├── agents.tsx
│   │   └── activity.tsx
│   └── api/
│       └── stats.ts
└── package.json
```

**Basic Dashboard (Next.js)**:

```typescript
// dashboard/src/pages/index.tsx
import { useState, useEffect } from 'react';

interface AgentStats {
  totalEmails: number;
  activeAgents: string[];
  recentActivity: Array<{
    agent: string;
    timestamp: string;
    processingTime: number;
  }>;
}

export default function Home() {
  const [stats, setStats] = useState<AgentStats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(setStats);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Email Agent Service
          </h1>
          <p className="text-xl text-gray-600">
            AI agents you can reach by email
          </p>
        </header>

        <section className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Built-in Agents</h2>
          <div className="space-y-4">
            <AgentCard
              address="research@mailagent.xyz"
              description="Web research on any topic"
              example="Email: What are the latest developments in quantum computing?"
            />
            <AgentCard
              address="summarize@mailagent.xyz"
              description="Summarize long emails or threads"
              example="Forward: Long email chain → Get concise summary"
            />
            <AgentCard
              address="write@mailagent.xyz"
              description="Draft emails, posts, articles"
              example="Email: Write a professional thank you note"
            />
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Create Custom Agents</h2>
          <p className="text-gray-600 mb-4">
            Email ANY address to create a custom agent. The address becomes the instruction:
          </p>
          <div className="space-y-2 text-sm font-mono bg-gray-50 p-4 rounded">
            <div>write-haiku-about-cats@mailagent.xyz</div>
            <div>translate-to-spanish@mailagent.xyz</div>
            <div>explain-like-im-five@mailagent.xyz</div>
            <div>analyze-this-text@mailagent.xyz</div>
          </div>
        </section>

        {stats && (
          <section className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-semibold mb-4">Live Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <StatBox label="Total Emails Processed" value={stats.totalEmails} />
              <StatBox label="Active Agents" value={stats.activeAgents.length} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function AgentCard({ address, description, example }: any) {
  return (
    <div className="border rounded p-4">
      <div className="font-mono text-blue-600 mb-2">{address}</div>
      <div className="text-gray-700 mb-2">{description}</div>
      <div className="text-sm text-gray-500">{example}</div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded p-4">
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
}
```

**Stats API Endpoint**:

```typescript
// dashboard/src/pages/api/stats.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

export default async function handler(
   req: NextApiRequest,
   res: NextApiResponse
) {
   try {
      // Get stats from Redis
      const totalEmails = (await redis.get("stats:total-emails")) || "0";
      const agentKeys = await redis.keys("agent-prompt:*");
      const activeAgents = agentKeys.map((key) =>
         key.replace("agent-prompt:", "")
      );

      res.status(200).json({
         totalEmails: parseInt(totalEmails),
         activeAgents,
         recentActivity: [], // TODO: implement
      });
   } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
   }
}
```

**Acceptance Criteria**:

- [ ] Dashboard displays agent information
- [ ] Stats update in real-time
- [ ] UI is mobile-friendly
- [ ] Examples are clear and helpful

---

### Day 23: Demo Preparation

**Tasks**:

1. Create demo script
1. Prepare example emails
1. Test full demo flow
1. Create presentation slides

**Demo Script**:

```markdown
# Email Agent Service Demo (5 minutes)

## 1. Introduction (30 seconds)

"Email Agent Service brings AI agents to your inbox. No apps, no APIs—just email."

## 2. Built-in Agents Demo (2 minutes)

### Research Agent

- Send email to research@mailagent.xyz
- Subject: "Latest in AI agents"
- Show response arrives in 30 seconds
- Highlight: Web search, citations, email format

### Summarize Agent

- Forward long email chain to summarize@mailagent.xyz
- Show concise summary with action items

## 3. Meta-Agent (The Innovation) (2 minutes)

"Here's where it gets interesting. Email ANY address:"

- Send to write-haiku-about-startups@mailagent.xyz
- Show the haiku response
- Explain: The address became the instruction
- Show another: explain-quantum-computing-like-im-five@mailagent.xyz

## 4. Threading & Iteration (30 seconds)

- Reply to previous email
- Show agent maintains context
- Demonstrate: "Make it more technical" → Updated response

## 5. Wrap-up (30 seconds)

- Show dashboard with live stats
- "Every new address creates a new agent"
- "Email: the 50-year-old interface for the AI age"
```

**Demo Email Templates**:

```typescript
// demo-emails.ts
export const DEMO_EMAILS = [
   {
      to: "research@mailagent.xyz",
      subject: "Current state of email automation",
      body: "What are the latest developments in AI-powered email automation? Focus on agent-based approaches.",
   },
   {
      to: "write-haiku-about-startups@mailagent.xyz",
      subject: "Haiku request",
      body: "Write me a haiku about the startup journey.",
   },
   {
      to: "explain-quantum-computing-like-im-five@mailagent.xyz",
      subject: "ELI5 quantum computing",
      body: "Can you explain how quantum computers work?",
   },
   {
      to: "analyze-this-pitch@mailagent.xyz",
      subject: "Pitch feedback",
      body: `[Your elevator pitch here]
    
Please provide constructive feedback on clarity, structure, and impact.`,
   },
];
```

**Presentation Outline**:

```
Slide 1: Title
- Email Agent Service
- AI agents accessible by email

Slide 2: The Problem
- AI agents require apps, APIs, complex setups
- Email is universal, asynchronous, familiar

Slide 3: The Solution
- Email an AI agent address → Get AI response
- Built-in agents + dynamic agent creation

Slide 4: Demo
[Live demo]

Slide 5: Technical Innovation
- Meta-agent interprets arbitrary addresses
- Address → Natural language → System prompt
- Example transformations

Slide 6: Architecture
[System diagram]

Slide 7: What's Next
- Multi-modal (handle attachments)
- Team workspaces
- Enterprise deployment

Slide 8: Try It
- Live URL
- Example addresses
- Dashboard link
```

**Acceptance Criteria**:

- [ ] Demo runs smoothly without delays
- [ ] All example agents work perfectly
- [ ] Presentation is clear and compelling
- [ ] Backup plan if live demo fails

---

### Day 24: Testing & Bug Fixes

**Comprehensive Testing**:

```typescript
// tests/integration.test.ts
import { describe, it, expect } from "bun:test";
import { processEmail } from "../src/services/email-processor";
import { ParsedEmail } from "../src/types/email.types";

describe("Email Processing Integration Tests", () => {
   it("should process research agent request", async () => {
      const email: ParsedEmail = {
         id: "test-1",
         from: { email: "test@example.com", name: "Test User" },
         to: "research@mailagent.xyz",
         subject: "Test Research",
         body: "What is TypeScript?",
         threadId: "thread-1",
         receivedAt: new Date(),
      };

      // Should not throw
      await processEmail(email);
   });

   it("should handle meta-agent with custom address", async () => {
      const email: ParsedEmail = {
         id: "test-2",
         from: { email: "test@example.com", name: "Test User" },
         to: "write-haiku@mailagent.xyz",
         subject: "Haiku Request",
         body: "Write a haiku about code",
         threadId: "thread-2",
         receivedAt: new Date(),
      };

      await processEmail(email);
   });

   it("should reject unsafe agent addresses", async () => {
      const email: ParsedEmail = {
         id: "test-3",
         from: { email: "test@example.com", name: "Test User" },
         to: "hack-passwords@mailagent.xyz",
         subject: "Unsafe",
         body: "Test",
         threadId: "thread-3",
         receivedAt: new Date(),
      };

      // Should send error email, not crash
      await processEmail(email);
   });
});

// Run tests with: bun test
```

**Load Testing**:

```typescript
// scripts/load-test.ts
import { emailQueue } from "../src/services/queue.service";

async function loadTest() {
   const numEmails = 100;

   console.log(`Sending ${numEmails} test emails...`);

   const startTime = Date.now();

   const promises = [];
   for (let i = 0; i < numEmails; i++) {
      promises.push(
         emailQueue.add("process-email", {
            id: `load-test-${i}`,
            from: { email: `test${i}@example.com`, name: "Load Test" },
            to: "research@mailagent.xyz",
            subject: "Load Test",
            body: "What is AI?",
            threadId: `thread-${i}`,
            receivedAt: new Date(),
         })
      );
   }

   await Promise.all(promises);

   const endTime = Date.now();
   const duration = (endTime - startTime) / 1000;

   console.log(`Queued ${numEmails} emails in ${duration}s`);
   console.log(`Rate: ${(numEmails / duration).toFixed(2)} emails/sec`);
}

loadTest().catch(console.error);
```

**Acceptance Criteria**:

- [ ] All integration tests pass
- [ ] System handles 100+ emails/minute
- [ ] No memory leaks during extended operation
- [ ] Error rate < 1%

---

### Day 25-26: Polish & Documentation

**Tasks**:

1. Write comprehensive README
1. Document API/webhook format
1. Create user guide
1. Add example code snippets

**README.md**:

```markdown
# Email Agent Service

AI agents you can reach by email. No apps, no APIs—just email.

## Quick Start

Email one of our built-in agents:

- `research@mailagent.xyz` - Web research on any topic
- `summarize@mailagent.xyz` - Summarize long emails
- `write@mailagent.xyz` - Draft content

Or create a custom agent by emailing any address:

- `write-haiku-about-cats@mailagent.xyz`
- `translate-to-spanish@mailagent.xyz`
- `explain-like-im-five@mailagent.xyz`

## How It Works

1. **Send an email** to any agent address
2. **Agent processes** your request using AI
3. **Receive reply** via email (usually within 60 seconds)
4. **Continue conversation** by replying

## Features

- ✉️ Email-native interface (no apps needed)
- 🤖 Dynamic agent creation from addresses
- 🔗 Threaded conversations with context
- 🌐 Web search integration
- 🔒 Rate limiting & safety checks
- 📊 Usage dashboard

## Examples

### Research Agent
```

TO: research@mailagent.xyz
SUBJECT: AI developments

What are the latest breakthroughs in large language models?

---

[Receives detailed research with citations]

```
### Meta-Agent (Custom)
```

TO: write-product-description@mailagent.xyz
SUBJECT: Product description

[Product details]

---

[Receives compelling product description]

```
## Technical Details

Built with:
- Bun 1.0+ & TypeScript
- Hono (web framework)
- Inbound.new (email receiving)
- Claude API (AI processing)
- Redis (queuing/caching)
- Resend (email sending)

**Why Bun?**
- 3x faster than Node.js
- Native TypeScript support
- Built-in test runner
- Hot reload for development

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for setup instructions.

## License

MIT
```

**User Guide**:

```markdown
# Email Agent Service User Guide

## Getting Started

### Sending Your First Email

1. Open your email client
2. Compose a new email to `info@mailagent.xyz`
3. Ask "What can you do?"
4. Wait 30-60 seconds for a response

### Using Built-in Agents

**Research Agent** (`research@mailagent.xyz`)

- Best for: Current information, fact-finding, comparisons
- Example: "Compare the top 5 project management tools"
- Response time: ~60 seconds
- Includes citations

**Summarize Agent** (`summarize@mailagent.xyz`)

- Best for: Long email threads, meeting notes, articles
- Example: Forward long email chain
- Response time: ~30 seconds
- Extracts action items

**Write Agent** (`write@mailagent.xyz`)

- Best for: Drafting emails, posts, creative content
- Example: "Write a professional introduction email"
- Response time: ~45 seconds
- Can iterate via replies

### Creating Custom Agents

The address IS the instruction. Transform your need into an email address:

**Format**: `[action]-[details]@mailagent.xyz`

Examples:

- Need haikus? → `write-haiku@mailagent.xyz`
- Need Spanish translation? → `translate-to-spanish@mailagent.xyz`
- Need ELI5 explanations? → `explain-like-im-five@mailagent.xyz`

Tips:

- Use hyphens or underscores between words
- Be specific (but concise)
- Think "what would I tell a human to do?"

### Continuing Conversations

**Simply reply** to an agent's email to continue the conversation:
```

Initial: “Write a haiku about startups”
Reply: “Make it more cynical”
Reply: “Now make it hopeful instead”

```
The agent remembers recent context (last 5 messages).

## Limits & Guidelines

### Rate Limits
- 10 emails per hour per sender
- Exceeding limit: 1-hour cooldown

### Best Practices
- Be clear and specific
- One request per email
- Use appropriate agent for task
- Reply to iterate, don't re-send

### What Not To Do
- Don't send sensitive information
- Don't use for urgent/time-critical tasks
- Don't spam multiple similar requests
- Don't use for illegal/harmful purposes

## Troubleshooting

**No response after 2 minutes?**
- Check your spam folder
- Verify you used the correct address
- Check if you hit rate limit

**Unsatisfactory response?**
- Reply with clarification
- Try a more specific request
- Use a different agent

**Error message?**
- Read the error carefully
- Common causes: rate limit, unsafe request
- Contact support: support@mailagent.xyz

## Examples Library

### Research Tasks
```

TO: research@mailagent.xyz

- “What are the pros and cons of remote work?”
- “Compare React vs Vue for a new project”
- “Latest trends in sustainable fashion”

```
### Summarization
```

TO: summarize@mailagent.xyz

- Forward meeting notes with “Please summarize”
- Forward long article with “Key takeaways?”

```
### Writing
```

TO: write@mailagent.xyz

- “Draft a follow-up email after job interview”
- “Write a blog post intro about productivity”

```
### Custom Agents
```

TO: generate-blog-ideas@mailagent.xyz

- “I run a SaaS startup blog”

TO: explain-tech-concepts@mailagent.xyz

- “What is edge computing?”

TO: create-workout-plan@mailagent.xyz

- “I want to run a 5K in 3 months”

```
## Privacy & Security

- We don't store email content long-term
- Agent interactions are not used for training
- See [Privacy Policy](https://mailagent.xyz/privacy)

## Support

- Email: support@mailagent.xyz
- Dashboard: https://mailagent.xyz
- Status: https://status.mailagent.xyz
```

**Acceptance Criteria**:

- [ ] README is clear and complete
- [ ] User guide covers all features
- [ ] Examples are realistic and helpful
- [ ] Documentation is beginner-friendly

---

### Day 27: Launch Preparation

**Pre-Launch Checklist**:

```markdown
## Infrastructure

- [ ] Production environment configured
- [ ] DNS records propagated (48 hours)
- [ ] SSL certificates valid
- [ ] Webhook endpoints tested
- [ ] Redis cluster healthy
- [ ] Error monitoring configured (Sentry)
- [ ] Uptime monitoring (Better Uptime)

## Email Deliverability

- [ ] SPF records validated
- [ ] DKIM signing working
- [ ] DMARC policy configured
- [ ] Test emails to Gmail (check spam)
- [ ] Test emails to Outlook (check spam)
- [ ] Test emails to Apple Mail (check spam)

## Security

- [ ] Rate limiting tested
- [ ] Webhook signature verification working
- [ ] Unsafe addresses rejected
- [ ] API keys rotated to production
- [ ] Secrets stored securely

## Performance

- [ ] Load test completed (100 emails/min)
- [ ] Response time < 60s average
- [ ] Queue processing stable
- [ ] Memory usage acceptable
- [ ] Cache hit rate > 80%

## Functionality

- [ ] All built-in agents working
- [ ] Meta-agent generates good prompts
- [ ] Email threading works
- [ ] Context memory persists
- [ ] Error emails send correctly

## User Experience

- [ ] Dashboard accessible
- [ ] Documentation live
- [ ] Example emails tested
- [ ] Mobile email clients tested
- [ ] Error messages helpful

## Demo

- [ ] Demo script rehearsed
- [ ] Backup plan prepared
- [ ] Example emails pre-composed
- [ ] Screen recording ready (backup)
- [ ] Presentation slides finalized
```

**Launch Announcement**:

```markdown
# Introducing Email Agent Service

We're excited to launch Email Agent Service—AI agents you can reach by email.

## What is it?

Email any AI agent address to get intelligent responses. No apps, no APIs, no prompts—just email.

## Try it now:

**Built-in agents:**

- research@mailagent.xyz - Web research
- summarize@mailagent.xyz - Email summaries
- write@mailagent.xyz - Content drafting

**Create custom agents:**

- write-haiku-about-cats@mailagent.xyz
- translate-to-french@mailagent.xyz
- explain-like-im-five@mailagent.xyz

The address becomes the instruction.

## Why email?

- Universal (everyone has it)
- Asynchronous (AI takes time)
- Familiar (no learning curve)
- Threaded (natural conversation)

## Get started:

Visit https://mailagent.xyz for examples and documentation.

Built for the inbound.new hackathon. Feedback welcome at feedback@mailagent.xyz!
```

**Acceptance Criteria**:

- [ ] All checklist items complete
- [ ] Launch announcement ready
- [ ] Demo environment stable
- [ ] Team confident in system

---

## Post-Launch: Monitoring & Iteration

### Week 5+: Gather Feedback & Improve

**Metrics to Track**:

```typescript
// src/services/analytics.service.ts

export interface Metrics {
   // Volume
   totalEmails: number;
   emailsPerDay: number;
   uniqueSenders: number;

   // Performance
   avgResponseTime: number;
   p95ResponseTime: number;
   errorRate: number;

   // Usage
   agentDistribution: Record<string, number>;
   topMetaAgents: Array<{ address: string; count: number }>;
   threadDepth: number; // Average replies per thread

   // Quality
   bounceRate: number;
   retryRate: number;
}

export async function getMetrics(timeRange: string): Promise<Metrics> {
   // Implementation
}
```

**User Feedback Collection**:

```typescript
// After each email response, include:
const feedbackFooter = `
---
Was this response helpful? Reply with:
- "yes" for good response
- "no" for poor response
- "feedback: [your comments]" for detailed feedback
`;
```

**Iteration Priorities**:

1. **Week 5**: Fix critical bugs, improve response quality
1. **Week 6**: Add most-requested agents
1. **Week 7**: Improve meta-agent prompt generation
1. **Week 8**: Add attachments support (images, PDFs)

---

## Cost Estimates

### Infrastructure Costs (Monthly)

| Service         | Tier                | Cost           |
| --------------- | ------------------- | -------------- |
| Railway/Fly.io  | Hobby               | $5-10          |
| Redis (Upstash) | Free/Paid           | $0-10          |
| Resend          | Free → 3K emails/mo | $0-20          |
| Claude API      | $3/$15 per MTok     | $50-200        |
| Domain          | .xyz                | $12/year       |
| **Total**       |                     | **$60-250/mo** |

### Per-Email Cost Breakdown

**Assumptions**:

- Average email: 500 tokens in, 1000 tokens out
- Claude Sonnet 4: $3/MTok input, $15/MTok output

```
Input:  500 tokens × $3/MTok  = $0.0015
Output: 1000 tokens × $15/MTok = $0.015
Total: ~$0.017 per email
```

**Scaling**:

- 100 emails/day = $51/month
- 500 emails/day = $255/month
- 1000 emails/day = $510/month

### Cost Optimization Strategies

1. **Caching**: Cache meta-agent prompts (saves 50% of calls)
1. **Rate limiting**: Prevents abuse/runaway costs
1. **Prompt optimization**: Shorter system prompts
1. **Response length limits**: Cap at 2K tokens output
1. **Haiku for simple tasks**: Use cheaper model when possible

---

## Risk Mitigation

### Technical Risks

| Risk                        | Impact | Mitigation                                    |
| --------------------------- | ------ | --------------------------------------------- |
| Email deliverability issues | High   | Test with multiple providers, proper SPF/DKIM |
| API rate limits/downtime    | High   | Exponential backoff, queue system             |
| Abuse/spam                  | Medium | Rate limiting, address validation             |
| Cost overruns               | Medium | Per-user limits, monitoring alerts            |
| Thread context loss         | Low    | Redis persistence, backup strategy            |

### Product Risks

| Risk                    | Impact | Mitigation                          |
| ----------------------- | ------ | ----------------------------------- |
| Poor meta-agent quality | High   | Extensive testing, fallback prompts |
| Slow response times     | High   | Async processing, set expectations  |
| User confusion          | Medium | Clear documentation, helpful errors |
| Privacy concerns        | Medium | Transparent data policy             |

### Demo Risks

| Risk                  | Mitigation                   |
| --------------------- | ---------------------------- |
| Live demo fails       | Pre-record backup video      |
| Slow AI responses     | Queue demo emails in advance |
| Webhook issues        | Test repeatedly beforehand   |
| Internet connectivity | Have mobile hotspot backup   |

---

## Success Metrics for Hackathon

### Minimum Viable Demo

- [ ] 3+ built-in agents working
- [ ] Meta-agent creates coherent agents from addresses
- [ ] Email threading maintains context
- [ ] Dashboard shows live activity
- [ ] Response time < 90 seconds

### Impressive Demo

- [ ] All of MVP +
- [ ] 10+ successful meta-agents created
- [ ] Web search integration working
- [ ] Context memory across thread
- [ ] <60 second average response time
- [ ] Zero crashes during demo

### Winning Demo

- [ ] All of Impressive +
- [ ] Novel agent addresses (surprising/delightful)
- [ ] Smooth multi-turn conversations
- [ ] Clear differentiation from competitors
- [ ] Production-ready polish
- [ ] Strong technical narrative

---

## Resources & References

### Documentation

- [Inbound.new Docs](https://inbound.new/docs)
- [Claude API Docs](https://docs.anthropic.com)
- [Resend Docs](https://resend.com/docs)
- [BullMQ Guide](https://docs.bullmq.io)

### Example Code

- [LangGraph Email Agents](https://github.com/langchain-ai/langgraph-agents)
- [Email Parser Libraries](https://github.com/nodemailer/mailparser)
- [Webhook Security](https://docs.svix.com/receiving/verifying-payloads/how)

### Inspiration

- Mindy.com (m@mindy.com approach)
- Mixus.com (team agents)
- Perplexity Assistant (premium positioning)

---

## Appendix: Code Snippets

### Quick Deploy Script

```bash
#!/bin/bash
# deploy.sh

echo "Deploying Email Agent Service..."

# Install dependencies
bun install

# Run tests
bun test

# Build is not needed - Bun runs TypeScript directly

# Deploy to Railway
railway up

# Verify deployment
curl https://api.mailagent.xyz/health

echo "Deployment complete!"
```

### Health Check Endpoint

```typescript
// src/routes/health.ts
import { Hono } from "hono";

const app = new Hono();

app.get("/health", async (c) => {
   const checks = {
      redis: await checkRedis(),
      claude: await checkClaudeAPI(),
      email: await checkEmailSending(),
      queue: await checkQueue(),
   };

   const healthy = Object.values(checks).every((check) => check);

   return c.json(
      {
         status: healthy ? "healthy" : "degraded",
         checks,
         timestamp: new Date(),
      },
      healthy ? 200 : 503
   );
});
```

---

## Timeline Summary

| Week | Focus          | Key Deliverables                        |
| ---- | -------------- | --------------------------------------- |
| 1    | Infrastructure | Webhook, parsing, queue, 2 basic agents |
| 2    | Core Agents    | Research, Summarize, Write agents       |
| 3    | Meta-Agent     | Dynamic agent creation, caching, memory |
| 4    | Launch         | Dashboard, demo prep, documentation     |

**Critical Path**:
Webhook → Queue → Base Agent → Meta-Agent → Demo

**Can Skip If Time-Constrained**:

- Dashboard (use logs instead)
- Context memory (stateless is fine)
- Advanced error handling
- Load testing

**Must Have**:

- Reliable webhook processing
- Working meta-agent
- 2+ built-in agents
- Email threading

---

_Good luck with the hackathon! This is a genuinely innovative take on email-AI integration._
