# Memory Blocks and Sleep-Time Compute (Letta)

> MemGPT became Letta in 2024. The 2026 evolution adds two ideas: discrete functional memory blocks the model can edit directly, and a sleep-time agent that consolidates memory asynchronously while the primary agent is idle. This is how you scale memory beyond one conversation.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 14 · 07 (MemGPT)
**Time:** ~75 minutes

## Learning Objectives

- Name the three memory tiers Letta uses (core, recall, archival) and the role of each.
- Explain the memory-block pattern: Human block, Persona block, and user-defined blocks as first-class typed objects.
- Describe what sleep-time compute is, why it sits off the critical path, and why it can run a stronger model than the primary agent.
- Implement a scripted two-agent loop where a primary agent serves responses and a sleep-time agent consolidates blocks between turns.

## The Problem

MemGPT (Lesson 07) solved the virtual-memory control flow. Three production problems emerged:

1. **Latency.** Every memory operation sits on the critical path. If the agent has to prune, summarize, or reconcile while the user waits, tail latency blows up.
2. **Memory rot.** Writes accumulate. Contradicted facts stay. Retrieval drowns in stale content.
3. **Structure loss.** A flat archival store cannot express "the Human block is always in the prompt; the Persona block is always in the prompt; the Task block swaps per session."

Letta (letta.com) is the 2026 rewrite. Memory blocks make structure explicit; sleep-time compute moves consolidation off the critical path.

## The Concept

### Three tiers

| Tier | Scope | Where it lives | Written by |
|------|-------|----------------|------------|
| Core | Always visible | Inside the main prompt | Agent tool call + sleep-time rewrites |
| Recall | Conversation history | Retrievable | Automatic turn logging |
| Archival | Arbitrary facts | Vector + KV + graph | Agent tool call + sleep-time ingest |

Core is the MemGPT core. Recall is the conversation buffer with its evicted tail. Archival is the external store. The split cleans up MemGPT's two-tier overloading.

### Memory blocks

A block is a typed, persistent, editable section of the core tier. The original MemGPT paper defined two:

- **Human block** — facts about the user (name, role, preferences, goals).
- **Persona block** — the agent's self-concept (identity, tone, constraints).

Letta generalizes to arbitrary user-defined blocks: a `Task` block for the current goal, a `Project` block for codebase facts, a `Safety` block for hard constraints. Each block has an `id`, `label`, `value`, `limit` (character cap), `description` (so the model knows when to edit it).

Blocks are editable via the tool surface:

- `block_append(label, text)`
- `block_replace(label, old, new)`
- `block_read(label)`
- `block_summarize(label)` — condense a block that is near its limit.

### Sleep-time compute

The 2025 Letta addition: run a second agent in background, off the critical path. Sleep-time agents process conversation transcripts and codebase context, write `learned_context` into shared blocks, and consolidate or invalidate archival records.

Properties that fall out:

- **No latency cost.** Primary responses do not wait for memory ops.
- **Stronger model allowed.** The sleep-time agent can be a more expensive, slower model because it is not latency-constrained.
- **Natural consolidation window.** Dedup, summarize, invalidate contradicted facts when the user is not waiting.

The shape matches how humans work: you do the task, you sleep on it, the long-term memory settles overnight.

### Letta V1 and native reasoning

Letta V1 (`letta_v1_agent`, 2026) deprecates `send_message`/heartbeat and inline `Thought:` tokens in favor of native reasoning. The Responses API (OpenAI) and the Messages API with extended thinking (Anthropic) emit reasoning on a separate channel, passed through turns (encrypted across providers in production). The control loop is still ReAct. The thought trace is structural, not prompt-shaped.

### Where this pattern goes wrong

- **Block bloat.** Infinite `block_append` hits the limit fast. Wire a block summarizer before the write that pushes over the cap.
- **Silent drift.** Sleep-time agent rewrites a block and the primary agent never notices. Version blocks and surface diffs in the trace.
- **Poisoned consolidation.** Sleep-time agent processes attacker-reachable content into core. Lesson 27 applies to the sleep-time surface too.




## Build It

Reconstruct **Memory Blocks and Sleep-Time Compute (Letta)** by following `Block` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `Block` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-memory-blocks.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) — the block pattern
- [Letta, Sleep-time Compute blog](https://www.letta.com/blog/sleep-time-compute) — async consolidation
- [Letta, Rearchitecting the Agent Loop](https://www.letta.com/blog/letta-v1-agent) — native reasoning rewrite
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) — the origin

## Exercises

Use `Block` as the trace: start from the demo’s smallest built-in fixture, keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `Block`, `append`, `replace`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Name the three memory tiers Letta uses (core, recall, archival) and the role of each.**.
2. **Vary one named input.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Explain the memory-block pattern: Human block, Persona block, and user-defined blocks as first-class typed objects.** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Describe what sleep-time compute is, why it sits off the critical path, and why it can run a stronger model than the primary agent.** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-memory-blocks.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Implement a scripted two-agent loop where a primary agent serves responses and a sleep-time agent consolidates blocks between turns.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Memory Blocks and Sleep-Time Compute (Letta)** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `Block`, `append`, `replace` traced to the value or shape that supports **Name the three memory tiers Letta uses (core, recall, archival) and the role of each.**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Explain the memory-block pattern: Human block, Persona block, and user-defined blocks as first-class typed objects.**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Describe what sleep-time compute is, why it sits off the critical path, and why it can run a stronger model than the primary agent.**; and
- an updated `outputs/skill-memory-blocks.md` example with a concrete input, expected output field, and acceptance check tied to **Implement a scripted two-agent loop where a primary agent serves responses and a sleep-time agent consolidates blocks between turns.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
