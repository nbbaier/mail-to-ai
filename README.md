# Mail-to-AI

AI agents you can reach by email. No apps, no APIs—just email.

## Quick Start

Email one of our built-in agents:

- `echo@mail-to-ai.com` - Test agent that echoes back your message
- `info@mail-to-ai.com` - Information about the service

Or create a custom agent by emailing any address (coming soon):

- `write-haiku-about-cats@mail-to-ai.com`
- `translate-to-spanish@mail-to-ai.com`
- `explain-like-im-five@mail-to-ai.com`

## How It Works

1. **Send an email** to any agent address
2. **Agent processes** your request using AI (Claude)
3. **Receive reply** via email (usually within 60 seconds)
4. **Continue conversation** by replying

## Development

### Prerequisites

- Node.js 18+ or Bun
- Cloudflare account (for Workers and Queues)
- Inbound.new account (for email)
- Anthropic API key (for Claude)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.dev.vars` and fill in your API keys
4. Start the development server:
   ```bash
   npm run dev
   ```

### Environment Variables

Set these as secrets in Cloudflare:

```bash
wrangler secret put INBOUND_API_KEY
wrangler secret put INBOUND_WEBHOOK_SECRET
wrangler secret put ANTHROPIC_API_KEY
```

### Deployment

```bash
npm run deploy
```

## Architecture

```
┌─────────────────┐
│  Sender Email   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Inbound.new    │ (Email Reception)
└────────┬────────┘
         │ Webhook POST
         ▼
┌─────────────────┐
│  Cloudflare     │ (Hono API)
│  Worker         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cloudflare     │ (Async Processing)
│  Queue          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Agent Processor │
│  - Route Agent  │
│  - Call Claude  │
│  - Format Reply │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Inbound.new    │ (Email Sending)
└─────────────────┘
```

## Tech Stack

| Component        | Technology         |
| ---------------- | ------------------ |
| Email            | inbound.new        |
| Backend          | Cloudflare Workers |
| Framework        | Hono               |
| Queue            | Cloudflare Queues  |
| Cache/Rate Limit | Cloudflare KV      |
| AI/LLM           | Claude (Anthropic) |

## License

MIT
