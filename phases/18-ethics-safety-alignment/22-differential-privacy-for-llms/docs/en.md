# Differential Privacy for LLMs

> DP-SGD remains the standard — noise-injected gradient updates provide formal (epsilon, delta) guarantees. Overhead in compute, memory, and utility is substantial; parameter-efficient DP fine-tuning (LoRA + DP-SGD) is the common 2025 configuration (ACM 2025). Two bodies of evidence in tension: canary-based membership inference (Duan et al., 2024) reports limited success against language models; training-data extraction (Carlini et al., 2021; Nasr et al., 2025) recovers substantial verbatim memorization. Resolution (arXiv:2503.06808, March 2025): the gap is in what is measured — inserted canaries vs "most extractable" data. New canary designs enable loss-based MIA without shadow models and yield the first nontrivial DP audit of an LLM trained on real data with realistic DP guarantees. Alternatives: PMixED (arXiv:2403.15638) — private prediction at inference time via mixture of experts on next-token distributions; DP synthetic data generation (Google Research 2024). Emerging attack: Differential Privacy Reversal via LLM Feedback — confidence-score leakage.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 01 · 09 (information theory), Phase 10 · 01 (large-model training)
**Time:** ~60 minutes

## Learning Objectives

- Define (epsilon, delta)-differential privacy and state the DP-SGD recipe.
- Explain the 2024-2025 tension: canary MIA vs training-data extraction give different pictures.
- Describe PMixED and why inference-time private prediction is an alternative to DP training.
- Describe the Differential Privacy Reversal via LLM Feedback attack.

## The Problem

LLMs memorize. Carlini et al. 2021 showed production language models reproduce verbatim training text on demand. DP is the formal defense: train so that the output is provably insensitive to any single training example. The 2024-2025 evidence shows DP-SGD is necessary but the deployed ε values may not match the threat model.

## The Concept

### (ε, δ)-differential privacy

A randomized algorithm M is (ε, δ)-DP if for any two datasets differing in one example and any event S:
P(M(D) in S) <= e^ε * P(M(D') in S) + δ.

Interpretation: the output distribution is close enough (parametrized by ε) that the contribution of any single individual cannot be reliably inferred, except with probability δ.

### DP-SGD

Abadi et al. 2016. The standard recipe:
1. Sample a mini-batch.
2. Compute per-example gradients.
3. Clip each per-example gradient to a threshold C.
4. Sum the clipped gradients and add Gaussian noise with std σ * C.
5. Use the noisy sum to update parameters.

Privacy cost is tracked by an accountant (Moments Accountant, Rényi DP accountant). Reported ε values in the LLM literature vary widely by threat model, data sensitivity, and utility target; there is no universally "safe" default ε. Published examples span roughly ε ≈ 1–10 in some LLM training settings, but these are illustrative — not recommended defaults. Lower ε generally requires more noise and can increase utility loss.

### LoRA + DP-SGD

Full DP-SGD of a frontier model is prohibitive. LoRA (Hu et al. 2022) limits gradient updates to a small adapter, reducing per-example gradient storage. LoRA + DP-SGD is the common 2025 configuration. DP guarantees apply to the adapter; the base model is held fixed.

### The 2024-2025 tension

Two lines of evidence:

- **Canary MIA (Duan et al. 2024).** Insert unique canaries into training data, measure whether a membership-inference attacker can identify them. Reports limited success on language models. Suggests MIA is hard.
- **Training-data extraction (Carlini 2021, Nasr et al. 2025).** Prompt the model with a prefix; measure whether it recovers verbatim text from training. Reports substantial memorization. Suggests MIA is easy in the relevant sense.

March 2025 resolution (arXiv:2503.06808): the two measure different things. MIA asks "is example e in D?" on inserted canaries. Extraction asks "what can I recover of D?" The "most extractable" example is what matters for privacy; canaries under-report this because they are not optimized to be extractable.

New canary designs. Loss-based MIA without shadow models. First nontrivial DP audit of an LLM on real data with realistic DP guarantees.

### Alternatives to DP training

- **PMixED (arXiv:2403.15638).** Private prediction at inference time. Mixture of experts on next-token distributions; each expert sees a shard of training data; aggregation adds noise for DP. Avoids DP training entirely.
- **DP synthetic data generation (Google Research 2024).** LoRA-fine-tune with DP-SGD, sample synthetic data, train a downstream classifier on the synthetic data.

Both sidestep the utility cost of full DP training at the cost of a different threat model.

### Differential Privacy Reversal via LLM Feedback

Emerging 2025 attack. Use a DP-trained model's confidence scores as an oracle to re-identify individuals. Even when outputs do not leak, confidence distributions can.

The defense: do not expose confidences, or truncate/quantize them before exposure. This is an additional requirement beyond (ε, δ)-DP training.

### Where this fits in Phase 18

Lessons 20-21 are bias/fairness. Lesson 22 is privacy. Lesson 23 is provenance via watermarking. Lesson 27 covers the regulatory data-provenance layer.



## Build It

Reconstruct **Differential Privacy for LLMs** by following `sigmoid` on x=0.5 with the demo defaults. Run `python3 main.py` and verify that the update or loss change agrees with the gradient sign; a zero gradient produces no accidental jump.

## Use It

Call `sigmoid` from a small caller with x=0.5 with the demo defaults. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-dp-audit.md` with the command `python3 main.py`, the accepted input shape (x=0.5 with the demo defaults), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Abadi et al. — DP-SGD (arXiv:1607.00133)](https://arxiv.org/abs/1607.00133) — the standard DP training algorithm
- [Carlini et al. — Extracting Training Data (arXiv:2012.07805)](https://arxiv.org/abs/2012.07805) — the canonical extraction paper
- [Duan et al. — Canary MIA on LLMs (arXiv:2402.07841, 2024)](https://arxiv.org/abs/2402.07841) — limited-success MIA
- [Kowalczyk et al. — Auditing DP for LLMs (arXiv:2503.06808, March 2025)](https://arxiv.org/abs/2503.06808) — resolution of the tension
- [PMixED (arXiv:2403.15638)](https://arxiv.org/abs/2403.15638) — inference-time private prediction

## Exercises

Keep two runs side by side for **Differential Privacy for LLMs**. The important evidence is the named field, shape, or status—not a polished paragraph about the run.

1. **Read the first result.** From `code/`, run `python3 main.py` using x=0.5 with the demo defaults. Follow `sigmoid`, `gen`, `clip`. Expect the update or loss change agrees with the gradient sign; a zero gradient produces no accidental jump; capture the first printed shape, metric, status, or summary field and state which part supports **Define (epsilon, delta)-differential privacy and state the DP-SGD recipe.**.
2. **Run a two-value comparison.** Repeat the command after changing only the learning rate: use the same run with learning rate 0.1 instead of 0.01. Predict the direction of the change, then compare the two output values. Explain why **Explain the 2024-2025 tension: canary MIA vs training-data extraction give different pictures.** says the other inputs should stay fixed.
3. **Try an adversarial fixture.** Feed the implementation a zero gradient or an already-minimized point. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Describe PMixED and why inference-time private prediction is an alternative to DP training.** and record the exception text if the code rejects the case.
4. **Write the operator note.** Open `outputs/skill-dp-audit.md` and add a worked example using x=0.5 with the demo defaults. Include the input contract, one expected output field, and a named acceptance check for **Describe the Differential Privacy Reversal via LLM Feedback attack.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Differential Privacy for LLMs** should contain:

- the `python3 main.py` output for x=0.5 with the demo defaults, with `sigmoid`, `gen`, `clip` traced to the value or shape that supports **Define (epsilon, delta)-differential privacy and state the DP-SGD recipe.**;
- a before/after comparison for the learning rate, where the same run with learning rate 0.1 instead of 0.01 changes the observation in the direction predicted by **Explain the 2024-2025 tension: canary MIA vs training-data extraction give different pictures.**;
- a recorded result for a zero gradient or an already-minimized point that matches the implementation’s validation or empty-result contract and explains the evidence for **Describe PMixED and why inference-time private prediction is an alternative to DP training.**; and
- an updated `outputs/skill-dp-audit.md` example with a concrete input, expected output field, and acceptance check tied to **Describe the Differential Privacy Reversal via LLM Feedback attack.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
