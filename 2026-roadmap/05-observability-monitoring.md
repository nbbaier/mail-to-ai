# Observability & Production Monitoring

**Category:** DX Improvement
**Quarter:** Q1
**T-shirt Size:** M

## Why This Matters

Right now, debugging Mail-to-AI in production is **flying blind**. The only visibility is `console.log` statements viewed via `wrangler tail`. There's no way to:

- Know if errors are happening (unless users complain)
- Understand performance patterns
- Track business metrics (usage, growth)
- Debug specific email failures
- Proactively identify issues before users notice

For a service where users **wait for email responses**, reliability is everything. A silent failure means a user waiting indefinitely for an email that never comes. This erodes trust fast.

Observability isn't glamorous, but it's the difference between "production-ready" and "probably works."

## Current State

**What exists:**
- `console.log()` throughout codebase (JSON-formatted, good)
- KV-based rate limit tracking (per-sender counts)
- Basic stats tracking in KV (total emails, agent usage)
- Dead Letter Queue exists but isn't monitored

**What's missing:**
- No error tracking (Sentry, Datadog, etc.)
- No alerting (PagerDuty, OpsGenie)
- No APM (request tracing, latency percentiles)
- No dashboards (Grafana, custom)
- No business metrics (DAU, retention, agent popularity)
- No log aggregation (logs disappear after `wrangler tail` closes)
- No health checks (uptime monitoring)

**Blind spots:**
- If Claude API is slow, we don't know until users complain
- If rate limiting is too aggressive, we have no visibility
- If meta-agent generates bad prompts, we can't review them
- If DLQ fills up, no one is alerted

## Proposed Future State

Comprehensive observability across three pillars:

### 1. Error Tracking & Alerting
```
┌─────────────────────────────────────────────────────────────┐
│  Sentry Dashboard                                           │
│  ──────────────────────────────────────────────────────────│
│  ⚠️ New issue: "Anthropic API timeout" - 23 occurrences    │
│     First seen: 2 hours ago                                 │
│     Affected users: 12                                      │
│     Stack trace: meta-agent.ts:142                          │
│  ──────────────────────────────────────────────────────────│
│  📈 Error rate: 0.3% (up from 0.1% yesterday)              │
└─────────────────────────────────────────────────────────────┘
```

### 2. Performance Monitoring
```
┌─────────────────────────────────────────────────────────────┐
│  APM Dashboard                                              │
│  ──────────────────────────────────────────────────────────│
│  Email Processing Pipeline                                  │
│  ──────────────────────────────────────────────────────────│
│  Webhook → Parse: 12ms (p50) / 45ms (p99)                  │
│  Parse → Queue: 3ms                                         │
│  Queue → Agent: 89ms                                        │
│  Agent → Claude: 2.3s (p50) / 8.1s (p99)  ⚠️              │
│  Claude → Reply: 156ms                                      │
│  ──────────────────────────────────────────────────────────│
│  Total: 2.6s (p50) / 8.4s (p99)                            │
└─────────────────────────────────────────────────────────────┘
```

### 3. Business Metrics
```
┌─────────────────────────────────────────────────────────────┐
│  Business Dashboard                                         │
│  ──────────────────────────────────────────────────────────│
│  Daily Active Users: 1,247 (+12% WoW)                      │
│  Emails Processed: 8,421 today                             │
│  Agent Breakdown:                                           │
│    research@: 42%                                           │
│    meta-agents: 35%                                         │
│    summarize@: 18%                                          │
│    info@: 5%                                                │
│  ──────────────────────────────────────────────────────────│
│  Top Meta-Agents: code-review (1.2k), write-haiku (890)    │
│  Avg Response Time: 2.8s                                    │
│  Success Rate: 99.7%                                        │
└─────────────────────────────────────────────────────────────┘
```

## Key Deliverables

- [ ] Integrate Sentry for error tracking (Cloudflare Workers SDK)
- [ ] Set up PagerDuty/OpsGenie alerting for critical errors
- [ ] Implement request tracing with unique trace IDs (email → reply)
- [ ] Add latency tracking at each pipeline stage
- [ ] Create structured logging format with trace correlation
- [ ] Set up log aggregation (Axiom, Logflare, or Cloudflare Logpush)
- [ ] Build business metrics dashboard (daily users, agent usage, etc.)
- [ ] Implement health check endpoint (`/health`) with dependency checks
- [ ] Set up uptime monitoring (Pingdom, Better Stack)
- [ ] Create DLQ monitoring and alerting
- [ ] Add Claude API latency tracking and budgeting
- [ ] Implement rate limit analytics (how often are users hitting limits?)
- [ ] Create on-call runbook for common issues
- [ ] Set up SLO/SLI tracking (99.9% uptime, <5s p99 response time)

## Prerequisites

None - this should happen early (alongside testing)

## Risks & Open Questions

- **Cost**: Observability tools add up. Sentry, logging, APM all have costs. What's the budget?
- **Privacy**: Logs may contain email content. How do we redact PII while keeping useful context?
- **Worker limits**: Cloudflare Workers have CPU time limits. Heavy instrumentation could impact performance.
- **Tool selection**: Sentry vs Datadog vs custom? Axiom vs Logflare vs Cloudflare native?
- **Alert fatigue**: Too many alerts = ignored alerts. What's the right threshold for paging?

## Notes

**Recommended stack (Cloudflare-native):**
- **Errors**: Sentry (excellent Workers integration)
- **Logging**: Axiom (native Cloudflare integration, generous free tier)
- **Metrics**: Cloudflare Analytics + custom KV counters
- **Uptime**: Better Stack (simple, affordable)
- **Alerting**: PagerDuty or Slack webhooks

**Structured log format:**
```json
{
  "traceId": "email-abc123",
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "event": "agent_response",
  "agent": "research",
  "emailId": "msg-xyz",
  "from": "user@example.com",  // Consider hashing for privacy
  "responseTime": 2340,
  "tokensUsed": 1250,
  "cacheHit": false
}
```

**Health check design:**
```typescript
// GET /health
{
  "status": "healthy",
  "checks": {
    "kv": { "status": "ok", "latency": 12 },
    "anthropic": { "status": "ok", "latency": 145 },
    "inbound": { "status": "ok" }
  },
  "version": "1.2.3",
  "uptime": 86400
}
```

**SLO targets:**
- Availability: 99.9% (8.7 hours downtime/year)
- Email response time: <5s p95, <10s p99
- Error rate: <0.5%
- DLQ depth: <100 (alert if higher)

**Related files:**
- `src/index.ts` - add tracing middleware
- `src/services/email-processor.ts` - add timing instrumentation
- `src/agents/base-agent.ts` - add Claude API timing
- New: `src/utils/logger.ts` - structured logging
- New: `src/utils/tracer.ts` - request tracing
- New: `src/routes/health.ts` - health check endpoint
