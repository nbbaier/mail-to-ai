# Agent Orchestration & Workflows

**Category:** Architecture
**Quarter:** Q3-Q4
**T-shirt Size:** XL

## Why This Matters

Today's agents work in isolation. You email `research@`, get a response, then manually copy that to `summarize@`. There's no way to chain agents together or create automated workflows.

But real work is rarely a single step:
- Research → Analyze → Draft → Edit → Send
- Gather data → Process → Visualize → Report
- Review code → Identify issues → Suggest fixes → Apply changes

**Agent orchestration** means building pipelines where agents collaborate. The output of one feeds into another. Complex tasks get broken down and handled by specialists. Humans supervise, agents execute.

This is how AI agents become genuinely useful for substantial work.

## Current State

**What exists:**
- Single agents handle single requests
- No agent-to-agent communication
- No workflow definition
- No scheduled/triggered execution
- Manual copy-paste between agents

**What users want to do:**
```
"Research competitors, summarize findings, draft a report"
→ Today: 3 separate emails, manual orchestration
→ Future: One email, automatic pipeline
```

## Proposed Future State

A powerful orchestration layer for multi-step workflows:

### Workflow Definition
```yaml
# Example: Competitive Intelligence Workflow
name: competitor-analysis
trigger: email to competitor-intel@
steps:
  - name: research
    agent: research@
    input: "Research competitors for: {{user_input}}"

  - name: summarize
    agent: summarize@
    input: "Summarize this research: {{research.output}}"

  - name: draft
    agent: write-report@
    input: |
      Create a competitive analysis report based on:
      {{summarize.output}}

  - name: review
    agent: proofread@
    input: "Review and polish: {{draft.output}}"

output: "{{review.output}}"
```

### Visual Workflow Builder
```
┌─────────────────────────────────────────────────────────────┐
│  Workflow Builder: Competitive Analysis                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │ Research │───►│ Summarize│───►│  Draft   │             │
│  │    @     │    │    @     │    │ Report @ │             │
│  └──────────┘    └──────────┘    └──────────┘             │
│                                        │                    │
│                                        ▼                    │
│                                  ┌──────────┐              │
│                                  │ Proofread│              │
│                                  │    @     │              │
│                                  └──────────┘              │
│                                        │                    │
│                                        ▼                    │
│                                  ┌──────────┐              │
│                                  │  Output  │              │
│                                  │  Email   │              │
│                                  └──────────┘              │
│                                                             │
│  [Save Workflow]  [Test Run]  [Publish]                    │
└─────────────────────────────────────────────────────────────┘
```

### Workflow Execution
```
User emails: competitor-intel@mail-to-ai.com
Body: "Analyze our competitors in the CRM space"

System:
1. Triggers workflow "competitor-analysis"
2. Step 1: Research agent searches for CRM competitors
3. Step 2: Summarize agent condenses findings
4. Step 3: Write-report agent drafts analysis
5. Step 4: Proofread agent polishes output
6. Sends final report to user

User receives:
Subject: Competitive Analysis Complete

[Polished, multi-agent report]

---
Workflow: competitor-analysis
Steps completed: 4/4
Total time: 45 seconds
Agents used: research@, summarize@, write-report@, proofread@
```

### Scheduled Workflows
```
┌─────────────────────────────────────────────────────────────┐
│  Scheduled Workflows                                        │
├─────────────────────────────────────────────────────────────┤
│  📅 daily-news-digest                                       │
│     Schedule: Every day at 7:00 AM                         │
│     Steps: research → summarize → email                    │
│     Last run: Today, 7:00 AM (success)                     │
│                                                             │
│  📅 weekly-competitor-update                                │
│     Schedule: Mondays at 9:00 AM                           │
│     Steps: research → analyze → report → email             │
│     Last run: Monday, 9:00 AM (success)                    │
│                                                             │
│  📅 daily-standup-prep                                      │
│     Schedule: Weekdays at 8:30 AM                          │
│     Steps: github-check → summarize → format → email       │
│     Last run: Today, 8:30 AM (success)                     │
└─────────────────────────────────────────────────────────────┘
```

## Key Deliverables

- [ ] Design workflow definition schema (YAML/JSON)
- [ ] Build workflow execution engine (step sequencing, variable passing)
- [ ] Implement conditional branching (if/else based on agent output)
- [ ] Create parallel execution (run multiple agents simultaneously)
- [ ] Add error handling and retries per step
- [ ] Build visual workflow builder UI
- [ ] Implement workflow triggers (email, schedule, webhook)
- [ ] Create scheduled workflow execution (cron-based)
- [ ] Add workflow templates library (common use cases)
- [ ] Build workflow versioning and rollback
- [ ] Implement workflow analytics (success rate, latency per step)
- [ ] Create human-in-the-loop checkpoints (approve before continuing)
- [ ] Add workflow sharing (publish to marketplace)
- [ ] Build workflow variables and secrets
- [ ] Implement workflow debugging (step-by-step execution)

## Prerequisites

- **Initiative #3 (Marketplace)**: Workflows reference agents by name
- **Initiative #2 (Authentication)**: Workflows are user-owned

## Risks & Open Questions

- **Complexity creep**: Workflow builders can become very complex. How do we keep it simple?
- **Error cascades**: If step 2 fails, what happens? Retry? Skip? Abort?
- **Timeout management**: Long workflows may exceed Worker limits. How do we handle multi-minute execution?
- **Cost explosion**: A workflow using 5 agents costs 5x. How do we price this?
- **Debugging**: When a workflow fails, how do users understand why?
- **Version compatibility**: If an agent changes, does the workflow break?
- **Security**: Can workflows access things the user shouldn't? Privilege escalation?

## Notes

**Execution model options:**
1. **Synchronous**: Run all steps, respond when complete (simple, limited by timeouts)
2. **Async with notifications**: Start workflow, email when done (better for long workflows)
3. **Streaming**: Email partial results as each step completes (best UX)

Recommendation: Default to async with completion email, allow streaming for premium.

**Workflow definition format:**
```yaml
name: my-workflow
description: "Does something useful"
version: 1
trigger:
  type: email | schedule | webhook
  config: ...
inputs:
  - name: topic
    type: string
    required: true
steps:
  - id: step1
    agent: research@
    input: "Research {{inputs.topic}}"
    timeout: 30s
    retry: 2
  - id: step2
    agent: summarize@
    input: "{{step1.output}}"
    condition: "{{step1.success}}"
output:
  format: email | webhook | both
  template: "..."
```

**Cron implementation:**
- Cloudflare Cron Triggers for scheduling
- D1 for workflow state persistence
- Queues for execution distribution
- Maximum workflow duration: 10 minutes (split longer into sub-workflows)

**Human-in-the-loop example:**
```yaml
steps:
  - id: draft
    agent: write-contract@
    input: "Draft contract for {{client}}"
  - id: human-review
    type: checkpoint
    message: "Review draft before sending to client"
    timeout: 24h
    actions:
      - approve → continue
      - reject → abort
      - edit → go to step draft
  - id: send
    agent: email-sender@
    input: "Send to {{client_email}}"
```

**Related files:**
- New: `src/services/workflow-engine.ts`
- New: `src/services/workflow-scheduler.ts`
- New: `src/models/workflow.ts`
- New: `website/src/pages/WorkflowBuilder.tsx`
- New: `website/src/pages/WorkflowRuns.tsx`
