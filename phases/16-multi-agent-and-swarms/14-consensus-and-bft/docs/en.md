# Consensus and Byzantine Fault Tolerance for Agents

> Classical distributed-systems BFT meets stochastic LLMs. In 2025-2026 three research directions emerged: **CP-WBFT** (arXiv:2511.10400) weighs each vote by a confidence probe; **DecentLLMs** (arXiv:2507.14928) goes leaderless with parallel worker proposals and geometric-median aggregation; **WBFT** (arXiv:2505.05103) combines weighted voting with Hierarchical Structure Clustering to split Core and Edge nodes. The honest empirical result from "Can AI Agents Agree?" (arXiv:2603.01213) is that even scalar agreement is fragile today — a single deceptive agent can compromise a Mixture-of-Agents. BFT is necessary but not sufficient. This lesson builds a minimal BFT protocol, injects three agent-specific attacks (byzantine lie, sycophantic conformity, correlated-error monoculture), and measures how each consensus variant copes.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 16 · 07 (Society of Mind and Debate), Phase 16 · 13 (Shared Memory)
**Time:** ~75 minutes

## Learning Objectives

- Explain the coordination mechanism behind Consensus and Byzantine Fault Tolerance for Agents
- Implement the central multi-agent interaction from first principles
- Trace messages, shared state, and verification decisions end to end
- Evaluate coordination quality, cost, and correlated failure modes

## Problem

You have N LLM agents each producing an answer. They disagree. Majority vote picks the wrong one because two agents are correlated (same base model, same training data, same failure modes). A third agent happens to be wrong in a novel way — so the majority is a false majority.

Now add a deceptive agent: it lies on purpose. Or a sycophantic agent: it agrees with whoever spoke last. In classical BFT, the assumption is that Byzantine nodes are a fraction `f < n/3` and behave arbitrarily. The 2026 reality is that LLM nodes are stochastic even when honest, correlated across models, and influenced by each other's outputs. You cannot treat them as independent Bernoulli voters.

Classical BFT (PBFT, 1999) is not wrong — it is incomplete. It handles arbitrary bit-flipping. It does not handle "three honest agents share a hallucination because they share training data." This lesson builds from PBFT's foundation and layers on three 2025-2026 adaptations.

## Concept

### What classical BFT gives you

Practical Byzantine Fault Tolerance (Castro & Liskov, OSDI 1999) tolerates `f < n/3` Byzantine nodes. The protocol has three phases (pre-prepare, prepare, commit) and two primitives (signed messages, quorum certificates). Agreement on a single value among `n >= 3f + 1` honest-or-malicious nodes.

The guarantees are strong but assume:

1. **Independent faults.** Byzantines do not coordinate.
2. **Honest nodes are truly honest.** Correctness of honest outputs is a non-issue; the protocol only aligns disagreement.
3. **The question has a ground-truth answer.** Consensus on a wrong fact is still consensus.

LLM agents violate all three. Two agents running the same base model share faults. An "honest" LLM still hallucinates. And on ambiguous questions, the "truth" is what the agents decide — there is no external oracle.

### The three LLM-specific attacks

**Byzantine lie.** One agent outputs a deliberately wrong answer. Classical BFT handles this if `f < n/3`.

**Sycophantic conformity.** One agent reads others' answers before voting and aligns with whoever spoke last. Not malicious, but correlates with the loudest voice. Classical BFT does not prevent this because the agent passes every signature check.

**Correlated-error monoculture.** Three agents share a base model. They hallucinate the same wrong answer. The majority is wrong. Classical BFT does not help because all three "honestly" agree.

### The 2025-2026 responses

**[CP-WBFT](https://arxiv.org/abs/2511.10400)** — Confidence-Probed Weighted BFT. Each voter attaches a confidence probe to its answer; vote weights scale with confidence. The paper reports an 85.71% improvement in its complete-graph BFT evaluation. Treat confidence calibration and graph topology as part of the claim.

**DecentLLMs** (arXiv:2507.14928) — Leaderless. Worker agents propose in parallel, evaluator agents score proposals, final answer is the geometric median of scored positions. Robust when `f < n/2`. Mitigation for: Byzantine lie and correlated errors (geometric median is robust to outliers and pulls toward the dense cluster, not the model-biased average).

**WBFT** (arXiv:2505.05103) — Weighted BFT with Hierarchical Structure Clustering. Vote weights are assigned by response quality plus a trust score learned from history. Cluster agents into Core and Edge; Core agents must achieve consensus first, Edge agents follow. Mitigation for: scalability (Core consensus is small and fast) and partially for monoculture (Core can be chosen for diversity).

### Empirical: "Can AI Agents Agree?" (arXiv:2603.01213)

The paper measures scalar agreement (LLM agents agreeing on a single numeric value) across multiple frontier models. The finding is uncomfortable:

- Even with no adversaries, LLM agents disagree on scalar questions at rates above 30% on many benchmarks.
- A single agent that adopts a deceptive persona can pull the Mixture-of-Agents consensus 40+ percentage points off the honest baseline.
- Disagreement rates correlate with model diversity — heterogeneous ensembles disagree more than homogeneous ones (good: uncorrelated errors) but also drift more slowly (bad: longer time-to-agreement).

The takeaway: BFT gives you machinery to align outputs, but it does not tell you whether the aligned output is right. Combine with verification (Phase 16 · 08 role specialization), diversity (Phase 16 · 15 debate variants), and evaluator agents (Phase 16 · 24 benchmarks).

### The core protocol, stripped down

A minimal BFT round for LLM agents:

```
1. task arrives; each agent i produces answer a_i
2. each agent attaches confidence probe c_i in [0, 1]
3. aggregator collects (a_i, c_i) from all n agents
4. aggregator groups by semantic cluster (equivalent answers)
5. aggregator computes weight for each cluster C:
     w(C) = sum_{i in C} c_i
6. winner = cluster with max weight, if max > threshold * sum(c_i)
   else: retry or escalate
7. minority clusters logged with provenance for post-hoc audit
```

**Worked example (hypothetical).** The answers "the study reports 4.2%" and "4.2% improvement" belong to the same semantic cluster. A naive string-equality check would miss this. In production, use a cheap embedding model or explicit canonicalization.

### Threshold tuning

The `threshold` parameter decides when to accept and when to retry. Too low: you accept weak majorities. Too high: you never accept anything. Empirical range: 0.5-0.67 for `n=5-7` agents, higher for smaller `n`. Below a threshold, escalate to a human or to a different agent ensemble.

### Where consensus does not help

- **Ambiguous questions.** If the question has no ground truth, consensus is an opinion. Call it that.
- **Compound questions.** "Write code and explain it" — two answers. Vote on each independently.
- **Adversarial multi-round.** If agents can observe prior rounds and mimic (Du 2023 debate), they start agreeing with each other regardless of truth. Bound the rounds (2-3 typically).




## Build It

Reconstruct **Consensus and Byzantine Fault Tolerance for Agents** by following `Vote` on the smallest valid record {"id": 1}. Run `python3 main.py` and verify that validation names the missing field or rejects the request; it must not silently accept an incomplete record.

## Use It

Call `Vote` from a small caller with the smallest valid record {"id": 1}. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-consensus-designer.md` with the command `python3 main.py`, the accepted input shape (the smallest valid record {"id": 1}), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Castro & Liskov — Practical Byzantine Fault Tolerance (OSDI 1999)](https://pmg.csail.mit.edu/papers/osdi99.pdf) — the foundation
- [CP-WBFT — Confidence-Probe Weighted BFT](https://arxiv.org/abs/2511.10400) — vote weighting by confidence
- [DecentLLMs — leaderless multi-agent consensus](https://arxiv.org/abs/2507.14928) — geometric-median aggregation
- [WBFT — Weighted BFT with Hierarchical Structure Clustering](https://arxiv.org/abs/2505.05103) — Core/Edge split for bounded latency
- [Can AI Agents Agree?](https://arxiv.org/abs/2603.01213) — scalar-agreement fragility and deceptive-persona attack

## Exercises

Work from the smallest fixture that the Consensus and Byzantine Fault Tolerance for Agents demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using the smallest valid record {"id": 1}. Follow `Vote`, `canonical`, `plurality`. Expect validation names the missing field or rejects the request; it must not silently accept an incomplete record; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the coordination mechanism behind Consensus and Byzantine Fault Tolerance for Agents**.
2. **Perturb one field.** Repeat the command after changing only the optional field: use the same record with one optional field changed. Predict the direction of the change, then compare the two output values. Explain why **Implement the central multi-agent interaction from first principles** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation a record missing the required "id" field. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Trace messages, shared state, and verification decisions end to end** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-consensus-designer.md` and add a worked example using the smallest valid record {"id": 1}. Include the input contract, one expected output field, and a named acceptance check for **Evaluate coordination quality, cost, and correlated failure modes**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Consensus and Byzantine Fault Tolerance for Agents** should contain:

- the `python3 main.py` output for the smallest valid record {"id": 1}, with `Vote`, `canonical`, `plurality` traced to the value or shape that supports **Explain the coordination mechanism behind Consensus and Byzantine Fault Tolerance for Agents**;
- a before/after comparison for the optional field, where the same record with one optional field changed changes the observation in the direction predicted by **Implement the central multi-agent interaction from first principles**;
- a recorded result for a record missing the required "id" field that matches the implementation’s validation or empty-result contract and explains the evidence for **Trace messages, shared state, and verification decisions end to end**; and
- an updated `outputs/skill-consensus-designer.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate coordination quality, cost, and correlated failure modes**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
