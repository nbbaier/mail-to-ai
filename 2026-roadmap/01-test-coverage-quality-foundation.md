# Test Coverage & Quality Foundation

**Category:** Testing
**Quarter:** Q1
**T-shirt Size:** M

## Why This Matters

Mail-to-AI currently has **zero test coverage**. This is the single biggest risk to the project's growth. Without tests, every change is a gamble—refactoring is dangerous, regressions are invisible until production, and onboarding new contributors is nerve-wracking. Before any ambitious features can be built, the foundation must be solid.

Test coverage isn't just about catching bugs; it's about **confidence**. Confident deployments, confident refactoring, confident collaboration. This initiative transforms Mail-to-AI from a hackathon project into a production-grade system.

## Current State

- **0 test files** exist in the repository
- Vitest is in `package.json` but unconfigured
- No CI/CD pipeline runs tests on PRs
- Manual testing is the only verification method
- Critical paths (email parsing, rate limiting, agent routing) are untested
- No mocking infrastructure for external services (Anthropic, inbound.new)

**Risk areas without tests:**
- `email-parser.ts` (131 lines) - parses untrusted webhook input
- `rate-limiter.ts` (128 lines) - prevents abuse, currently blindly trusted
- `safety-validator.ts` (108 lines) - security boundary, regex-based
- `meta-agent.ts` (236 lines) - most complex agent, generates dynamic prompts
- `agent-router.ts` (84 lines) - routes to Durable Objects

## Proposed Future State

A comprehensive test suite that enables fearless development:

```
test/
├── unit/
│   ├── utils/
│   │   ├── email-parser.test.ts      # Parsing edge cases, malformed input
│   │   ├── rate-limiter.test.ts      # Quota enforcement, expiration
│   │   └── safety-validator.test.ts  # Blocklist, prompt injection
│   ├── agents/
│   │   ├── base-agent.test.ts        # Conversation history, HTML formatting
│   │   ├── meta-agent.test.ts        # Address parsing, prompt generation
│   │   └── research-agent.test.ts    # Web search integration
│   └── services/
│       ├── agent-router.test.ts      # Routing logic, fallback behavior
│       └── email-processor.test.ts   # Full pipeline tests
├── integration/
│   ├── webhook-flow.test.ts          # Webhook → Queue → Agent → Reply
│   └── durable-object.test.ts        # State persistence across requests
├── e2e/
│   └── email-pipeline.test.ts        # Real email send → receive (staging)
├── fixtures/
│   ├── emails/                       # Sample webhook payloads
│   └── prompts/                      # Expected meta-agent prompts
└── mocks/
    ├── anthropic.ts                  # Mock Claude API responses
    └── inbound.ts                    # Mock email sending
```

**Coverage targets:**
- Unit tests: 90%+ coverage on `utils/` and `services/`
- Integration tests: All agent types, rate limiting, safety validation
- E2E tests: Happy path and error scenarios

## Key Deliverables

- [ ] Configure Vitest with Cloudflare Workers test environment
- [ ] Create mock infrastructure for Anthropic API and inbound.new SDK
- [ ] Write unit tests for `email-parser.ts` (20+ test cases for edge cases)
- [ ] Write unit tests for `rate-limiter.ts` (quota, expiration, bypass)
- [ ] Write unit tests for `safety-validator.ts` (blocklist patterns, injection)
- [ ] Write unit tests for `meta-agent.ts` address parsing (all formats)
- [ ] Write integration tests for agent routing (built-in + meta-agent fallback)
- [ ] Write integration tests for full email processing pipeline
- [ ] Create test fixtures for webhook payloads (valid, malformed, edge cases)
- [ ] Set up GitHub Actions CI pipeline running tests on every PR
- [ ] Add test coverage reporting (codecov or similar)
- [ ] Add pre-commit hooks running tests before push
- [ ] Document testing conventions in CONTRIBUTING.md

## Prerequisites

None - this is foundational work that should happen first.

## Risks & Open Questions

- **Durable Object testing**: Cloudflare's Miniflare supports DO testing, but setup can be tricky. May need to invest time in proper mocking.
- **Anthropic API mocking**: Need to capture realistic Claude responses for fixtures. Consider using recorded responses from real API calls.
- **E2E testing environment**: Should we create a dedicated staging environment with test email domain, or mock at the network boundary?
- **Test data management**: How to handle sensitive test data (email addresses, API keys) in test fixtures?

## Notes

**Priority justification**: This is ranked #1 because it's a force multiplier. Every other initiative benefits from having tests. Refactoring for enterprise features? Tests catch regressions. Adding new agent tools? Tests verify integration. Building the SDK? Tests document expected behavior.

**Relevant files to test first (by risk):**
- `src/utils/email-parser.ts` - parses untrusted input
- `src/utils/safety-validator.ts` - security boundary
- `src/utils/rate-limiter.ts` - abuse prevention
- `src/agents/meta-agent.ts` - complex logic, prompt injection surface

**Quick wins:**
- `email-parser.ts` is pure functions—easy to unit test
- `safety-validator.ts` blocklist is static—snapshot testing works well
- `rate-limiter.ts` uses KV which can be easily mocked
