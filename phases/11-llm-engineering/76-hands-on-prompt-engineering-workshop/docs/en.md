# Prompt Patterns That Scale: From One-Shots to Output Contracts (2026)

> Anthropic's internal evals show that switching from an unstructured instruction to a well-formed prompt pattern cuts hallucination rate by 30–50% on knowledge-intensive tasks — without changing the model. As of 2026, frontier models (Claude Opus 4, Sonnet 4, Fable 5, GPT-4.1, Gemini 2.5) are capable enough that most quality failures in production are no longer model failures: they are prompt failures. The gap between "write me a summary" and a structured prompt with a role, scope constraint, output contract, and a worked example is the same gap as the difference between a junior analyst's first draft and a senior consultant's deliverable. Prompt engineering in 2026 is not about tricks — it is about encoding professional standards into a replicable format that survives context changes, model upgrades, and handoffs to teammates.

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
- **GPT-4.1** — responds well to markdown section headers as structural cues; less sensitive to XML tags.

The cross-model rule: write output contracts in a format that is model-agnostic (a labelled template or JSON Schema) and rely on model-specific syntax only where the model's documentation says it helps. This makes prompts portable when you switch models — which you will, because model pricing, latency, and capability change every quarter.

### What makes a prompt maintainable

A prompt is maintainable when a second person can:
- Read it and understand what each sentence is doing (annotate your prompt).
- Edit one layer without breaking the others.
- Run the probe set and know whether the edit improved or degraded output.
- Upgrade the model version without rewriting from scratch.

In practice this means: keep prompts in version control, annotate the structure, keep the probe set alongside the prompt, and document the output contract as a separate artifact. The skill-checklist in this lesson's `outputs/` directory is the format this team uses.

## Use It

`code/main.py` is a deterministic, stdlib-only model of the two core decisions in this lesson:

1. A **prompt pattern classifier** that takes a prompt string and identifies which of the six named patterns it uses (or flags it as unstructured), with the reasoning shown.
2. An **output contract validator** that takes a model response and a labelled-template contract and reports which required fields are present, which are missing, and whether any value constraint is violated.

No network, no model calls — the point is to make the classification and validation logic explicit and runnable so you can apply it to prompts from your own work.

## Ship It

`outputs/skill-prompt-pattern-picker.md` is a one-page decision aid: given a task type, it maps to the right pattern, the minimum prompt layers needed, the output contract format to use, and the probe set size. Paste it into your team wiki or keep it open alongside whatever LLM tool you use.

## Exercises

1. Run `code/main.py`. How many of the sample prompts in the classifier output are identified as "unstructured"? Pick one and rewrite it as a few-shot-with-contract prompt. Re-run to confirm the classifier now labels it correctly.

2. The output contract validator in `code/main.py` flags at least one response as having a missing required field. Find it. Write the one sentence you would add to the original prompt to prevent that field from being omitted.

3. Take a prompt you currently use at work. Map it to the five-layer anatomy table. Which layers are missing? Add the missing layers and note whether the output changes on your next run.

4. Write a critic-then-revise prompt pair for a consulting deliverable you produce regularly (e.g., a project status summary or a requirements gap analysis). The critic prompt must check against at least three named criteria. Write both prompts out in full.

5. Run `code/main.py` and look at the pattern classifier's confidence scores. Four prompts score below 0.5. Pick the chain-of-thought sample — it scores 0.42 despite containing "think step by step." Open the source and trace why: what feature is present but what features are absent that would push the score above 0.5? Describe one rule you would add to the classifier to resolve the ambiguity for CoT prompts.

## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| Prompt pattern | "The way I wrote the prompt" | A named, reusable template structure with documented intent and expected output shape |
| Output contract | "Specify the format" | An explicit, checkable specification of required fields, types, and value constraints |
| Few-shot | "Give it examples" | Providing complete input → output pairs that shift the model's format *and* reasoning style |
| Chain-of-thought | "Tell it to think step by step" | Eliciting explicit intermediate reasoning, which reduces errors on multi-step tasks |
| Critic-then-revise | "Have it check itself" | A two-call pattern where a second model call evaluates the first against a rubric before the output is used |
| Probe set | "Test cases for prompts" | A fixed set of varied inputs (typical, edge, adversarial) used to verify and regression-test a prompt |
| Scope constraint | "Tell it what not to do" | Explicit exclusions in the prompt that prevent output bloat and scope creep |
| Decompose and route | "Break it into parts" | Splitting a complex task across multiple focused prompts rather than one overloaded instruction |

## Further Reading

- [Anthropic — Prompt engineering guide](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview) — the canonical reference for Claude-family prompt anatomy, XML tags, and structured output.
- [OpenAI — Prompt engineering guide](https://platform.openai.com/docs/guides/prompt-engineering) — covers similar ground for GPT models; useful for cross-model portability.
- [DAIR.AI — Prompt Engineering Guide](https://www.promptingguide.ai/) — community-maintained, covers chain-of-thought, ReAct, and structured output patterns with citations.
- [Anthropic — Claude model overview and system prompt best practices](https://docs.claude.com/en/docs/about-claude/models/overview) — current model list, context windows, and recommended prompt structures per model.
- [Wei et al., "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models" (NeurIPS 2022)](https://arxiv.org/abs/2201.11903) — the original CoT paper; the core finding still holds on 2026 models.
