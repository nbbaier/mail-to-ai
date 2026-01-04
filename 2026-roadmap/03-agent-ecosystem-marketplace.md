# Agent Ecosystem & Marketplace

**Category:** New Feature
**Quarter:** Q2-Q3
**T-shirt Size:** XL

## Why This Matters

The meta-agent is Mail-to-AI's killer feature—anyone can create a custom agent just by emailing an address. But right now, these agents are **isolated and ephemeral**. There's no way to discover what agents others have created, share your best agents, or learn from the community.

An agent marketplace transforms Mail-to-AI from a utility into a **platform**. Suddenly, creating an agent isn't just solving your own problem—it's contributing to a collective intelligence. The best agents surface naturally, and users benefit from each other's creativity.

This is how products achieve network effects. More users → more agents → more value → more users.

## Current State

- **Custom agents are private**: Only accessible to the creator
- **No discovery**: Can't browse what agents exist
- **No sharing**: Can't share `code-review@` with your team
- **No quality signals**: Can't tell if an agent is any good
- **Prompt cache is global**: Anyone can email the same address and get the same agent
- **No versioning**: Can't iterate on an agent prompt
- **No analytics**: Don't know which agents are popular

**The lost opportunity**: Every creative use of meta-agent is invisible. Someone created `explain-code-like-a-pirate@`? No one knows. It's a missed opportunity for viral growth.

## Proposed Future State

A thriving ecosystem where agents are first-class citizens:

### Agent Discovery
```
┌─────────────────────────────────────────────────────────────┐
│  Featured Agents This Week                                  │
│  ──────────────────────────────────────────────────────────│
│  code-review@          ⭐ 4.8  │ 12,340 uses │ by @alice   │
│  legal-contract-summarize@  ⭐ 4.9  │  8,291 uses │ by @bob│
│  explain-to-5yo@       ⭐ 4.7  │ 23,182 uses │ Community   │
│  write-haiku@          ⭐ 4.5  │ 45,120 uses │ Community   │
└─────────────────────────────────────────────────────────────┘
```

### Agent Profile
```
┌─────────────────────────────────────────────────────────────┐
│  code-review@mail-to-ai.com                                 │
│  ──────────────────────────────────────────────────────────│
│  Created by: @alice                                         │
│  Uses: 12,340  │  Rating: ⭐ 4.8/5  │  Replies: 11,892      │
│  ──────────────────────────────────────────────────────────│
│  Description:                                               │
│  A senior engineer who reviews your code for bugs, style,   │
│  security issues, and performance. Provides actionable      │
│  feedback with code examples.                               │
│  ──────────────────────────────────────────────────────────│
│  Example Email:                                             │
│  Subject: Review my Python function                         │
│  Body: [paste code here]                                    │
│  ──────────────────────────────────────────────────────────│
│  Tags: #code #development #review #python                   │
└─────────────────────────────────────────────────────────────┘
```

### Agent Studio (Create & Iterate)
```
┌─────────────────────────────────────────────────────────────┐
│  Agent Studio: code-review@                                 │
│  ──────────────────────────────────────────────────────────│
│  [v3] Current: "You are a senior engineer..."               │
│  [v2] "You review code for bugs and style..."               │
│  [v1] "Review code" (auto-generated)                        │
│  ──────────────────────────────────────────────────────────│
│  Test Your Agent:                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ def fibonacci(n):                                    │   │
│  │     return n if n < 2 else fibonacci(n-1)+...       │   │
│  └─────────────────────────────────────────────────────┘   │
│  [Send Test Email]  [A/B Test vs v2]  [Publish v3]         │
└─────────────────────────────────────────────────────────────┘
```

## Key Deliverables

- [ ] Design agent data model (creator, description, tags, visibility, versions)
- [ ] Build agent registry with full-text search
- [ ] Create public agent directory/marketplace web UI
- [ ] Implement agent ratings and usage metrics
- [ ] Build agent versioning (edit prompt, track changes)
- [ ] Add agent categories and tags
- [ ] Create "Fork agent" feature (copy and customize)
- [ ] Implement agent A/B testing (compare prompt versions)
- [ ] Build agent analytics dashboard (usage, ratings, response times)
- [ ] Create featured/trending agents algorithm
- [ ] Add agent reviews and comments
- [ ] Implement agent monetization (premium agents, revenue share)
- [ ] Build agent templates for common use cases
- [ ] Create agent certification/verification program
- [ ] Add agent embedding (use agents in docs, websites)

## Prerequisites

- **Initiative #2 (Authentication)**: Agents need creators/owners
- **Initiative #1 (Testing)**: Marketplace features need thorough testing

## Risks & Open Questions

- **Content moderation**: How do we prevent inappropriate agents from being published? Manual review? AI moderation? Community flagging?
- **Naming conflicts**: What happens when two users want `code-review@`? First-come-first-served? Namespacing (alice-code-review@)?
- **Quality control**: How do we ensure published agents actually work well? Minimum usage threshold before featuring?
- **IP concerns**: If someone creates a great agent, who owns the prompt? Can it be cloned?
- **Spam prevention**: How do we prevent agent spam flooding the marketplace?
- **Revenue share**: If premium agents generate revenue, what's the split with creators?

## Notes

**Viral growth opportunity**: "Try my agent" sharing could be massive:
- User creates great agent
- Shares on Twitter/LinkedIn: "I made an AI that reviews code via email"
- Others try it, create accounts
- Network effect kicks in

**Agent namespacing options:**
1. **Global first-come-first-served**: `code-review@` belongs to first claimer
2. **User-prefixed**: `alice-code-review@` (ugly but clear)
3. **Subdomain**: `code-review@alice.mail-to-ai.com` (requires wildcard MX)
4. **Verified names**: Popular names require verification/auction

Recommendation: Start with user-prefixed for custom agents, reserve unprefixed names for marketplace-verified agents.

**Monetization models:**
- Free marketplace with featured placements (advertising model)
- Premium agent subscriptions (10% platform fee)
- Enterprise custom agent deployments
- Agent development consulting marketplace

**Related files:**
- `src/agents/meta-agent.ts` - needs registry lookup
- New: `src/services/agent-registry.ts`
- New: `website/src/pages/Marketplace.tsx`
- New: `website/src/pages/AgentProfile.tsx`
- New: `website/src/pages/AgentStudio.tsx`
