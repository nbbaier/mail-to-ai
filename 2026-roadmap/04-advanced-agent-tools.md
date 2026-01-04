# Advanced Agent Tools & Capabilities

**Category:** New Feature
**Quarter:** Q2
**T-shirt Size:** L

## Why This Matters

Currently, agents can only **think** (generate text) and **search** (web search on ResearchAgent). This severely limits what they can actually **do**. The most powerful AI agents in the wild have access to tools—they can execute code, call APIs, manipulate data, and interact with external systems.

Imagine an agent that can:
- Execute Python code to analyze data you email
- Query your company's internal APIs
- Create and update calendar events
- Generate charts and visualizations
- Send follow-up emails on your behalf

Tools transform agents from "smart responders" into **autonomous workers** that can complete complex tasks end-to-end.

## Current State

**Current capabilities:**
- Text generation (all agents) - Claude models
- Web search (ResearchAgent only) - Anthropic's `webSearch_20250305` tool
- That's it. No other tools available.

**What users are asking for (implied by meta-agent addresses):**
- `analyze-csv-data@` - Can't actually process CSV
- `create-calendar-event@` - Can't access calendars
- `generate-chart@` - Can't create visualizations
- `query-database@` - Can't connect to databases
- `translate-document@` - Can only translate text, not files

**Architecture limitation**: Vercel AI SDK supports tools, but none are implemented beyond web search.

## Proposed Future State

A rich toolkit that agents can use based on context:

### Tool Categories

**1. Code Execution**
```
Tools: python_exec, javascript_exec, bash_exec
Use case: "Analyze this data and show me the trends"
Agent: Writes Python, executes safely, returns results
```

**2. Data Processing**
```
Tools: csv_parse, json_transform, regex_extract
Use case: "Extract all email addresses from this list"
Agent: Parses content, applies transformations
```

**3. Integrations**
```
Tools: google_calendar, slack_send, github_issue, notion_page
Use case: "Schedule a meeting for next Tuesday"
Agent: Creates calendar event, returns confirmation
```

**4. File Generation**
```
Tools: generate_pdf, create_spreadsheet, render_chart
Use case: "Create a pie chart of these expenses"
Agent: Generates chart, returns as attachment
```

**5. Communication**
```
Tools: send_followup_email, schedule_reminder, create_draft
Use case: "Remind me about this in 3 days"
Agent: Schedules reminder email to sender
```

### Tool Selection Intelligence
```
User emails: "Analyze this CSV and create a chart"
                    │
                    ▼
            ┌───────────────┐
            │ Tool Selector │ (Claude analyzes request)
            └───────────────┘
                    │
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
 csv_parse    python_exec   render_chart
      │             │             │
      └─────────────┴─────────────┘
                    │
                    ▼
            Final response with chart attachment
```

## Key Deliverables

- [ ] Implement secure code execution sandbox (Pyodide for Python in WASM)
- [ ] Create CSV/JSON parsing tools with schema inference
- [ ] Build chart generation tool (Chart.js or similar, rendered to image)
- [ ] Implement Google Calendar integration (OAuth flow via email)
- [ ] Add Slack integration for team notifications
- [ ] Create GitHub integration (issues, PRs, comments)
- [ ] Build email scheduling/follow-up tool
- [ ] Implement regex extraction and text transformation tools
- [ ] Create PDF generation tool for formatted reports
- [ ] Add spreadsheet creation tool (XLSX generation)
- [ ] Build tool selection logic (analyze request → choose tools)
- [ ] Implement tool chaining (output of one feeds into another)
- [ ] Create tool permission system (user must authorize integrations)
- [ ] Add tool usage analytics (which tools are popular)
- [ ] Document tool capabilities for each agent

## Prerequisites

- **Initiative #2 (Authentication)**: OAuth flows require user accounts
- **Initiative #1 (Testing)**: Tool execution is security-critical

## Risks & Open Questions

- **Security**: Code execution is dangerous. How do we sandbox effectively? What resource limits?
- **OAuth complexity**: Each integration needs its own OAuth flow. Should we use a service like Zapier/Make for easier integrations?
- **Tool selection accuracy**: How do we ensure Claude picks the right tools? What if it hallucinates tool calls?
- **Cost**: Tool execution (especially code) adds latency and compute cost. How do we price this?
- **Rate limiting**: API integrations have their own rate limits. How do we handle cascading limits?
- **Error handling**: What happens when a tool fails? Retry? Fallback? Notify user?

## Notes

**Code execution options:**
1. **Pyodide (WASM)**: Python in browser/worker, sandboxed, limited packages
2. **Deno Deploy**: Secure JS/TS runtime, built-in permissions
3. **Modal/Replicate**: Serverless execution, more flexibility, external cost
4. **Cloudflare Workers AI**: Native to platform, but limited to ML models

Recommendation: Start with Pyodide for Python (WASM in Workers is supported), expand to external runners for complex use cases.

**Integration priority (by user value):**
1. **Email scheduling** - natural for email-first product
2. **Calendar** - high frequency use case
3. **Code execution** - enables data analysis
4. **Chart generation** - visual output is compelling
5. **Slack/Discord** - team notifications
6. **GitHub** - developer use case

**Tool permission model:**
- Some tools are "free" (text processing, regex)
- Integrations require one-time OAuth authorization
- Code execution requires explicit opt-in
- Sending emails on behalf requires confirmation

**Meta-agent tool hints:**
Addresses like `analyze-data@` could automatically enable data processing tools, while `schedule-meeting@` enables calendar tools. Tool selection becomes part of the meta-agent's dynamic prompt generation.

**Related files:**
- `src/agents/base-agent.ts` - `getTools()` method expansion
- `src/agents/research-agent.ts` - reference for tool integration
- New: `src/tools/code-executor.ts`
- New: `src/tools/integrations/google-calendar.ts`
- New: `src/tools/data-processing.ts`
- New: `src/services/tool-selector.ts`
