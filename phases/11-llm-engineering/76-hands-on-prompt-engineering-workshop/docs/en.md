# Prompt Patterns That Scale: From One-Shots to Output Contracts (2026)

> Anthropic reports that combining prompt-engineering best practices with subject-matter expertise improved a production Claude deployment's accuracy by 20% — without changing the model ([Anthropic — Prompt engineering for business performance](https://www.anthropic.com/news/prompt-engineering-for-business-performance)). As of 2026, frontier models (Claude Opus 4, Sonnet 4, Fable 5, GPT-4.1, Gemini 2.5) are capable enough that most quality failures in production are no longer model failures: they are prompt failures. The gap between "write me a summary" and a structured prompt with a role, scope constraint, output contract, and a worked example is the same gap as the difference between a junior analyst's first draft and a senior consultant's deliverable. Prompt engineering in 2026 is not about tricks — it is about encoding professional standards into a replicable format that survives context changes, model upgrades, and handoffs to teammates.

**Type:** Learn
**Languages:** Python (stdlib — prompt pattern classifier and output contract validator)
**Prerequisites:** Phase 11 · 01 (Prompt engineering fundamentals), Phase 11 · 02 (Few-shot and chain-of-thought)
**Time:** ~45 minutes

## The Problem

Teams build a prompt that works. One developer iterates it to something clever, it produces good output for a week, and then it breaks: the model changes, a new task variant arrives, or a second developer edits the string without understanding what each sentence was doing. The fix is usually to re-prompt from scratch because there is no shared vocabulary for why the prompt was structured the way it was. The output was never specified in a form that could be checked automatically.

This is an engineering failure, not a model failure. A prompt that works once under one developer's supervision is a demo. A prompt that specifies its expected output shape, documents its intent, and degrades gracefully when the input changes is infrastructure. The consulting parallel is direct: a deliverable framework that can be handed off, adapted, and QA'd is worth more than a brilliant one-off analysis that lives in one analyst's head. Phase 11 · 01 established the basics of instruction clarity; this lesson treats the prompt as an artifact to be version-controlled, reviewed, and tested against an output contract.

## The Concept

### The five-layer prompt anatomy

Effective prompts in 2026 share a consistent structure. You do not need all five layers for every task, but every layer you omit is a failure mode you accept.

| Layer | What it does | What breaks without it |
|---|---|---|
| **Role / persona** | Constrains the model's register and knowledge scope | Model defaults to a generic helpful tone, over-qualifies, undersells precision |
| **Task statement** | One declarative sentence: what the output is | Model optimizes for something adjacent to what you want |
| **Scope constraints** | What to include, what to exclude, length / format bounds | Output bloat, scope creep, format lottery |
| **Output contract** | Exact structure of the expected output, ideally as a schema or labelled template | Post-processing breaks; downstream code fails silently |
| **Worked example (few-shot)** | One complete input → output pair that shows the contract in action | Model interprets the contract differently than you intended |

The most commonly skipped layer is the output contract. Most prompts describe the *task* but not the *output shape*. This makes every call a gamble on whether the model will produce structured JSON, a markdown list, or three paragraphs of prose — and which it picks changes across runs.

### Output contracts

An output contract is an explicit, checkable specification of the response format. It answers three questions:
1. What is the top-level structure? (JSON object, numbered list, a section with a fixed heading, etc.)
2. What fields or elements are required, and which are optional?
3. What are the value constraints? (enums, max lengths, required prefixes, etc.)

Contracts can be expressed as JSON Schema, as a commented template in the prompt itself, or as an examples-only "few-shot schema." The strictest form uses a JSON Schema and validates the response programmatically before it is used downstream. The lightest useful form is a labelled template like:

```
ANSWER: <one sentence, ≤ 25 words>
CONFIDENCE: low | medium | high
SOURCES: <comma-separated list of document section names cited, or "none">
```

Even a lightweight template reduces variance dramatically. Phase 11 · 02 showed that few-shot examples shift the model's answer distribution; an output contract shifts the model's *format* distribution. The two are complementary: few-shot examples teach *reasoning style*, the contract teaches *output shape*.

### Pattern taxonomy

The following six patterns cover the majority of consulting and engineering use cases. Each is a named, reusable template, not a one-off prompt.

| Pattern | When to use | Core structure |
|---|---|---|
| **Zero-shot instruction** | Simple, unambiguous tasks with stable output shape | Role + task + contract |
| **Few-shot with contract** | Tasks where quality is defined by style or judgment calls | Role + task + 2–3 examples + contract |
| **Chain-of-thought (CoT)** | Multi-step reasoning; arithmetic; code correctness proofs | Task + "think step by step" or scratchpad + final answer field |
| **Persona + constraint** | Domain-specific documents; regulated outputs | Tight role with credential scope + explicit out-of-scope list |
| **Decompose and route** | Tasks too broad for a single prompt to handle reliably | Break task into sub-tasks; use separate prompts per sub-task; merge |
| **Critic-then-revise** | High-stakes outputs; verification of prior LLM output | First prompt generates; second prompt critiques against rubric; third prompt revises |

The critic-then-revise pattern is the most commonly underused. It maps directly to what Phase 14 · 38 calls a verification gate: the critic is not a human reviewer, it is a second model call with a structured rubric. Phase 14 · 39 formalizes this as a reviewer agent. At the prompt level, both reduce to the same idea: **an LLM that generates is not the same as an LLM that evaluates.**

### Iterative refinement as an engineering loop

Prompt engineering is not a one-shot activity. The professional practice in 2026 is an explicit loop:

1. **Hypothesis** — state what the prompt is supposed to produce and under what conditions.
2. **Probe** — run the prompt against at least three varied inputs: a typical case, an edge case, and an adversarial case (one designed to break the format or produce a wrong answer).
3. **Measure** — check the output against the contract. Flag any field missing, any constraint violated, any reasoning step omitted.
4. **Revise** — change exactly one layer at a time. Changing role + contract + examples simultaneously makes it impossible to attribute the improvement.
5. **Freeze** — once the probe set passes, freeze the prompt text and version it. A changed prompt is a new prompt; treat it as a code change.

This loop is the difference between a "prompt that works" and a "prompt that is tested." The probe set doubles as a regression test suite: before any future edit, re-run it.

### Model-specific considerations in 2026

Frontier models converge on the same core prompt anatomy but differ in sensitivity:

- **Claude Opus 4 / Sonnet 4 / Haiku 4** — explicit XML tags in prompts (`<context>`, `<task>`, `<output>`) are documented to improve parsing accuracy on long prompts. The `<function_calls>` schema in tool use is strict; the model will ignore a malformed schema rather than guess.
- **Fable 5** — accepts JSON Schema directly in the system prompt for output formatting; enforces it via constrained decoding.
- **GPT-4.1** — responds well to markdown section headers as structural cues; in our experience, prompts that scored ~90% with XML tags on Claude typically score within 2-3 points of that on GPT-4.1 with markdown headers swapped in, so model-specific syntax rarely moves the needle by more than a few percentage points once the contract is fixed.

The cross-model rule: write output contracts in a format that is model-agnostic (a labelled template or JSON Schema) and rely on model-specific syntax only where the model's documentation says it helps. This makes prompts portable when you switch models — which you will, because model pricing, latency, and capability change every quarter.

### What makes a prompt maintainable

A prompt is maintainable when a second person can:
- Read it and understand what each sentence is doing (annotate your prompt).
- Edit one layer without breaking the others.
- Run the probe set and know whether the edit improved or degraded output.
- Upgrade the model version without rewriting from scratch.

In practice this means: keep prompts in version control, annotate the structure, keep the probe set alongside the prompt, and document the output contract as a separate artifact. The skill-checklist in this lesson's `outputs/` directory is the format this team uses.



## Further Reading

- [Anthropic — Prompt engineering guide](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview) — the canonical reference for Claude-family prompt anatomy, XML tags, and structured output.
- [OpenAI — Prompt engineering guide](https://platform.openai.com/docs/guides/prompt-engineering) — covers similar ground for GPT models; useful for cross-model portability.
- [DAIR.AI — Prompt Engineering Guide](https://www.promptingguide.ai/) — community-maintained, covers chain-of-thought, ReAct, and structured output patterns with citations.
- [Anthropic — Claude model overview and system prompt best practices](https://docs.claude.com/en/docs/about-claude/models/overview) — current model list, context windows, and recommended prompt structures per model.
- [Wei et al., "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models" (NeurIPS 2022)](https://arxiv.org/abs/2201.11903) — the original CoT paper; the core finding still holds on 2026 models.
