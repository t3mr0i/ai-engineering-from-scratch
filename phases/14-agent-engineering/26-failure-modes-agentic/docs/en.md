# Failure Modes: Why Agents Break

> MASFT (Berkeley, 2025) catalogs 14 multi-agent failure modes in 3 categories. Microsoft's Taxonomy documents how existing AI failures amplify in agentic settings. Industry field data converges on five recurring modes: hallucinated actions, scope creep, cascading errors, context loss, tool misuse.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 05 (Self-Refine and CRITIC), Phase 14 · 24 (Observability)
**Time:** ~60 minutes

## Learning Objectives

- Name MASFT's three failure categories and at least four specific modes in each.
- Explain why agentic failure amplifies existing AI failure modes (bias, hallucination).
- Describe the five industry-recurring modes and their mitigations.
- Implement a stdlib detector that tags agent traces with failure-mode labels.

## The Problem

Teams ship agents that work on 90% of traces. The 10% failures are not random noise — they fall into a small number of recurring categories. Once you can name them, you can monitor for them and fix them.

## The Concept

### MASFT (Berkeley, arXiv:2503.13657)

Multi-Agent System Failure Taxonomy. 14 failure modes clustered into 3 categories. Inter-annotator Cohen's Kappa 0.88 — the categories are reliably distinguishable.

Central claim: failures are fundamental design flaws in multi-agent systems, not LLM limitations to be fixed with better base models.

### Microsoft Taxonomy of Failure Mode in Agentic AI Systems

- Existing AI failures (bias, hallucination, data leakage) amplify in agentic settings.
- New failures emerge from autonomy: unintended action at scale, tool misuse, mission drift.
- The whitepaper is the risk register for agentic products.

### Characterizing Faults in Agentic AI (arXiv:2603.06847)

- Failures arise from orchestration, internal state evolution, and environment interaction.
- Not just "bad code" or "bad model output."

### LLM Agent Hallucinations Survey (arXiv:2509.18970)

Two primary manifestations:

1. **Instruction-following Deviation** — agent doesn't follow the system prompt.
2. **Long-range Contextual Misuse** — agent forgets or misapplies context from earlier turns.

Sub-intention errors: Omission (missed step), Redundancy (repeated step), Disorder (out-of-order steps).

### The five industry-recurring modes

Arize, Galileo, NimbleBrain 2024-2026 field analyses converge on:

1. **Hallucinated actions.** Agent invokes a tool that doesn't exist or fabricates arguments.
2. **Scope creep.** Agent expands task beyond the user's ask (creates extra PRs, sends extra emails).
3. **Cascading errors.** One wrong call triggers downstream effects. A phantom SKU hallucination triggers four API calls — a multi-system incident.
4. **Context loss.** Long-horizon tasks forget early-turn constraints.
5. **Tool misuse.** Calls the right tool with wrong arguments, or the wrong tool entirely.

Cascading is the killer. Agents cannot distinguish "I failed" from "the task is impossible" and often hallucinate a success message on 400 errors to close the loop.

### Mitigation: gates at every step

Automated verification gates at every step of a reasoning chain, checking factual grounding against environment state. Concretely:

- Per-step safety classifier (Lesson 21).
- Tool-call argument validation (Lesson 06).
- Cross-check retrieved content against known facts (Lesson 05, CRITIC).
- Detect success hallucination by re-probing state (was the file actually created?).

### Where failure monitoring goes wrong

- **Tagging only crashes.** Most agent failures produce valid-looking output. Need content-level checks.
- **No baseline.** Drift detection needs a last-known-good; without it you cannot say "this is getting worse."
- **Over-alerting.** Every failure produces a page. Cluster and rate-limit.




## Further Reading

- [Cemri et al., MASFT (arXiv:2503.13657)](https://arxiv.org/abs/2503.13657) — 14 failure modes, 3 categories
- [Microsoft, Taxonomy of Failure Mode in Agentic AI Systems](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/final/en-us/microsoft-brand/documents/Taxonomy-of-Failure-Mode-in-Agentic-AI-Systems-Whitepaper.pdf) — risk register
- [Arize Phoenix](https://docs.arize.com/phoenix) — drift clustering in practice
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — when simpler patterns avoid modes entirely
