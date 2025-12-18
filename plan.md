# Email-to-AI Agent MVP: Implementation Plan

## Project Overview

**Goal**: Build a functional email-to-AI agent service for the inbound.new hackathon that demonstrates both pre-built agents and dynamic "meta-agent" creation from arbitrary email addresses.

**Core Innovation**: Meta-agent that infers task from email address (e.g., `write-haiku-about-cats@domain.com`)

---

## MVP Scope

### What We're Building

1. **3 Built-in Agents**
   - `summarize@` - Summarizes email content, articles, meeting notes
   - `research@` - Web search-enabled research assistant
   - `info@` - General information/help agent (✅ exists)

2. **Meta-Agent**
   - Interprets arbitrary email addresses as task instructions
   - `explain-quantum-physics@` → agent that explains quantum physics
   - Caches generated prompts for efficiency

3. **Landing Page Frontend**
   - Explains the service and value proposition
   - Shows the 3 built-in agents with their prompts
   - Demonstrates meta-agent concept with examples
   - Simple, clean design

### What We're NOT Building (Cut from Original Plan)

- ❌ Dashboard with real-time activity metrics
- ❌ Context memory across email threads (stateless is fine)
- ❌ User analytics/tracking system
- ❌ Advanced error handling UI
- ❌ Feedback collection system
- ❌ Write agent (meta-agent handles this)
- ❌ Tool selection logic (just web search on research agent)
- ❌ Load testing infrastructure

---

## Technical Architecture

### System Design

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
│  CF Worker      │ (Hono API)
│  - Verify HMAC  │
│  - Parse Email  │
│  - Route Agent  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CF Queue       │ (Async Processing)
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Agent (Durable Object)  │
│  - Load/Generate Prompt │
│  - Call Claude API      │
│  - Format Reply         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────┐
│ Inbound.new     │ (Reply via SDK)
│ Email Reply     │
└─────────────────┘
```

### Tech Stack

| Component       | Technology             | Status |
| --------------- | ---------------------- | ------ |
| Email Receiving | inbound.new            | ✅     |
| Backend Runtime | Cloudflare Workers     | ✅     |
| Web Framework   | Hono                   | ✅     |
| Queue           | Cloudflare Queues      | ✅     |
| Cache           | Cloudflare KV          | ✅     |
| Agents          | Cloudflare Durable Obj | ✅     |
| AI/LLM          | Vercel AI SDK + Claude | ✅     |
| Email Sending   | inbound.new SDK        | ✅     |
| Frontend        | Static HTML/Tailwind   | ❌     |

---

## Current Implementation Status

### ✅ Completed

- [x] Cloudflare Workers project structure
- [x] Hono server with webhook endpoint
- [x] HMAC signature verification
- [x] Email parsing utilities
- [x] Cloudflare Queue for async processing
- [x] Base agent class with Vercel AI SDK
- [x] EchoAgent (testing)
- [x] InfoAgent (basic)
- [x] Agent router
- [x] Email reply via inbound.new SDK
- [x] Rate limiting with KV
- [x] Deploy to Cloudflare Workers

### 🟡 In Progress / TODO

- [ ] **SummarizeAgent** - Summarization specialist
- [ ] **ResearchAgent** - Web search capability
- [ ] **MetaAgent** - Dynamic agent from address
- [ ] **Landing Page** - Frontend explaining the service
- [ ] DNS configuration (MX, SPF, DKIM)
- [ ] Production secrets setup

---

## Remaining Work

### Phase 1: Core Agents (Priority 0-1)

#### 1. SummarizeAgent

**File**: `src/agents/summarize-agent.ts`

```typescript
// System prompt
"You are a summarization specialist. Extract key points, main arguments,
and essential information from the content provided. Use bullet points
for clarity. Maintain accuracy while being concise."
```

**Address**: `summarize@domain.com`

#### 2. ResearchAgent

**File**: `src/agents/research-agent.ts`

```typescript
// System prompt
"You are a research assistant with web search capability. Find accurate,
up-to-date information. Cite sources with URLs. Synthesize findings
into clear, well-organized responses."
```

**Address**: `research@domain.com`
**Tools**: Claude web search

#### 3. MetaAgent

**File**: `src/agents/meta-agent.ts`

Core logic:

1. Parse address → instruction: `write-haiku-about-cats` → "write haiku about cats"
2. Use Claude to generate system prompt from instruction
3. Cache prompt in KV (7-day TTL)
4. Process email with generated prompt

### Phase 2: Frontend (Priority 1)

#### Landing Page

**File**: `src/routes/landing.ts` or static HTML

Content:

- Hero: "AI Agents You Can Email"
- Value prop: No apps, no APIs, just email
- Built-in agents section with prompts
- Meta-agent explanation with examples
- Try it now: email addresses to test

Design: Clean, minimal, Tailwind CSS

### Phase 3: Production (Priority 1)

- DNS configuration for custom domain
- Production secrets in Cloudflare
- End-to-end testing

---

## Agent Specifications

### Built-in Agents

| Agent     | Address            | Purpose                     | Tools      |
| --------- | ------------------ | --------------------------- | ---------- |
| Info      | `info@domain`      | General help, how to use    | None       |
| Summarize | `summarize@domain` | Summarize content           | None       |
| Research  | `research@domain`  | Web research with citations | Web search |

### Meta-Agent Examples

| Address                   | Generated Behavior      |
| ------------------------- | ----------------------- |
| `write-haiku-about-cats@` | Composes cat haikus     |
| `explain-like-im-five@`   | Simple explanations     |
| `translate-to-french@`    | French translation      |
| `code-review@`            | Reviews code snippets   |
| `generate-blog-ideas@`    | Brainstorms blog topics |

---

## Success Criteria

### Minimum Viable Demo

- [ ] 3 built-in agents working (info, summarize, research)
- [ ] Meta-agent creates coherent agents from addresses
- [ ] Response time < 90 seconds
- [ ] Landing page live and explains service

### Nice to Have

- [ ] Prompt caching for meta-agent
- [ ] Safety validation for addresses
- [ ] Email threading works

---

## File Structure

```
src/
├── agents/
│   ├── base-agent.ts      ✅
│   ├── echo-agent.ts      ✅
│   ├── info-agent.ts      ✅
│   ├── summarize-agent.ts ❌
│   ├── research-agent.ts  ❌
│   ├── meta-agent.ts      ❌
│   └── index.ts           ✅
├── routes/
│   ├── webhook.ts         ✅
│   └── landing.ts         ❌
├── services/
│   ├── agent-router.ts    ✅
│   ├── email-processor.ts ✅
│   └── email-sender.ts    ✅
├── utils/
│   ├── email-parser.ts    ✅
│   ├── rate-limiter.ts    ✅
│   └── safety-validator.ts ❌
├── types/
│   └── index.ts           ✅
└── index.ts               ✅
```

---

## Quick Reference

### Local Development

```bash
pnpm install
pnpm run dev
```

### Deploy

```bash
pnpm run deploy
```

### Typecheck

```bash
pnpm run typecheck
```

### Set Secrets

```bash
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put INBOUND_API_KEY
wrangler secret put INBOUND_WEBHOOK_SECRET
```
