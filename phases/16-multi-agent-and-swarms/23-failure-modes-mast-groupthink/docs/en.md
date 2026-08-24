# Failure Modes — MAST, Groupthink, Monoculture, Cascading Errors

> [MAST](https://arxiv.org/abs/2503.13657) derives a multi-agent failure taxonomy from 1,642 execution traces across seven open-source systems, reporting 41–86.7% failure rates and grouping causes into specification, coordination, and verification categories. The [Groupthink survey](https://arxiv.org/abs/2508.05687) extends the picture with monoculture collapse, conformity bias, deficient theory of mind, and cascading reliability failures. This lesson treats those reported taxonomies as hypotheses to test against your own traces.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 16 · 13 (Shared Memory), Phase 16 · 14 (Consensus and BFT), Phase 16 · 15 (Voting and Debate Topology)
**Time:** ~75 minutes

## Learning Objectives

- Explain the coordination mechanism behind Failure Modes — MAST, Groupthink, Monoculture, Cascading Errors
- Implement the central multi-agent interaction from first principles
- Trace messages, shared state, and verification decisions end to end
- Evaluate coordination quality, cost, and correlated failure modes

## Problem

Multi-agent systems fail 41-86.7% of the time on real tasks (Cemri et al. 2025 measured this across 7 open-source MAS). That is not debuggable by "just add more agents." The failures have structural causes. The MAST taxonomy gives you the categories. This lesson maps each category to a concrete detection, diagnosis, and mitigation pattern so the numbers stop looking arbitrary.

The 2026 production practice is to treat failure modes as design inputs. Your architecture is not "good enough" until you can point to each MAST category and name the mitigation you deployed.

## Concept

### MAST categories

**Specification Problems (41.77% of failures).** The agent's task was not defined tightly enough. Examples:

- Role ambiguity: two agents both think they are the reviewer.
- Task underspecified: "summarize this" when the user wanted a specific angle.
- Success criteria implicit: the agent cannot tell if it succeeded.

Mitigations:
- Write explicit role contracts. Each agent's prompt states what it does *and what it does not do*.
- Acceptance tests per task. Before the agent starts, define "done looks like X."
- Pre-flight spec check: a separate agent reviews the task definition before dispatch.

**Coordination Failures (36.94%).** Communication or state breakdowns.

Examples:
- Two agents update shared state without synchronization.
- Message lost between agents (queue failure, timeout).
- State drift: agent A thinks the task is done; agent B is still executing.

Mitigations:
- Versioned shared state with optimistic concurrency.
- Explicit acknowledgment for critical messages (retry until acked).
- Periodic state-sync checkpoints; detect drift early.

**Verification Gaps (21.30%).** No independent check on outputs.

Examples:
- One agent claims success; no one verifies.
- Chain of agents each trusts the prior's output.
- Test coverage missing on the emergent composed behavior.

Mitigations:
- Independent verifier agent (Lesson 13). Read-only, independent source access.
- Explicit handoff contract: "A's output must pass checker C before B starts."
- Outcome logging for post-hoc analysis.

### Groupthink family (arXiv:2508.05687)

Five related failures when agents homogenize or mimic each other:

**Monoculture collapse.** Same base model or training data → correlated errors. When three agents share an LLM, they share its hallucinations.

**Conformity bias.** Agents adjust toward the loudest or most-confident peer, even when wrong.

**Deficient ToM.** Agents fail to model each other's beliefs; coordination falls apart (Lesson 18).

**Mixed-motive dynamics.** Agents with partially-aligned incentives drift toward compromise-middle, which satisfies no one.

**Cascading reliability failures.** One component's error pattern triggers error patterns in dependent components.

### Cascading example — the retry storm

A classic 2026 incident pattern:

```
payment service fails 10% of requests
   ↓
order agent retries payment (exponential backoff but naive)
   ↓
each retry is a new order-inventory check
   ↓
inventory service sees 2x normal load
   ↓
inventory service starts timing out
   ↓
every order retries inventory check
   ↓
inventory service sees 10x normal load
   ↓
cluster goes down
```

The fix is classical: **circuit breakers**. When downstream error rate exceeds threshold, short-circuit with cached or default results. Plus capped retry budgets per request.

Circuit breakers are one of the few multi-agent failure mitigations you borrow directly from distributed systems without modification.

### Memory poisoning (revisited)

From Lesson 13: one agent's hallucination becomes shared-memory fact; downstream agents reason on the poisoned fact. In MAST terms, this is a verification gap at the shared-memory layer.

Gradual accuracy decay is the symptom. You do not get a crash; you get slow drift that is hard to root-cause.

Mitigation: append-only log, provenance, unwritable verifier. Already covered in Lesson 13.

### STRATUS — specialized agents for failure detection

STRATUS (NeurIPS 2025) reports 1.5x mitigation-success improvement when you deploy:

- **Detection agent.** Watches for symptom patterns (high disagreement, retry spikes, accuracy drift).
- **Diagnosis agent.** Given symptoms, infers likely root cause from the MAST taxonomy.
- **Validation agent.** After a mitigation is applied, checks that symptoms clear.

This is SRE-style incident response, applied to agent systems. The three roles can all be LLM agents with specialized prompts.

### The failure-mode audit

A 2026 best practice is an annual (or per-major-release) failure-mode audit:

1. **Trace sample.** Collect ~1000 real execution traces.
2. **Categorize.** For each trace's failures, map to MAST + Groupthink categories.
3. **Compute failure-by-category rate.** Which categories dominate your system?
4. **Rank mitigations.** Which fix would eliminate the most failures?
5. **Pick 2-3 mitigations.** Implement; re-audit next quarter.

The discipline is more important than the specific choices. Without audits, failures blend into noise and never get systematically addressed.

### When systems fail silently

The most dangerous failure category is silent correctness failure. A system that fails loudly (crash, exception, alert) can be monitored. A system that produces plausible-but-wrong outputs cannot be detected by exception logs. This is why verification gaps are the most expensive category per-failure even though they are only 21.30% by count.

Invest in:
- Sample-based human review.
- Golden-dataset regression tests.
- Cross-agent cross-checking on important outputs.

### Failure vs slow failure

Some failures are immediate; some are slow. Immediate failures (timeout, schema mismatch, auth error) are cheap to detect. Slow failures (memory poisoning, monoculture drift, role ambiguity) are expensive to detect and prevent.

The 2026 engineering move: instrument slow-failure proxies so you can catch drift before it becomes a visible error. Agreement rate, retry rate, output-length distribution, and edit-distance between consecutive agent versions are all useful proxies.




## Further Reading

- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) — MAST taxonomy, NeurIPS 2025
- [Groupthink failures in multi-agent LLMs](https://arxiv.org/abs/2508.05687) — monoculture, conformity, and the five-family taxonomy
- [STRATUS — specialized agents for MAS incident response](https://neurips.cc/) — NeurIPS 2025 proceedings entry (detection + diagnosis + validation)
- [Release It! — stability patterns (Nygard)](https://pragprog.com/titles/mnee2/release-it-second-edition/) — the canonical circuit-breaker reference
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — production failure-mode notes
