# Society of Mind and Multi-Agent Debate

> Minsky's 1986 premise — intelligence is a society of specialists — gets rediscovered every decade. In 2023 Du et al. turned it into a concrete algorithm: multiple LLM instances propose answers, read each other's answers, critique, and update. Over N rounds they converge on a consensus that beats zero-shot CoT and reflection on six reasoning and factuality tasks. Two findings matter: both **multiple agents** and **multiple rounds** contribute independently. The society beats a single-agent monologue; the multi-round exchange beats one-shot voting.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

## Learning Objectives

- Explain the coordination mechanism behind Society of Mind and Multi-Agent Debate
- Implement the central multi-agent interaction from first principles
- Trace messages, shared state, and verification decisions end to end
- Evaluate coordination quality, cost, and correlated failure modes

## Problem

Self-consistency — sample one model many times and take the majority answer — is the cheapest reasoning improvement you can bolt on. It works, but it saturates fast. You can double your samples and not see another meaningful jump.

Debate breaks the saturation. Instead of N independent samples from one model, N agents read each other's reasoning and revise. The correlation between samples drops (they are no longer i.i.d.), and the convergence point is often correct where i.i.d. voting was confidently wrong.

## Concept

### The Du et al. 2023 algorithm

From arXiv:2305.14325 (ICML 2024):

1. Each of N agents produces an initial answer to the question.
2. For round r = 2..R: each agent is shown the other agents' round r-1 answers and asked "considering these, give your updated answer."
3. After R rounds, majority-vote the final answers.

The paper tests on MMLU, GSM8K, biographies, MATH, and factuality benchmarks. Debate consistently beats CoT and Self-Reflection.

### Two independent knobs

Ablations from the same paper:

- **Agent count alone** (1 round, majority vote of N) beats single-agent on most tasks, but plateaus.
- **Round count alone** (1 agent seeing its own prior reasoning) barely helps — reflection's known weakness.
- **Both together** produces the big jumps. The multi-round exchange between multiple agents drives the gain.

### Why it works

Two mechanisms:

1. **Exposure to disagreement.** When an agent sees another agent's reasoning chain with a different conclusion, it has to either justify or update. Either way, the context for round r+1 is richer than round r.
2. **Correlated error reduction.** In self-consistency, all samples come from the same model, so the errors correlate — you average into a confidently wrong answer. Different models or different seeds decorrelate. Different *debated views* decorrelate further.

### Heterogeneous debate

A-HMAD and related follow-ups use *different base models* for different agents. Llama + Claude + GPT debating reduces monoculture collapse (Lesson 26) because the correlated errors of one model family are not shared by the others.

Downside: a weak model participating in a debate can drag the consensus toward its wrong answer (see "Should we be going MAD?", arXiv:2311.17371).

### NLSOM — the 129-agent extension

Zhuge et al. ("Mindstorms in Natural Language-Based Societies of Mind," arXiv:2305.17066) scaled this idea to 129-member societies. The result: specialization and self-organization emerge with scale, and the system outperforms single-agent on tasks like visual question answering.

### Failure modes

- **Sycophancy cascade.** All agents defer to whichever agent sounds most confident. The debate collapses to the loudest voice. Prompting for adversarial roles ("one agent must argue the counter-position") helps.
- **Topic drift.** Debates over many rounds drift from the original question. Mitigation: re-inject the question every round.
- **Compute blowup.** N agents × R rounds = N·R LLM calls, each with a context that grows. A 5-agent, 5-round debate is 25 calls at growing context. Cost per question can exceed 10× a single CoT call.




## Further Reading

- [Du et al. — Improving Factuality and Reasoning in Language Models through Multiagent Debate](https://arxiv.org/abs/2305.14325) — the reference paper, ICML 2024
- [Zhuge et al. — Mindstorms in Natural Language-Based Societies of Mind](https://arxiv.org/abs/2305.17066) — 129-agent NLSOM
- [Should we be going MAD? A Look at Multi-Agent Debate Strategies for LLMs](https://arxiv.org/abs/2311.17371) — benchmarks debate variants
- [Debate project page](https://composable-models.github.io/llm_debate/) — Du et al.'s code, demos, and ablation details
