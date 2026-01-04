# Mail-to-AI

AI agents you can reach by email. No apps, no APIs—just email.

Built for the [inbound.new](https://inbound.new) hackathon.

## Try It Now

Email any of our built-in agents:

| Agent         | Address                    | What it does                                 |
| ------------- | -------------------------- | -------------------------------------------- |
| **Research**  | `research@mail-to-ai.com`  | Web research on any topic with cited sources |
| **Summarize** | `summarize@mail-to-ai.com` | Condense long emails/docs into key points    |
| **Info**      | `info@mail-to-ai.com`      | Learn about the service                      |
| **Echo**      | `echo@mail-to-ai.com`      | Test agent that echoes your message          |

### Meta-Agent: Create Any Agent

Email **any address** to create a custom agent on the fly. The address becomes the instruction:

```
write-haiku-about-cats@mail-to-ai.com
translate-to-spanish@mail-to-ai.com
explain-like-im-five@mail-to-ai.com
code-review@mail-to-ai.com
generate-blog-ideas@mail-to-ai.com
```

**Supported address formats:**

- `kebab-case`: `write-haiku-about-cats@`
- `snake_case`: `write_haiku_about_cats@`
- `camelCase`: `writeHaikuAboutCats@`

## How It Works

```
┌─────────────────┐
│  Your Email     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Inbound.new    │  Email reception & webhook
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cloudflare     │  Route to agent, process async
│  Worker + Queue │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Agent       │  Claude generates response
│  (Durable Obj)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Email Reply    │  Sent via inbound.new SDK
└─────────────────┘
```

1. **Send an email** to any agent address
2. **Agent processes** your request using Claude
3. **Receive reply** via email (usually within 60 seconds)
4. **Continue conversation** by replying—agents maintain context

## Built-in Agent Details

### Research Agent (`research@`)

Uses Anthropic's web search tool to find current, accurate information with cited sources.

**Example email:**

```
Subject: Latest AI developments
Body: What are the most significant AI breakthroughs in the last month?
```

### Summarize Agent (`summarize@`)

Extracts key points, action items, and essential information from long content.

**Example email:**

```
Subject: Please summarize
Body: [paste your long email thread, article, or meeting notes]
```

**Response format:**

- **Summary**: 1-3 sentence overview
- **Key Points**: Bullet list of important details
- **Action Items**: Tasks and next steps (if applicable)

### Meta-Agent (any address)

Dynamically creates a specialized agent based on the email address. The generated behavior is cached for 7 days.

**How it works:**

1. Parses the address: `write-haiku-about-cats` → "write haiku about cats"
2. Generates a focused system prompt using Claude
3. Processes your email with that custom prompt
4. Caches the prompt for future emails to the same address

## Development

### Prerequisites

- Node.js 18+ or Bun
- [Cloudflare account](https://dash.cloudflare.com) (Workers, Queues, KV)
- [Inbound.new account](https://inbound.new) (email receiving/sending)
- [Anthropic API key](https://console.anthropic.com) (Claude)

### Local Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/nbbaier/mail-to-ai.git
   cd mail-to-ai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   Copy `.env.example` to `.dev.vars` and fill in your API keys:

   ```bash
   cp .env.example .dev.vars
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Commands

| Command               | Description                          |
| --------------------- | ------------------------------------ |
| `npm run dev`         | Start local development with Alchemy |
| `npm run deploy`      | Deploy to Cloudflare (dev stage)     |
| `npm run deploy:prod` | Deploy to production                 |
| `npm run typecheck`   | Run TypeScript type checking         |
| `npm run test`        | Run tests with Vitest                |

### Environment Variables

Create a `.dev.vars` file for local development:

```env
INBOUND_API_KEY=your_inbound_api_key
INBOUND_WEBHOOK_SECRET=your_webhook_secret
ANTHROPIC_API_KEY=your_anthropic_api_key
```

For production, set secrets in Cloudflare:

```bash
wrangler secret put INBOUND_API_KEY
wrangler secret put INBOUND_WEBHOOK_SECRET
wrangler secret put ANTHROPIC_API_KEY
```

### Project Structure

```
src/
├── agents/
│   ├── base-agent.ts       # Base class with conversation history
│   ├── echo-agent.ts       # Test agent
│   ├── info-agent.ts       # Service information
│   ├── research-agent.ts   # Web search research
│   ├── summarize-agent.ts  # Content summarization
│   ├── meta-agent.ts       # Dynamic agent generation
│   └── index.ts            # Agent exports
├── routes/
│   ├── webhook.ts          # Inbound.new webhook handler
│   └── landing.ts          # Landing page
├── services/
│   ├── agent-router.ts     # Routes emails to correct agent
│   ├── email-processor.ts  # Queue consumer
│   └── email-sender.ts     # Reply sending
├── utils/
│   ├── email-parser.ts     # Parse incoming emails
│   ├── rate-limiter.ts     # KV-based rate limiting
│   └── safety-validator.ts # Content safety checks
├── types/
│   └── index.ts            # TypeScript types
└── index.ts                # Main Hono app
```

## Tech Stack

| Component        | Technology                                                                 |
| ---------------- | -------------------------------------------------------------------------- |
| Email I/O        | [inbound.new](https://inbound.new)                                         |
| Runtime          | [Cloudflare Workers](https://workers.cloudflare.com)                       |
| Framework        | [Hono](https://hono.dev)                                                   |
| Async Processing | [Cloudflare Queues](https://developers.cloudflare.com/queues/)             |
| Agent State      | [Durable Objects](https://developers.cloudflare.com/durable-objects/)      |
| Caching          | [Cloudflare KV](https://developers.cloudflare.com/kv/)                     |
| AI/LLM           | [Claude](https://anthropic.com) via [Vercel AI SDK](https://sdk.vercel.ai) |
| IaC              | [Alchemy](https://alchemy.sh)                                              |

## Rate Limits

- **Per sender**: 10 emails per hour
- **Meta-agent prompt cache**: 7 days TTL

## License

MIT
