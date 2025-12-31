# Multi-Channel Integration

**Category:** New Feature
**Quarter:** Q3
**T-shirt Size:** L

## Why This Matters

Email is powerful because it's **universal**—everyone has it, it's async, and it's professional. But email isn't where all conversations happen. Teams live in Slack. Developers live in Discord. Knowledge workers bounce between all three.

Multi-channel integration means users can access their AI agents **wherever they already are**. The same `code-review` agent that responds to email could also respond to a Slack mention or a Discord message. Same agent, same context, any channel.

This isn't about abandoning email—it's about making email the **hub** of a multi-channel experience.

## Current State

- **Email only**: inbound.new for receiving, SDK for sending
- **No Slack integration**: Can't mention @mail-to-ai in Slack
- **No Discord integration**: No bot presence
- **No webhook API**: Can't programmatically send requests
- **No SMS/WhatsApp**: No mobile messaging support

**User friction**: Someone wants to use `research@` from Slack. Today, they'd have to:
1. Open email client
2. Compose email
3. Wait for response
4. Copy response back to Slack

That's too much friction for quick questions.

## Proposed Future State

A unified agent interface across multiple channels:

### Channel Architecture
```
                    ┌─────────────────┐
     Email ───────► │                 │
     Slack ───────► │   Agent Core    │ ◄─── Same agents
    Discord ───────► │   (Unified)     │      Same context
    Webhook ───────► │                 │      Any channel
        SMS ───────► └─────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │  Durable Object State   │
              │  (per-user, per-agent)  │
              └─────────────────────────┘
```

### Slack Integration
```
User in #engineering:
@mail-to-ai code-review
```python
def fib(n):
    return fib(n-1) + fib(n-2)
```

Mail-to-AI Bot responds in thread:
> 🔍 **Code Review** (via code-review@)
>
> **Issues found:**
> 1. Missing base case - this will cause infinite recursion
> 2. No memoization - exponential time complexity
>
> **Suggested fix:**
> ```python
> def fib(n, memo={}):
>     if n < 2: return n
>     if n not in memo:
>         memo[n] = fib(n-1, memo) + fib(n-2, memo)
>     return memo[n]
> ```
```

### Discord Integration
```
User in #dev-help:
/agent research What's new in React 19?

Mail-to-AI Bot responds:
📚 **Research Results**

React 19 introduces several key features:
1. **React Compiler** - Automatic memoization
2. **Server Components** - Stable and production-ready
...

[Sources: react.dev, blog.react.dev]
```

### Webhook API
```bash
curl -X POST https://api.mail-to-ai.com/v1/agents/research \
  -H "Authorization: Bearer sk-..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the latest AI developments?",
    "context": { "thread_id": "thread-123" }
  }'
```

## Key Deliverables

- [ ] Design unified message format (normalize across channels)
- [ ] Create channel adapter interface (email, slack, discord, webhook)
- [ ] Build Slack app with bot user and slash commands
- [ ] Implement Discord bot with slash commands and mentions
- [ ] Create webhook API for programmatic access
- [ ] Implement conversation threading across channels (same thread, different channels)
- [ ] Add channel-specific formatting (Slack mrkdwn, Discord markdown, email HTML)
- [ ] Build cross-channel context sync (continue Slack convo in email)
- [ ] Create channel preferences (user chooses where to receive responses)
- [ ] Implement rate limiting per channel
- [ ] Add SMS/WhatsApp support via Twilio
- [ ] Build Microsoft Teams integration
- [ ] Create unified notification system (user picks channel for alerts)
- [ ] Add channel analytics (usage by channel, response quality)

## Prerequisites

- **Initiative #2 (Authentication)**: Need user accounts for API keys and channel linking
- **Initiative #5 (Observability)**: Multi-channel debugging is complex

## Risks & Open Questions

- **Context confusion**: If a user starts in Slack and continues in email, how do we merge context cleanly?
- **Feature parity**: Should all agents work in all channels? Some features (like file attachments) work better in email.
- **Response format**: Email allows rich HTML. Slack has mrkdwn. Discord has its own markdown. How do we handle this gracefully?
- **Platform approval**: Slack and Discord have app review processes. What if they reject us?
- **Message limits**: Slack has 4000 char limit. Discord has 2000. Long responses need splitting.
- **Latency expectations**: Email users expect minutes. Slack users expect seconds. Can we meet both?
- **Cost**: Each platform has API limits and potentially costs. How does this affect pricing?

## Notes

**Platform-specific considerations:**

**Slack:**
- App manifest for OAuth scopes
- Socket mode vs HTTP for events
- Slash commands: `/agent research [query]`
- Mentions: `@mail-to-ai [agent] [message]`
- Threading is native and expected

**Discord:**
- Bot token and OAuth2
- Slash commands require application commands registration
- Rate limits are strict
- Rich embeds for formatted responses
- Guild-specific vs global commands

**Webhook API:**
- REST + streaming for long responses
- API key authentication
- Rate limiting per key
- OpenAPI spec for documentation
- SDK generation (TypeScript, Python)

**Channel adapter design:**
```typescript
interface ChannelAdapter {
  name: 'email' | 'slack' | 'discord' | 'webhook' | 'sms';

  // Receive messages
  parseIncoming(raw: unknown): Message;

  // Send responses
  formatResponse(response: AgentResponse): ChannelMessage;
  send(message: ChannelMessage): Promise<void>;

  // Threading
  getThreadId(message: Message): string;
  replyInThread(threadId: string, response: ChannelMessage): Promise<void>;
}
```

**Cross-channel thread example:**
1. User emails `research@` with question
2. Agent responds via email
3. User opens Slack, types `@mail-to-ai continue email thread`
4. Agent retrieves email context, continues in Slack
5. User replies in Slack
6. Agent has unified context across both channels

**Related files:**
- `src/services/email-processor.ts` → generalize to `message-processor.ts`
- `src/agents/base-agent.ts` - channel-aware formatting
- New: `src/channels/slack.ts`
- New: `src/channels/discord.ts`
- New: `src/channels/webhook.ts`
- New: `src/routes/api/v1/agents.ts`
