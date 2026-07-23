# Shared Memory and Blackboard Patterns

> Two approaches coexist in 2026 multi-agent systems: the **message pool** (everyone sees everyone's messages, as in AutoGen GroupChat or MetaGPT) and the **blackboard with subscription** (agents subscribe to relevant events, as in Context-Aware MCP or the Matrix framework). Both are the only stateful part of a multi-agent system — which means both are where the interesting bugs live. The reference failure mode is **memory poisoning**: one agent hallucinates a "fact," other agents treat it as verified, and accuracy decays gradually in a way that is much harder to debug than an immediate crash. This lesson builds both structures from stdlib, injects a poisoning attack, and shows the three mitigations that actually work in production.

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`)
**Prerequisites:** Phase 16 · 04 (Primitive Model), Phase 16 · 09 (Parallel Swarm Networks)
**Time:** ~75 minutes

## Problem

Multi-agent systems need a place for agents to share facts. A literal option is "pass everything in messages" — but that reinvents shared state with extra copying. Another is "give everyone a global log" — but global logs grow unbounded and poison easily. A third is "project a view per agent" — scalable but schema-heavy.

When one of the agents hallucinates and writes the hallucination to shared state, every downstream agent that reads that state adopts the hallucination as fact. By the time the human notices, the reasoning chain is five steps deep and the root cause is the third message ever written. Debugging multi-agent accuracy decay is harder than debugging a crash.

This is memory poisoning. It is the second-most-documented failure family in the MAST taxonomy (Cemri et al., arXiv:2503.13657) and it is structural: any shared-memory design without provenance and an unwritable verifier will exhibit it eventually.

## Concept

### The two main topologies

**Full message pool.** Every agent reads every message. AutoGen GroupChat and MetaGPT use this. Simple, transparent, inspectable, but does not scale past ~10 agents because each agent's context fills with other agents' work.

```
agent-A ──write──▶ ┌────────────────┐ ◀──read── agent-D
                   │ message pool   │
agent-B ──write──▶ │                │ ◀──read── agent-E
                   │ (global log)   │
agent-C ──write──▶ └────────────────┘ ◀──read── agent-F
```

**Blackboard with subscription.** Agents declare interest in topics; the substrate routes only relevant messages. CA-MCP (arXiv:2601.11595) and the Matrix decentralized framework (arXiv:2511.21686) use this. Scales further, but requires upfront schema design to make subscriptions meaningful.

```
                   ┌─ topic: prices ──┐
agent-A ──pub────▶ │                  │ ──▶ agent-D (subscribed)
                   ├─ topic: orders ──┤
agent-B ──pub────▶ │                  │ ──▶ agent-E (subscribed)
                   ├─ topic: alerts ──┤
agent-C ──pub────▶ │                  │ ──▶ agent-F (subscribed)
                   └──────────────────┘
```

### When each wins

- **Full pool** wins when agents are few (< 10), heterogeneous, and the conversation is short-horizon. Reasoning about who said what is trivial when everyone sees everything.
- **Blackboard** wins when agents are many, homogeneous in role but numerous in instance (swarms), and the conversation is long-running. Routing saves token cost and context pollution.

Production systems often mix: a small full pool at the top (planning layer), blackboards below (worker layer).

### Memory poisoning, in one scenario

Three agents work on a research task. Agent A is a retrieval agent. Agent B is a summarizer. Agent C is an analyst.

1. A fetches a page and writes a message to shared state: "The study reports a 42% accuracy improvement."
2. The fetched page actually said "4.2% improvement." A hallucinated a decimal.
3. B, reading shared state, writes: "Large 42% accuracy gain reported (source: A)."
4. C, reading shared state, writes: "Recommend adoption — 42% lift is transformative."
5. The final report cites a 42% number that never existed.

No agent crashed. No test failed. The system "worked." The hallucination crossed from one agent's context into every downstream agent's reasoning via shared state.

### Why this is structural

Without shared state, agent A's hallucination stays in A's context. Downstream agents would re-fetch or re-derive and might catch the error. With naive shared state, A's context becomes everyone's context, and the hallucination is laundered into fact.

The problem is not shared state per se — it is shared state **without provenance and without an independent verifier**. Three mitigations address this:

1. **Attribute provenance on every write.** Every entry in shared state records who wrote it, when, under what prompt, and (if applicable) what source the agent cited. Downstream agents read with skepticism keyed to provenance.
2. **Version writes; treat them as append-only.** A correction is a new entry that supersedes the old, not an in-place update. The audit trail is preserved.
3. **Keep at least one agent that cannot write to shared state.** A read-only verifier agent samples entries, re-fetches sources, and flags inconsistencies. Because it cannot write to the pool, it cannot be poisoned by the pool.

### Blackboard precedent (Hayes-Roth, 1985)

The blackboard pattern predates LLM agents by four decades. Hayes-Roth (1985, "A Blackboard Architecture for Control") described specialist Knowledge Sources that observe a global blackboard, contribute partial solutions, and trigger other sources. The 2026 blackboard (CA-MCP, Matrix) is the same pattern with LLM agents as Knowledge Sources and JSON blobs as partial solutions. The old literature has documented solutions to write contention, opportunistic control, and consistency that modern systems rediscover.

### Projection vs full view

A pure blackboard gives every subscriber the same projection (topic-scoped). A more aggressive design is **per-agent projection**: each agent gets a view customized to its role. LangGraph's state reducers are the canonical 2026 implementation — the reducer function folds global state into a role-specific slice.

Per-agent projection scales further but needs a schema. Without one, you rebuild ad-hoc projection in every agent's prompt.

### Write-contention patterns

Multiple agents writing simultaneously is a concurrency problem, not just an LLM problem. Three patterns work:

- **Sequential writer (single producer).** All writes go through one coordinator agent that serializes. Simple, but a bottleneck.
- **Optimistic concurrency with versioning.** Each entry has a version; writers fail on version mismatch and retry. Classic database technique.
- **Topic partitioning.** Different agents own different topics. No cross-topic contention. Requires designed partition boundaries.

Most 2026 frameworks default to sequential writer because LLM calls are slow enough that contention is rare and the bottleneck does not hurt.

### The unwritable verifier

The most load-bearing mitigation is the read-only verifier. Implementation rules:

- Verifier shares state with the team (reads the blackboard or pool).
- Verifier has no write handle to shared state — only to a separate verification channel.
- Verifier independently fetches sources cited in writes. Flags disagreement.
- Verifier's own outputs are routed to a human or a separate decision agent, never fed back into the pool.

Without this separation, the verifier's outputs become new entries in the pool, which means a poisoned pool poisons the verifier, which poisons its verifications.




## Further Reading

- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) — MAST taxonomy; memory poisoning is a coordination-failure sub-family
- [CA-MCP — Context-Aware Multi-Server MCP](https://arxiv.org/abs/2601.11595) — Shared Context Store for coordinated MCP servers
- [Matrix — decentralized multi-agent framework](https://arxiv.org/abs/2511.21686) — message-queue-based blackboard without a central orchestrator
- [LangGraph state and reducers](https://docs.langchain.com/oss/python/langgraph/workflows-agents) — the per-agent projection pattern in production
- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — provenance and verification notes from a production deployment
