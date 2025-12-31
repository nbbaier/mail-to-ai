# Developer Platform & SDK

**Category:** Integration
**Quarter:** Q4
**T-shirt Size:** L

## Why This Matters

Mail-to-AI is currently a **closed system**. You can use the built-in agents or create custom ones via meta-agent, but you can't programmatically extend it. Developers can't build on top of it, integrate it into their products, or create custom agent behaviors.

A developer platform transforms Mail-to-AI from a product into a **platform**:
- Developers build custom agents with code
- Companies integrate AI email handling into their products
- An ecosystem of tools and extensions emerges
- Mail-to-AI becomes infrastructure, not just an app

The most valuable tech companies are platforms (Stripe, Twilio, Cloudflare). This initiative puts Mail-to-AI on that path.

## Current State

**What exists:**
- No public API
- No SDK
- No developer documentation
- No way to programmatically create agents
- No custom code execution in agents
- No webhook notifications
- No self-hosting option

**What developers want:**
```javascript
// This doesn't exist today
import { MailToAI } from '@mail-to-ai/sdk';

const client = new MailToAI({ apiKey: 'sk-...' });

const agent = await client.agents.create({
  name: 'customer-support',
  prompt: 'You are a helpful customer support agent...',
  tools: ['knowledge_base', 'ticket_system'],
});

await agent.handle({
  from: 'customer@example.com',
  subject: 'Help with my order',
  body: 'Where is my package?',
});
```

## Proposed Future State

A complete developer platform with APIs, SDKs, and extensibility:

### REST API
```
API Base: https://api.mail-to-ai.com/v1

Endpoints:
├── /agents
│   ├── GET    /agents              List all agents
│   ├── POST   /agents              Create new agent
│   ├── GET    /agents/:id          Get agent details
│   ├── PATCH  /agents/:id          Update agent
│   └── DELETE /agents/:id          Delete agent
│
├── /messages
│   ├── POST   /messages            Send message to agent
│   ├── GET    /messages/:id        Get message status
│   └── GET    /messages/:id/reply  Get agent reply
│
├── /workflows
│   ├── GET    /workflows           List workflows
│   ├── POST   /workflows           Create workflow
│   └── POST   /workflows/:id/run   Trigger workflow
│
├── /webhooks
│   ├── GET    /webhooks            List webhooks
│   ├── POST   /webhooks            Create webhook
│   └── DELETE /webhooks/:id        Delete webhook
│
└── /usage
    └── GET    /usage               Get usage statistics
```

### TypeScript SDK
```typescript
import { MailToAI } from '@mail-to-ai/sdk';

const mta = new MailToAI({ apiKey: process.env.MAIL_TO_AI_KEY });

// Create a custom agent
const agent = await mta.agents.create({
  address: 'support@yourcompany.com',  // Your domain
  name: 'Customer Support',
  systemPrompt: `You are a customer support agent for Acme Corp.
    Use the knowledge base to answer questions.
    Create tickets for issues you can't resolve.`,
  tools: ['knowledgeBase', 'ticketSystem'],
  model: 'claude-sonnet-4',
});

// Handle incoming email programmatically
mta.webhooks.on('email.received', async (email) => {
  // Custom preprocessing
  const enrichedEmail = await enrichWithCRM(email.from);

  // Send to agent
  const response = await agent.process({
    ...email,
    context: enrichedEmail,
  });

  // Custom postprocessing
  await logToAnalytics(email, response);
});

// Send a message directly
const reply = await mta.messages.send({
  agent: 'support@yourcompany.com',
  from: 'test@example.com',
  subject: 'Test',
  body: 'Is this working?',
});

console.log(reply.text);
```

### Custom Tool Definition
```typescript
// Define a custom tool for your agent
const ticketTool = mta.tools.define({
  name: 'create_ticket',
  description: 'Creates a support ticket in the ticketing system',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      description: { type: 'string' },
    },
    required: ['title', 'description'],
  },
  execute: async (params) => {
    // Your custom logic
    const ticket = await yourTicketSystem.create(params);
    return { ticketId: ticket.id, url: ticket.url };
  },
});

// Use in agent
const agent = await mta.agents.create({
  address: 'support@yourcompany.com',
  tools: [ticketTool, 'webSearch'],  // Mix custom and built-in
});
```

### Developer Portal
```
┌─────────────────────────────────────────────────────────────┐
│  Mail-to-AI Developer Portal                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  API Keys                                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ sk-live-abc...xyz     Production   [Reveal] [Delete]│    │
│  │ sk-test-123...789     Development  [Reveal] [Delete]│    │
│  └────────────────────────────────────────────────────┘    │
│  [+ Create New Key]                                         │
│                                                             │
│  Webhooks                                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ https://api.yourapp.com/mail-webhook               │    │
│  │ Events: email.received, email.replied, agent.error │    │
│  │ Status: Active ✅  Last delivery: 2 minutes ago    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  Usage This Month                                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │ API Calls: 12,847 / 100,000                        │    │
│  │ Emails Processed: 3,291 / 10,000                   │    │
│  │ Agent Minutes: 847 / 5,000                         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  Documentation    Changelog    Support    Status           │
└─────────────────────────────────────────────────────────────┘
```

## Key Deliverables

- [ ] Design and implement REST API (OpenAPI spec first)
- [ ] Build API key management system
- [ ] Create TypeScript SDK with full type safety
- [ ] Create Python SDK
- [ ] Implement webhook system for event notifications
- [ ] Build custom tool definition API
- [ ] Create developer portal web application
- [ ] Write comprehensive API documentation
- [ ] Build API playground (interactive testing)
- [ ] Implement rate limiting per API key
- [ ] Add usage tracking and quotas
- [ ] Create SDK examples and tutorials
- [ ] Build CLI tool for agent management
- [ ] Implement API versioning strategy
- [ ] Create self-hosting documentation (Docker, k8s)
- [ ] Build integration templates (Zapier, Make, n8n)

## Prerequisites

- **Initiative #2 (Authentication)**: API keys require user accounts
- **Initiative #4 (Tools)**: Custom tools depend on tool infrastructure
- **Initiative #1 (Testing)**: API needs thorough testing

## Risks & Open Questions

- **API stability**: How do we version the API? Breaking changes will frustrate developers.
- **Rate limiting**: What limits are fair? How do we handle burst traffic?
- **Custom tool security**: Arbitrary code execution is dangerous. How do we sandbox?
- **Documentation maintenance**: API docs go stale fast. How do we keep them updated?
- **Support burden**: Developers expect support. How do we scale developer support?
- **Self-hosting complexity**: Cloudflare-native architecture is hard to self-host. Worth the effort?
- **Pricing**: API access is a different value proposition. How do we price it?

## Notes

**API design principles:**
- RESTful with predictable URLs
- JSON request/response bodies
- Bearer token authentication
- Consistent error format
- Pagination on list endpoints
- Idempotency keys for POST requests

**SDK distribution:**
- TypeScript: `@mail-to-ai/sdk` on npm
- Python: `mail-to-ai` on PyPI
- Go: `github.com/mail-to-ai/go-sdk`

**Webhook events:**
```typescript
type WebhookEvent =
  | 'email.received'      // New email arrived
  | 'email.queued'        // Email queued for processing
  | 'email.processing'    // Agent is processing
  | 'email.replied'       // Reply sent
  | 'email.failed'        // Processing failed
  | 'agent.created'       // New agent created
  | 'agent.updated'       // Agent config changed
  | 'workflow.started'    // Workflow began
  | 'workflow.completed'  // Workflow finished
  | 'workflow.failed';    // Workflow errored
```

**Self-hosting options:**
1. **Full self-host**: Docker Compose with Workers, D1, R2 equivalents
2. **Hybrid**: Self-host API, use Mail-to-AI for email handling
3. **Bring your own LLM**: Use self-hosted API but BYOK for Claude/OpenAI

**Developer pricing tiers:**
- **Free**: 1,000 API calls/month, 100 emails
- **Developer ($49/mo)**: 50,000 API calls, 5,000 emails, webhooks
- **Pro ($199/mo)**: 500,000 API calls, 50,000 emails, custom tools
- **Enterprise**: Unlimited, SLA, dedicated support

**Related files:**
- New: `src/routes/api/v1/*.ts` - API endpoints
- New: `packages/sdk-ts/` - TypeScript SDK
- New: `packages/sdk-python/` - Python SDK
- New: `docs/api/` - API documentation
- New: `website/src/pages/Developers.tsx` - Developer portal
