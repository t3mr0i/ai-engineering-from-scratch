# Skill: Agentic Task Design

One-page decision aid for designing or reviewing an agentic software engineering task.
Use during task specification, design review, or pre-deployment checklist.

---

## 1. Decomposition Pattern Selector

Answer the four questions in order. Stop at the first match.

| Question | Yes → pattern | No → continue |
|---|---|---|
| Is blast radius HIGH or CRITICAL, or does policy require human sign-off? | **Human-in-the-loop** | next |
| Does the output quality require self-critique before delivery? | **Reflection loop** | next |
| Are subtasks truly independent AND steps > 20? | **Multi-agent parallel** | next |
| Are steps > 20 with sequential dependencies? | **Planner + executor** | next |
| (default) | **Single-agent sequential** | — |

**Patterns at a glance**

| Pattern | Best for | Main failure mode |
|---|---|---|
| Single-agent sequential | Bounded tasks, < 20 steps | Brittle on ambiguous tasks |
| Planner + executor | Large tasks with a stable upfront spec | Bad plan early, executor has no recourse |
| Multi-agent parallel | Truly independent subtasks | Race conditions, merge conflicts |
| Reflection loop | Quality-sensitive output (docs, code, tests) | Reward hacking: satisfies critic, not task |
| Human-in-the-loop | High blast radius, operator policy | Interrupts too often or not enough |

---

## 2. Blast Radius and Verification Gate

| Blast radius | Examples | Recommended gate |
|---|---|---|
| ZERO | File reads, list ops, status queries | None — auto-approve |
| LOW | File writes in sandbox or test branch | None in dev; HITL in prod |
| MEDIUM | API calls that modify state (create, update) | Confirm action intent once before run |
| HIGH | Deletes, deploys, outbound calls, credential access | Explicit human approval per action |
| CRITICAL | Production DB writes, secret rotation, infra teardown | Out-of-band approval — not inside the agent loop |

---

## 3. Tool Design Checklist

Before registering a tool in any agent system:

- [ ] One tool, one effect — split read and write tools; never combine them
- [ ] Structured error output — `{"error": "<code>", "suggestion": "..."}`, not a raw traceback
- [ ] Idempotency documented — what happens on retry is explicit in the tool description
- [ ] Granularity matches the loop — not too coarse (side effects hidden) and not too fine (too many calls)
- [ ] Tool description is versioned — treated as source code, reviewed and tested like code

---

## 4. Grounding Checklist (prevent stale-context writes)

- [ ] Re-read the target before every write action (`read_file` → `write_file`, not `write_file` alone)
- [ ] Maintain an explicit scratchpad (structured dict) updated after each step
- [ ] Re-inject scratchpad at the top of each loop iteration if context exceeds ~50 tool calls
- [ ] After any model error or retry, re-fetch current state before continuing

---

## 5. Budget and Observability (non-optional in production)

| Control | Recommended starting point | Rationale |
|---|---|---|
| `max_turns` | 30–50 for coding tasks | Prevents unbounded cost; tune up for known long tasks |
| `max_budget_usd` | $0.50–$2.00 for coding tasks | Hard cost cap; alerts before runaway |
| Per-tool call cap | 10 for any write tool | Repetition detection backup |
| Structured action log | Every tool call: inputs, outputs, latency | Required for post-incident debugging |
| Graceful degradation | On budget/turn exceeded: summarize done + remaining | Silent failure is the worst outcome |

---

## 6. Pre-Deployment Verification Checklist

- [ ] Decomposition pattern chosen and documented
- [ ] Blast radius assessed for every tool in the task
- [ ] HITL gates placed at all HIGH and CRITICAL actions
- [ ] All tools pass the tool design checklist
- [ ] Grounding re-reads in place for every write step
- [ ] `max_turns` and `max_budget_usd` set in the agent config
- [ ] Structured action logging wired to a queryable store
- [ ] Graceful degradation path tested (force budget exceeded, verify summary output)
- [ ] System prompt and tool descriptions committed to version control
- [ ] At least one dry-run on a non-production target with full trace reviewed

---

## Quick Reference: Current Toolchain (2026)

| Tool | Use for |
|---|---|
| Claude Agent SDK | Native Anthropic workloads; multi-agent coordination |
| Production runtimes (Phase 14 · 29) | Durable execution, state persistence, retries |
| Claude Code (Phase 15 · 10) | Developer workflows, CI, unattended coding |
| MCP servers | Standardized tool protocol (authors once, consumed everywhere) |
| Custom asyncio loop | Full control; research; specialized domains |
