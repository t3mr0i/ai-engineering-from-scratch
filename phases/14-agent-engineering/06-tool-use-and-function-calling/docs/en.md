# Tool Use and Function Calling

> Toolformer (Schick et al., 2023) started self-supervised tool annotation. Berkeley Function Calling Leaderboard V4 (Patil et al., 2025) sets the 2026 bar: 40% agentic, 30% multi-turn, 10% live, 10% non-live, 10% hallucination. Single-turn is solved. Memory, dynamic decision-making, and long-horizon tool chains are not.

**Type:** Build
**Languages:** Python, TypeScript
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 13 · 01 (Function Calling Deep Dive)
**Time:** ~60 minutes

## Learning Objectives

- Explain Toolformer's self-supervised training signal: keep tool annotations only when execution reduces next-token loss.
- Name BFCL V4's five evaluation categories and what each measures.
- Implement a stdlib tool registry with schema validation, argument coercion, and execution sandboxing.
- Diagnose the three 2026 open problems: long-horizon tool chaining, dynamic decision-making, and memory.

## The Problem

Early tool use asked: can the model predict a correct function call? Modern tool use asks: can the model chain tools across 40 steps, with memory, with partial observability, with recovery from tool failures, without hallucinating tools that do not exist?

Toolformer established the baseline: models can learn when to call tools with self-supervision. BFCL V4 defines the 2026 evaluation target. The gap between them is the space production agents live in.

## The Concept

### Toolformer (Schick et al., NeurIPS 2023)

Idea: let the model annotate its own pretraining corpus with candidate API calls. For each candidate, execute it. Keep the annotation only if including the tool result reduces loss on the next token. Fine-tune on the filtered corpus.

Tools covered: calculator, QA system, search engines, translator, calendar. The self-supervision signal is purely about whether the tool helps predict text — no human labels.

Scale result: tool use emerges at scale. Smaller models hurt from tool annotations; larger models gain. This is why 2026 frontier models have strong tool use baked in while most 7B models need explicit tool-use fine-tuning to be reliable.

### Berkeley Function Calling Leaderboard V4 (Patil et al., ICML 2025)

BFCL is the 2026 de facto evaluation. V4 composition:

- **Agentic (40%)** — full agent trajectories: memory, multi-turn, dynamic decisions.
- **Multi-Turn (30%)** — interactive conversations with tool chains.
- **Live (10%)** — user-submitted real prompts (harder distribution).
- **Non-Live (10%)** — synthetic test cases.
- **Hallucination (10%)** — detect when no tool should be called.

V3 introduced state-based evaluation: after a tool sequence, check the API's actual state (e.g. "is the file created?") rather than match the AST of the tool calls. V4 added web search, memory, and format sensitivity categories.

Key 2026 finding: single-turn function calling is near-solved. Failures concentrate in memory (carrying context across turns), dynamic decision-making (choosing tools based on prior results), long-horizon chains (drift after 20+ steps), and hallucination detection (refusing to call when no tool fits).

### Tool schema

Every provider has a schema. They differ in details but share the same shape:

```
name: string
description: string (what it does, when to use it)
input_schema: JSON Schema (properties, required, types, enums)
```

Anthropic uses `input_schema` directly. OpenAI uses `function.parameters`. Both accept JSON Schema. Descriptions are load-bearing — the model reads them to pick the right tool. Bad tool descriptions are the #1 root cause of wrong-tool-picked failures.

### Argument validation

Trust no tool call. Validate:

1. **Type coercion.** Model may return a string "5" where the schema says int. Coerce if unambiguous; reject if not.
2. **Enum validation.** If the schema says `status in {"open", "closed"}` and model emits `"in_progress"`, reject with a descriptive error.
3. **Required fields.** Missing required field -> immediate error observation back to the model, not a crash.
4. **Format validation.** Dates, emails, URLs — validate with concrete parsers, not regex.

Every validation failure should return a structured observation so the model can retry with the correct shape.

### Parallel tool calls

Modern providers support parallel tool calls in one assistant turn. The loop:

1. Model emits 3 tool calls with distinct `tool_use_id`s.
2. Runtime executes them (in parallel if independent).
3. Each result goes back as a `tool_result` block correlated by `tool_use_id`.

Engineering rule: treat correlation IDs as load-bearing. Swap them and you get wrong-tool-to-wrong-result routing.

### Sandboxing

Tool execution is the sandbox boundary. Every tool should specify read/write surface, network access, timeout, memory cap. Generic `run_shell(cmd)` is a red flag; specific `git_status()` is safer.




## Further Reading

- [Schick et al., Toolformer (arXiv:2302.04761)](https://arxiv.org/abs/2302.04761) — self-supervised tool annotation
- [Berkeley Function Calling Leaderboard (V4)](https://gorilla.cs.berkeley.edu/leaderboard.html) — 2026 eval benchmark
- [Anthropic, Tool use documentation](https://platform.claude.com/docs/en/agent-sdk/overview) — production tool schema in the Claude Agent SDK
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) — function tool type and Guardrails
