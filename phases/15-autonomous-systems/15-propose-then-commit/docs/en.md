# Human-in-the-Loop: Propose-Then-Commit

> The 2026 consensus on HITL is specific. It is not "the agent asks, the user clicks Approve." It is propose-then-commit: the proposed action is persisted to a durable store with an idempotency key; surfaced to a reviewer with intent, data lineage, permissions touched, blast radius, and a rollback plan; committed only after positive acknowledgement; verified after execution to confirm the side effect actually happened. LangGraph's `interrupt()` plus PostgreSQL checkpointing, Microsoft Agent Framework's `RequestInfoEvent`, and Cloudflare's `waitForApproval()` all implement the same shape. The canonical failure mode is the rubber-stamp approval: "Approve?" is clicked without review. The documented mitigation is challenge-and-response with an explicit checklist.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 15 · 12 (Durable execution), Phase 15 · 14 (Tripwires)
**Time:** ~60 minutes

## Learning Objectives

- Explain the autonomy mechanism and assumptions behind Human-in-the-Loop: Propose-Then-Commit
- Model its control loop, state transitions, and stopping conditions explicitly
- Apply bounded permissions, budgets, and rollback controls
- Evaluate capability and safety claims against reproducible evidence

## The Problem

An agent takes an action. The user has to decide: approve or not. If the decision is instant, it is probably not a review. If the decision is structured, it is slow but trustworthy. The engineering question is how to make a structured review the path of least resistance.

The 2023-era HITL pattern was a synchronous prompt: "Agent wants to send email to X with body Y — approve?" The user clicks Approve. Everyone feels the system is safe. In practice this surface is heavily rubber-stamped: users approve fast, approvals predict little, and when the agent goes wrong, the audit trail shows a long history of approvals the user cannot recall.

The 2026 pattern — propose-then-commit — moves HITL onto a durable substrate, attaches structured metadata, and requires positive commit. Every managed agent SDK ships a version: LangGraph `interrupt()`, Microsoft Agent Framework `RequestInfoEvent`, Cloudflare `waitForApproval()`. The API names differ; the shape does not.

## The Concept

### The propose-then-commit state machine

1. **Propose.** Agent produces a proposed action. Persisted to a durable store (PostgreSQL, Redis, Durable Object). Includes:
   - intent (why is the agent doing this)
   - data lineage (what source led to this proposal)
   - permissions touched (which scopes / files / endpoints)
   - blast radius (what is the worst case)
   - rollback plan (if committed, how do we undo it)
   - idempotency key (unique per proposal; resubmission returns the same record)
2. **Surface.** Reviewer sees the proposal with all metadata. The reviewer is a person (not the agent reviewing itself).
3. **Commit.** Positive acknowledgement. The action executes.
4. **Verify.** After execution, the side effect is read back and confirmed. If the verify step fails, the system is in a known bad state and alerting engages.

### The idempotency key

Without an idempotency key, a retry after a transient failure can double-execute an approved action. Concrete example: user approves "transfer $100 from A to B." Network blips. Workflow retries. The user has approved once but the transfer executes twice. The idempotency key ties the approval to a single, unique side effect; the second execution is a no-op.

This is the same idempotency pattern Stripe and AWS APIs use. Reusing it for agent approvals is explicit in the Microsoft Agent Framework docs.

### Durability: why approvals outlast processes

The approval waiting room is a piece of state the agent does not own. The workflow is paused (Lesson 12). When the approval arrives, the workflow resumes from exactly that point. This is why LangGraph pairs `interrupt()` with PostgreSQL checkpointing and not just in-memory state — an approval two days later still finds the workflow intact.

### Rubber-stamp approvals and the challenge-and-response mitigation

The default UI for HITL ("Approve" / "Reject" buttons) produces fast approvals with no genuine review. Documented mitigation: a challenge-and-response checklist that requires positive answers to specific questions before the Approve button is enabled. Concrete shape:

- "Do you understand what resource this touches? [ ]"
- "Have you verified the blast radius is acceptable? [ ]"
- "Do you have a rollback plan if this fails? [ ]"

Not bureaucracy for its own sake — a forcing function. The reviewer who cannot tick the boxes either asks for clarification (escalation) or declines (safe default). The Anthropic agent-safety research explicitly cites checklist-driven HITL as a mitigation for rubber-stamp approval patterns.

### What counts as consequential

Not every action needs propose-then-commit. The 2026 guidance:

- **Consequential actions** (always HITL): irreversible writes, financial transactions, outbound communication, production database changes, destructive file-system operations.
- **Reversible actions** (sometimes HITL): edits to local files, staging-env changes, reversible writes with clear rollback.
- **Reads and inspections** (never HITL): reading a file, listing resources, calling a read-only API.

### Post-action verification

"The commit ran" is not the same as "the side effect happened." Network-partition and race conditions can produce a workflow that thinks it succeeded while the backend did not persist. The verify step re-reads the target resource after commit to confirm. This is the same pattern as database transactions with `RETURNING` clauses or AWS `GetObject` after `PutObject`.

### EU AI Act Article 14

Article 14 mandates effective human oversight for high-risk AI systems in the EU. "Effective" is not decorative. Regulatory language specifically excludes rubber-stamp patterns. Propose-then-commit with challenge-and-response is the shape that survives Article 14 scrutiny in the Microsoft Agent Governance Toolkit compliance docs.



## Further Reading

- [Microsoft Agent Framework — Human in the loop](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) — `RequestInfoEvent`, durable approvals.
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/) — `waitForApproval()` and Durable Objects.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — HITL as a mitigation for long-horizon risk.
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/) — regulatory baseline for high-risk systems.
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) — constitutional framing around oversight.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the autonomy mechanism and assumptions behind Human-in-the-Loop: Propose-Then-Commit.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Model its control loop, state transitions, and stopping conditions explicitly.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Apply bounded permissions, budgets, and rollback controls.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the autonomy mechanism and assumptions behind Human-in-the-Loop: Propose-Then-Commit,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Apply bounded permissions, budgets, and rollback controls,” and cite a repeatable check rather than relying on visual inspection alone.
