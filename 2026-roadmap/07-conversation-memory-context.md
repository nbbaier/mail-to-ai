# Conversation Memory & Long-term Context

**Category:** Architecture
**Quarter:** Q2-Q3
**T-shirt Size:** L

## Why This Matters

Currently, Mail-to-AI maintains **conversation history within a thread** using Durable Objects. That's great for multi-turn emails. But agents have no memory **across threads** or **over time**. Every new email thread starts fresh.

This means:
- An agent can't remember your preferences
- Past interactions don't inform future ones
- Users repeat themselves constantly
- Personalization is impossible

True AI assistance requires **memory**. Your assistant should know your communication style, your project context, your preferences. It should get **better** the more you use it.

## Current State

**What exists:**
- Durable Object stores conversation history per thread
- SQLite storage in DO persists across requests
- `conversationHistory` array in `BaseAgent` tracks messages
- History is per-agent-instance (identified by email thread ID)

**What's missing:**
- No cross-thread memory (new thread = fresh start)
- No user profile (preferences, style)
- No project/topic context persistence
- No semantic search over past conversations
- No ability to reference previous interactions
- No summarization of long histories (context window limits)

**Example of the problem:**
- Monday: User emails `code-review@` with Python code
- Agent reviews it, suggests improvements
- Wednesday: User emails `code-review@` with more Python code (new thread)
- Agent has NO idea this is the same user, same project, same coding style
- User has to re-explain preferences every time

## Proposed Future State

A comprehensive memory system that makes agents truly personal:

### Memory Layers
```
┌─────────────────────────────────────────────────────────────┐
│                    Memory Architecture                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: Conversation Memory (existing)                    │
│  ┌──────────────────────────────────────────────────┐      │
│  │ Thread-123: [user msg, agent msg, user msg, ...] │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  Layer 2: Session Memory (NEW)                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │ User + Agent combo = accumulated context         │      │
│  │ "Prefers Python, concise responses, works on     │      │
│  │  project 'luna-cms', senior engineer"            │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  Layer 3: Long-term Memory (NEW)                            │
│  ┌──────────────────────────────────────────────────┐      │
│  │ Semantic embeddings of past conversations        │      │
│  │ Queryable: "What did I ask about React last month?" │   │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  Layer 4: User Profile (NEW)                                │
│  ┌──────────────────────────────────────────────────┐      │
│  │ Global preferences, communication style,         │      │
│  │ timezone, expertise level, interests             │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Memory-Augmented Agent Response
```
User emails code-review@ (new thread):
"Review this function"
[code]

Agent thinks:
1. Check user profile → "Senior Python dev, prefers concise feedback"
2. Check session memory → "This user's project uses FastAPI, pytest"
3. Check long-term memory → "Last week I reviewed similar code, suggested..."
4. Respond with full context

Agent responds:
"Based on your FastAPI project structure and your preference for
type hints (from our previous reviews), here's my feedback:
1. Consider using Pydantic models like you did in auth.py..."
```

### Memory Commands (via email)
```
To: memory@mail-to-ai.com
Subject: Save context

My current project is "Luna CMS" - a headless CMS built with
Next.js and Supabase. I prefer TypeScript, functional components,
and Tailwind for styling.

---

Reply:
✅ Context saved! All agents will now know about Luna CMS.
You can update this anytime by emailing me again.
```

## Key Deliverables

- [ ] Design memory data model (user profiles, session context, embeddings)
- [ ] Implement user profile storage (preferences, style, expertise)
- [ ] Build session memory (per user+agent combination)
- [ ] Create memory extraction from conversations (auto-learn preferences)
- [ ] Implement vector embeddings for semantic memory (Cloudflare Vectorize)
- [ ] Build semantic search over past conversations
- [ ] Create `memory@` agent for explicit context management
- [ ] Implement conversation summarization (compress old context)
- [ ] Add "forget" commands for privacy (delete specific memories)
- [ ] Build memory viewer in dashboard (see what agent knows about you)
- [ ] Implement memory sharing within teams
- [ ] Add project/topic context buckets
- [ ] Create memory export for portability
- [ ] Build memory injection into system prompts
- [ ] Add memory decay (old memories fade, recent ones stay strong)

## Prerequisites

- **Initiative #2 (Authentication)**: Memory requires user identity
- **Initiative #1 (Testing)**: Memory bugs are subtle and critical

## Risks & Open Questions

- **Privacy**: Users may not want agents to remember everything. How do we give control?
- **Storage costs**: Embeddings are large. How much history can we afford to store?
- **Context window limits**: Even with summarization, long context is expensive. What's the budget?
- **Memory accuracy**: Auto-extracted preferences might be wrong. How do users correct them?
- **Cross-agent memory**: Should `code-review@` know what you told `research@`? Privacy implications?
- **Memory staleness**: Old preferences may no longer be relevant. How do we detect this?
- **Vectorize limits**: Cloudflare Vectorize has limits. At scale, do we need Pinecone/Weaviate?

## Notes

**Memory extraction example:**
```
User's email mentions: "I work at Acme Corp"
→ Store in profile: { company: "Acme Corp" }

User's code uses TypeScript
→ Store in session: { preferredLanguage: "TypeScript" }

User says "I prefer shorter responses"
→ Store in profile: { responseStyle: "concise" }
```

**Summarization strategy:**
- Keep last N messages in full detail
- Summarize older messages into key points
- Store semantic embeddings of all messages
- On new request: inject summary + retrieve relevant embeddings

**Memory decay model:**
```
memoryStrength = baseStrength * e^(-decay * daysSinceLastAccess)
if memoryStrength < threshold:
    archive(memory)  // Move to cold storage
```

**Vector database options:**
- **Cloudflare Vectorize**: Native, simple, limited features
- **Pinecone**: Full-featured, serverless, cost at scale
- **Weaviate**: Self-hosted option, more control
- **Turbopuffer**: New entrant, Cloudflare-native

Recommendation: Start with Vectorize for simplicity, migrate to Pinecone if scale requires.

**Memory privacy levels:**
- **Private**: Only accessible by the specific agent
- **Shared (user)**: Accessible by all agents for that user
- **Shared (team)**: Accessible by team members' agents
- **Forgotten**: Explicitly deleted, audit log only

**Related files:**
- `src/agents/base-agent.ts` - memory injection into prompts
- `src/agents/meta-agent.ts` - context-aware prompt generation
- New: `src/services/memory-service.ts`
- New: `src/services/embedding-service.ts`
- New: `src/agents/memory-agent.ts`
- New: `website/src/pages/Memory.tsx` - memory viewer
