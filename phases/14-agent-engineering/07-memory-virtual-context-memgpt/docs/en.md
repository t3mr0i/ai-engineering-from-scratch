# Memory: Virtual Context and MemGPT

> Context windows are finite. Conversations, documents, and tool traces are not. MemGPT (Packer et al., 2023) frames this as OS virtual memory — main context is RAM, external store is disk, the agent pages between them. This is the pattern every 2026 memory system inherits.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## Learning Objectives

- Explain the OS analogy MemGPT builds on: main context = RAM, external context = disk, memory tools = page in/out.
- Implement the two-tier MemGPT pattern in stdlib with a main-context buffer, an external searchable store, and page in/out tools.
- Describe how the agent issues "interrupts" to query or modify external memory and how the result is spliced back into the next prompt.
- Identify the MemGPT design choices that carry into Letta (Lesson 08) and Mem0 (Lesson 09).

## The Problem

Context windows look like they should solve memory. They do not. Three failure modes recur in production:

1. **Overflow.** Multi-turn conversations, long documents, or tool-call-heavy trajectories cross the window. Everything past the cutoff is gone.
2. **Dilution.** Even within the window, stuffing irrelevant context dilutes attention over what matters. Frontier models still degrade on long inputs.
3. **Persistence.** A new session starts with an empty window. Agents without external memory cannot say "remember when you asked me to..." across sessions.

Bigger windows help but do not fix this. Mem0's 2025 paper measured that 128k-window baselines still miss long-horizon facts that a 4k-window agent with external memory catches.

## The Concept

### MemGPT: the OS analogy

Packer et al. (arXiv:2310.08560, v2 Feb 2024) map context management to operating-system virtual memory:

| OS concept | MemGPT concept | 2026 production analog |
|------------|---------------|------------------------|
| RAM | main context (prompt) | Anthropic/OpenAI context window |
| Disk | external context | vector DB, KV, graph store |
| Page fault | memory tool call | `memory.search`, `memory.read`, `memory.write` |
| OS kernel | agent control loop | ReAct loop with memory tools |

The agent runs a normal ReAct loop. One extra class of tools lets it page data in and out of main context.

### Two tiers

- **Main context.** Fixed-size prompt holding the current task. Always visible to the model.
- **External context.** Unbounded, searchable via tools. Read when relevant, written when facts emerge.

The original paper evaluated the design on two tasks beyond the base window: document analysis longer than 100k tokens and multi-session chat with persistent memory across days.

### The interrupt pattern

MemGPT introduces memory-as-interrupt: mid-conversation the agent can invoke a memory tool, the runtime executes it, and the result splices into the next assistant turn as a new observation. Conceptually identical to a Unix `read()` syscall that blocks the process, returns bytes, and the process continues.

Canonical memory tool surface:

- `core_memory_append(section, text)` — write to a persistent section of the prompt.
- `core_memory_replace(section, old, new)` — edit a persistent section.
- `archival_memory_insert(text)` — write to the searchable external store.
- `archival_memory_search(query, top_k)` — retrieve from the external store.
- `conversation_search(query)` — scan past turns.

### Where MemGPT ends and Letta begins

In September 2024 MemGPT became Letta. The research repo (`cpacker/MemGPT`) remains; Letta extends the design:

- Three tiers instead of two (core, recall, archival — Lesson 08).
- Native reasoning replacing the `send_message`/heartbeat pattern (Lesson 08).
- Sleep-time agents running async memory work (Lesson 08).

The MemGPT paper is the 2026 foundation even if production systems run Letta, Mem0, or a custom two-tier store.

### Where this pattern goes wrong

- **Memory rot.** Writes accumulate faster than reads; retrieval drowns in stale facts. Fix: periodic consolidation (Letta sleep-time), explicit invalidation (Mem0 conflict detector).
- **Memory poisoning.** External memory is retrieved text. If attacker-controlled content lands in a memory note, the agent re-ingests it next session. This is the Greshake et al. (Lesson 27) attack restated over time.
- **Citation loss.** Agent recalls "the user asked me to ship X" but cannot cite which turn. Store source references (session ID, turn ID) with every archival write.




## Build It

Reconstruct **Memory: Virtual Context and MemGPT** by following `Message` on the text "red fox". Run `python3 main.py` and verify that the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text.

## Use It

Call `Message` from a small caller with the text "red fox". Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-virtual-memory.md` with the command `python3 main.py`, the accepted input shape (the text "red fox"), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) — OS-inspired virtual context paper
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) — the three-tier evolution
- [Anthropic, Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — treating context as a budget
- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413) — hybrid production memory on top of this pattern

## Exercises

Work from the smallest fixture that the Memory: Virtual Context and MemGPT demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using the text "red fox". Follow `Message`, `MainContext`, `append`. Expect the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the OS analogy MemGPT builds on: main context = RAM, external context = disk, memory tools = page in/out.**.
2. **Perturb one field.** Repeat the command after changing only the input text: use the text "red fox runs". Predict the direction of the change, then compare the two output values. Explain why **Implement the two-tier MemGPT pattern in stdlib with a main-context buffer, an external searchable store, and page in/out tools.** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation an empty string. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Describe how the agent issues "interrupts" to query or modify external memory and how the result is spliced back into the next prompt.** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-virtual-memory.md` and add a worked example using the text "red fox". Include the input contract, one expected output field, and a named acceptance check for **Identify the MemGPT design choices that carry into Letta (Lesson 08) and Mem0 (Lesson 09).**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Memory: Virtual Context and MemGPT** should contain:

- the `python3 main.py` output for the text "red fox", with `Message`, `MainContext`, `append` traced to the value or shape that supports **Explain the OS analogy MemGPT builds on: main context = RAM, external context = disk, memory tools = page in/out.**;
- a before/after comparison for the input text, where the text "red fox runs" changes the observation in the direction predicted by **Implement the two-tier MemGPT pattern in stdlib with a main-context buffer, an external searchable store, and page in/out tools.**;
- a recorded result for an empty string that matches the implementation’s validation or empty-result contract and explains the evidence for **Describe how the agent issues "interrupts" to query or modify external memory and how the result is spliced back into the next prompt.**; and
- an updated `outputs/skill-virtual-memory.md` example with a concrete input, expected output field, and acceptance check tied to **Identify the MemGPT design choices that carry into Letta (Lesson 08) and Mem0 (Lesson 09).**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
