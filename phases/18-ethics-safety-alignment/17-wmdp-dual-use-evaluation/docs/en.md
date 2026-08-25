# WMDP and Dual-Use Capability Evaluation

> Li et al., "The WMDP Benchmark: Measuring and Reducing Malicious Use With Unlearning" (ICML 2024, arXiv:2403.03218). 4,157 multiple-choice questions across biosecurity (1,520), cybersecurity (2,225), and chemistry (412). Questions operate in the "yellow zone" — proximate enabling knowledge, filtered by multi-expert review and ITAR/EAR legal compliance. Dual purpose: proxy evaluation of dual-use capability, and unlearning benchmark (the companion RMU method reduces WMDP performance while preserving general capability). 2024-2025 field narrative: early OpenAI/Anthropic 2024 evaluations reported "mild uplift" over internet search; by April 2025, OpenAI's Preparedness Framework v2 said models are "on the cusp of meaningfully helping novices create known biological threats." Anthropic's bioweapon-acquisition trial showed 2.53x uplift, insufficient to rule out ASL-3.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 18 · 16 (red-team tooling), Phase 14 (agent engineering)
**Time:** ~60 minutes

## Learning Objectives

- Describe WMDP's three domains, question counts, and "yellow zone" filter criterion.
- Explain RMU and why WMDP is both an evaluation and an unlearning benchmark.
- Describe the 2024-2025 uplift narrative: "mild uplift" -> "on the cusp" -> "insufficient to rule out ASL-3."
- Distinguish novice-relative uplift from expert-absolute capability.

## The Problem

Dual-use capability is the measurement problem under every lab's frontier safety framework (Lesson 18). The question: does model X materially advance a novice's ability to cause mass harm in bio, chem, or cyber? Direct measurement (ask the model to actually produce harm) is illegal and unethical. Proxy measurement needs a benchmark the model cannot refuse (to produce honest capability numbers) but whose questions are not themselves harmful publications.

## The Concept

### The "yellow zone"

Questions that require proximate, enabling knowledge of a harmful process without being a direct synthesis recipe. "What reagent catalyzes step 4 of [published pathway]?" not "how do I make [dangerous compound]?" Each question reviewed by multiple domain experts; filtered for ITAR/EAR export-control compliance.

4,157 questions total:
- Biosecurity: 1,520
- Cybersecurity: 2,225
- Chemistry: 412

Multiple-choice format. Models answer without being asked to assist with anything; capability can be measured without eliciting harmful behaviour.

### RMU — Representation Misdirection for Unlearning

The companion unlearning method. Applied to LLaMa-2-7B, reduced WMDP scores to near-random while preserving MMLU and other general-capability benchmarks within a few percentage points. The published method is the unlearning baseline for every subsequent bio-chem-cyber unlearning paper.

### The 2024-2025 uplift narrative

Three phases:

1. **2024 "mild uplift."** Early OpenAI and Anthropic Preparedness/RSP evaluations reported small advantages over internet search for novices attempting bio-adjacent tasks. Public framing: frontier models help, but not substantially more than Google.

2. **April 2025 "on the cusp."** OpenAI's Preparedness Framework v2 reported models "on the cusp of meaningfully helping novices create known biological threats." Not a capability claim — a warning that the cusp is close.

3. **Anthropic's 2025 bioweapon-acquisition trial.** Controlled study with novice participants, measured relative success at acquisition-phase tasks. Reported 2.53x uplift. Insufficient to rule out ASL-3 (Lesson 18) — the threshold for Anthropic's Responsible Scaling Policy tier 3 is met or approached.

### Novice-relative vs expert-absolute

A crucial distinction:

- **Novice-relative uplift.** How much does the model help a non-expert? Multiplicative. The relative advantage is high because novices know little; even modest information helps.
- **Expert-absolute capability.** How much information does the model produce at maximum effort? An expert can extract more than a novice. The absolute ceiling is high.

Safety cases (Lesson 18) target both: "the model cannot give a novice enough uplift to execute" plus "an expert cannot extract information from the model that is not already published."

### The measurement pitfall

WMDP is a capability proxy, not a deployment measurement. A model that scores high on WMDP may or may not be exploitable by a novice in practice, depending on:
- Elicitation resistance (how hard is it to get the capability out without tripping safety filters)
- Tacit knowledge (capability that requires wet-lab skill, not information)
- Execution barriers (procurement, equipment)

Anthropic's 2025 bioweapon-acquisition trial adds the novice-elicitation layer on top of WMDP-style capability: it measures actual task success, not multiple-choice capability.

### Where this fits in Phase 18

Lessons 12-16 are attack and defense tooling on model outputs. Lesson 17 is the dual-use capability layer — the measurement that frontier safety frameworks (Lesson 18) evaluate. Lesson 30 closes the arc with the current 2026 cyber/bio/chem/nuclear uplift evidence.



## Build It

Reconstruct **WMDP and Dual-Use Capability Evaluation** by following `evaluate` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `evaluate` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-wmdp-eval.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Li et al. — The WMDP Benchmark (arXiv:2403.03218, ICML 2024)](https://arxiv.org/abs/2403.03218) — the benchmark and RMU paper
- [OpenAI — Preparedness Framework v2 (April 15, 2025)](https://openai.com/index/updating-our-preparedness-framework/) — "on the cusp" language
- [Anthropic — Responsible Scaling Policy v3.0 (February 2026)](https://www.anthropic.com/responsible-scaling-policy) — ASL-3 bio threshold and acquisition trial results
- [DeepMind — Frontier Safety Framework v3.0 (September 2025)](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) — bio-uplift CCL

## Exercises

This lab follows `evaluate` and `apply_rmu_style_unlearning` on a controlled fixture; write down the value before changing the input.

1. **Trace the canonical fixture.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `evaluate`, `apply_rmu_style_unlearning`, `baseline_model`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Describe WMDP's three domains, question counts, and "yellow zone" filter criterion.**.
2. **Change the controlled parameter.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Explain RMU and why WMDP is both an evaluation and an unlearning benchmark.** says the other inputs should stay fixed.
3. **Exercise the guard.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Describe the 2024-2025 uplift narrative: "mild uplift" -> "on the cusp" -> "insufficient to rule out ASL-3."** and record the exception text if the code rejects the case.
4. **Prepare the artifact for reuse.** Open `outputs/skill-wmdp-eval.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Distinguish novice-relative uplift from expert-absolute capability.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **WMDP and Dual-Use Capability Evaluation** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `evaluate`, `apply_rmu_style_unlearning`, `baseline_model` traced to the value or shape that supports **Describe WMDP's three domains, question counts, and "yellow zone" filter criterion.**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Explain RMU and why WMDP is both an evaluation and an unlearning benchmark.**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Describe the 2024-2025 uplift narrative: "mild uplift" -> "on the cusp" -> "insufficient to rule out ASL-3."**; and
- an updated `outputs/skill-wmdp-eval.md` example with a concrete input, expected output field, and acceptance check tied to **Distinguish novice-relative uplift from expert-absolute capability.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
