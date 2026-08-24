# Constitutional AI and Rule Overrides

> Anthropic's January 22, 2026 Claude Constitution runs 79 pages and is CC0. It moves from rule-based to reason-based alignment and establishes a four-tier priority hierarchy: (1) safety and supporting human oversight, (2) ethics, (3) Anthropic guidelines, (4) helpfulness. Behaviours split into hardcoded prohibitions (bioweapons uplift, CSAM) that operators and users cannot override and soft-coded defaults that operators can adjust within defined bounds. The 2022 original (Bai et al.) trained harmlessness via self-critique and RLAIF against a constitution. The honest caveat: reason-based alignment relies on the model generalising principles to unanticipated situations. Anthropic's own 2023 participatory experiment showed ~50% divergence between public-sourced and corporate principles; the 2026 version did not incorporate those findings.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 15 · 06 (Automated alignment research), Phase 15 · 10 (Permission modes)
**Time:** ~60 minutes

## Learning Objectives

- Explain the autonomy mechanism and assumptions behind Constitutional AI and Rule Overrides
- Model its control loop, state transitions, and stopping conditions explicitly
- Apply bounded permissions, budgets, and rollback controls
- Evaluate capability and safety claims against reproducible evidence

## The Problem

A fielded agent sees inputs that its designers never saw. No rule list is long enough to cover them. No rule list is short enough to apply quickly under compute pressure. The practical question: how do you align an agent to principles that survive both a long tail of cases and fast inference?

Rule-based alignment (RBA): list every disallowed thing. Fast to check, easy to audit, impossible to keep current, often over-refuses on close analogs it didn't anticipate. Reason-based alignment (the 2026 Claude Constitution): encode principles, let the model reason. Scales across unseen cases, harder to audit, failure mode is principle-misapplication rather than miss-the-rule.

The 2026 Constitution takes an explicit middle position. Hardcoded prohibitions — things whose wrongness does not depend on context (bioweapons uplift, CSAM) — are RBA: never, regardless of operator or user instruction. Everything else is reason-based within a four-tier hierarchy: safety and supporting human oversight first; ethics second; Anthropic-declared guidelines third; helpfulness last. Operators can adjust defaults within the soft-coded zone but cannot touch the hardcoded prohibitions.

## The Concept

### The four-tier priority hierarchy

1. **Safety and supporting human oversight.** Highest. The model prioritises not undermining the ability of humans and Anthropic to supervise and correct AI. This is not "be cautious"; it is specifically "do not act in ways that make human oversight harder."
2. **Ethics.** Honesty, avoiding harm to persons, not deceiving, not manipulating. Supersedes Anthropic's guidelines when they conflict.
3. **Anthropic guidelines.** Operational norms Anthropic has decided matter: product scope, interaction patterns, what tools to use when.
4. **Helpfulness.** Lowest. Be as useful as possible within the higher priorities.

When tiers conflict, higher wins. This is the same shape as Unix priorities or network QoS — the framing is meant to produce predictable resolution, not necessarily best-case behaviour on any single axis.

### Hardcoded prohibitions vs soft-coded defaults

**Hardcoded:**
- Bioweapons / CBRN uplift
- CSAM
- Attacks on critical infrastructure
- Deception of users about the model's identity when asked directly

The operator cannot override these. The user cannot override these. They are enforced at the model-weights level where possible (RLHF / Constitutional AI training) and at the inference layer where not.

**Soft-coded defaults (operator-adjustable):**
- Response length defaults
- Topical scope (the model can refuse topics outside the operator's deployment)
- Style (formal vs casual)
- Tool-use patterns

Operator adjustments happen inside a declared bound. The operator cannot remove the hardcoded prohibitions by renaming them.

### The 2022 CAI training

The original Constitutional AI (Bai et al., 2022) trained harmlessness:

1. Generate responses to a set of prompts.
2. Ask the model to critique each response against a constitution (explicit principles).
3. Revise the response based on the critique.
4. RLAIF (reinforcement learning from AI feedback) on the revised pairs.

Result: a model that refuses harmful requests with principled explanations, not blanket refusals. The 2026 Constitution uses a descendant of this training plus additional post-training on the explicit tier hierarchy.

### What reason-based alignment catches and misses

**Catches:**
- Unanticipated combinations of allowed primitives where the principle applies clearly.
- Novel requests that are close analogs of prohibited ones.
- Social-engineering attacks that rely on "you didn't say X was disallowed."

**Misses:**
- Attacks that exploit principle ambiguity ("the user asked for this so helpfulness says yes").
- Scenarios where two principles conflict in an unanticipated way, and the tier order is ambiguous.
- Slow drift in principle interpretation over training cycles (reinterpretation).

### The 2023 participatory experiment

Anthropic ran a 2023 experiment comparing a corporate-authored constitution to one generated via public input (~1,000 US respondents). The two versions agreed on ~50% of principles. Where they diverged, the public-sourced version was more restrictive on some issues (political-content handling) and less restrictive on others (self-disclosure of AI identity). The 2026 Constitution did not incorporate the public-sourced findings. This is a documented tension in the approach.

### Why hardcoded prohibitions are necessary

Reason-based alignment alone cannot close the tail. An attacker who can get the model to accept a premise (e.g., "we are a licensed bioweapons research lab") can often talk past principles that depend on case reasoning. Hardcoded prohibitions do not bend to premise framing. They are the Lesson 14 "hard constitutional limit" at the alignment layer.

### Where the Constitution sits in the stack

The Constitution is not Lesson 14's kill switch. It lives at the model layer: what the model's weights are trained to prefer. Kill switches and canary tokens live at the runtime layer: what the runtime permits. Both are required. A runtime that fires all the wrong actions because the model weights are permissive is a runtime problem. A model that refuses all the right actions because the runtime is over-restrictive is a runtime problem. Layers cover different classes.



## Further Reading

- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) — the 79-page CC0 document.
- [Bai et al. — Constitutional AI: Harmlessness from AI Feedback](https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback) — 2022 original.
- [Anthropic — Collective Constitutional AI (2023)](https://www.anthropic.com/research/collective-constitutional-ai-aligning-a-language-model-with-public-input) — participatory experiment.
- [Anthropic — Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) — where the Constitution sits in the RSP stack.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — Constitution's role in long-horizon deployments.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the autonomy mechanism and assumptions behind Constitutional AI and Rule Overrides.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Model its control loop, state transitions, and stopping conditions explicitly.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Apply bounded permissions, budgets, and rollback controls.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the autonomy mechanism and assumptions behind Constitutional AI and Rule Overrides,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Apply bounded permissions, budgets, and rollback controls,” and cite a repeatable check rather than relying on visual inspection alone.
