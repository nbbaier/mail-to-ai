# Enterprise Authentication & Teams

**Category:** New Feature
**Quarter:** Q2
**T-shirt Size:** XL

## Why This Matters

Mail-to-AI currently has **no concept of users**. Every email sender is treated the same (except for one hardcoded VIP bypass). This works for a hackathon demo but blocks any path to monetization, compliance, or enterprise adoption.

Organizations need to:
- Control who can use their agents
- Share custom agents across team members
- Track usage for billing and compliance
- Set per-team rate limits and permissions
- Integrate with existing identity providers (SSO)

Without authentication, Mail-to-AI is a cool demo. With it, it's a **business**.

## Current State

- **No user database** - users identified only by email address
- **Hardcoded VIP**: `UNLIMITED_EMAILS = ["nico.baier@gmail.com"]` in `rate-limiter.ts`
- **No team concept** - can't share custom agents
- **Global rate limit**: 10 emails/hour per sender, same for everyone
- **No billing integration** - can't differentiate free vs paid users
- **No audit trail** - can't track who did what
- **KV-only storage** - eventually consistent, not suitable for user records

## Proposed Future State

A complete identity and team management system:

### User Management
```
┌─────────────────────────────────────────────────────────────┐
│  User: alice@acme.com                                       │
│  ├── Teams: [Acme Corp, Side Project]                       │
│  ├── Plan: Enterprise ($99/seat/mo)                         │
│  ├── Rate Limit: 1000 emails/hour                           │
│  ├── Custom Agents: [code-review@, draft-proposal@, ...]    │
│  └── Usage This Month: 847 emails                           │
└─────────────────────────────────────────────────────────────┘
```

### Team Workspace
```
Team: Acme Corp
├── Members: [alice@, bob@, charlie@] (SSO via Okta)
├── Shared Agents: [company-voice@, legal-review@, ...]
├── Usage Dashboard: Real-time team metrics
├── Billing: Centralized, per-seat
└── Audit Log: Who used what agent, when
```

### Authentication Flow
```
New user sends email
        │
        ▼
   ┌─────────────┐
   │ Lookup user │──→ Known? → Process with user context
   └─────────────┘
        │
        ▼ Unknown
   ┌─────────────┐
   │ Send signup │──→ "Reply 'JOIN' to create account"
   │   email     │     or click magic link
   └─────────────┘
        │
        ▼
   ┌─────────────┐
   │ User replies│──→ Create account, confirm via email
   │   'JOIN'    │
   └─────────────┘
        │
        ▼
   ┌─────────────┐
   │ Account     │──→ Free tier active, can upgrade
   │ created     │
   └─────────────┘
```

## Key Deliverables

- [ ] Design user data model (D1 SQLite or Turso for consistency)
- [ ] Implement email-based magic link authentication
- [ ] Create user registration flow via email interaction
- [ ] Build team/workspace model with member roles
- [ ] Implement team-scoped custom agent sharing
- [ ] Create tiered rate limiting (Free: 10/hr, Pro: 100/hr, Enterprise: 1000/hr)
- [ ] Build usage tracking and quota enforcement per user/team
- [ ] Integrate SSO/SAML for enterprise (Okta, Azure AD, Google Workspace)
- [ ] Create billing integration (Stripe) with usage-based pricing
- [ ] Build admin dashboard for team management
- [ ] Implement audit logging for compliance (who, what, when)
- [ ] Add GDPR compliance features (data export, deletion)
- [ ] Create API keys for programmatic access
- [ ] Build onboarding email sequence for new users

## Prerequisites

- **Initiative #1 (Test Coverage)**: User management is critical—needs thorough testing
- **Database decision**: D1 (Cloudflare's SQLite) or external (Turso, Planetscale)

## Risks & Open Questions

- **Email-only auth UX**: Is "reply JOIN" intuitive enough? Should we support a web dashboard for account management?
- **Domain verification**: How do we prevent spoofing? If `bob@acme.com` signs up, how do we verify they actually own that email?
- **Team discovery**: If `alice@acme.com` creates a team, should `bob@acme.com` auto-join or need invitation?
- **Pricing model**: Per-seat vs usage-based vs hybrid? What's the right price point for enterprise?
- **Data residency**: Enterprise customers may require EU-only data storage. How does this affect Cloudflare architecture?
- **SSO complexity**: SAML integration is notoriously complex. Should we use Auth0/Clerk to simplify?

## Notes

**Database options:**
- **Cloudflare D1**: Native SQLite, automatic replication, but read-after-write latency
- **Turso**: LibSQL (SQLite fork), global edge replication, embedded replicas
- **Planetscale**: MySQL-compatible, branching workflow, serverless
- Recommendation: Start with D1 for simplicity, migrate to Turso if latency becomes an issue

**Email-based auth advantages:**
- No passwords to manage
- Natural for an email-first product
- Users already trust the email interface
- Magic links work across devices

**Team pricing considerations:**
- Free: 10 emails/hour, 1 custom agent
- Pro ($19/mo): 100 emails/hour, 10 custom agents, conversation history
- Team ($49/seat/mo): 500 emails/hour, unlimited agents, shared workspace
- Enterprise ($99/seat/mo): 1000 emails/hour, SSO, audit logs, dedicated support

**Relevant files to modify:**
- `src/utils/rate-limiter.ts` - user-aware rate limiting
- `src/services/email-processor.ts` - user context injection
- `src/agents/meta-agent.ts` - team-scoped agent lookup
- New: `src/services/user-service.ts` - user CRUD
- New: `src/services/team-service.ts` - team management
- New: `src/services/billing-service.ts` - Stripe integration
