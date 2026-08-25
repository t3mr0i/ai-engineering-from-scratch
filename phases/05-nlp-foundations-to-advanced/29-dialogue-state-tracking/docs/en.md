# Dialogue State Tracking

> "I want a cheap restaurant in the north... actually make it moderate... and add Italian." Three turns, three state updates. DST keeps the slot-value dict in sync so the booking works.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 17 (Chatbots), Phase 5 · 20 (Structured Outputs)
**Time:** ~75 minutes

## Learning Objectives

- Explain the core mechanism in Dialogue State Tracking and place it in an NLP pipeline
- Implement the central transformation behind Dialogue State Tracking from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Dialogue State Tracking

## The Problem

In a task-oriented dialogue system, the user's goal is encoded as a set of slot-value pairs: `{cuisine: italian, area: north, price: moderate}`. Every user turn can add, change, or remove a slot. The system must read the whole conversation and output the current state correctly.

Get a single slot wrong and the system books the wrong restaurant, schedules the wrong flight, or charges the wrong card. DST is the hinge between what the user said and what the backend executes.

Why it still matters in 2026 despite LLMs:

- Compliance-sensitive domains (banking, healthcare, airline booking) require deterministic slot values, not free-form generation.
- Tool-use agents still need slot resolution before calling APIs.
- Multi-turn correction is harder than it looks: "actually no, make it Thursday."

The modern pipeline: classical DST concepts + LLM extractors + structured-output guardrails.

## The Concept

![DST: dialog history → slot-value state](../assets/dst.svg)

**Task structure.** A schema defines domains (restaurant, hotel, taxi) and their slots (cuisine, area, price, people). Each slot can be empty, filled with a value from a closed set (price: {cheap, moderate, expensive}), or a free-form value (name: "The Copper Kettle").

**Two DST formulations.**

- **Classification.** For each (slot, candidate_value) pair, predict yes/no. Works for closed-vocab slots. Standard pre-2020.
- **Generation.** Given the dialogue, generate slot values as free text. Works for open-vocab slots. The modern default.

**Metric.** Joint Goal Accuracy (JGA) — the fraction of turns where *every* slot is correct. All-or-nothing. MultiWOZ 2.4 leaderboard tops around 83% in 2026.

**Architectures.**

1. **Rule-based (slot regex + keyword).** Strong baseline for narrow domains. Debuggable.
2. **TripPy / BERT-DST.** Copy-based generation with BERT encoding. Pre-LLM standard.
3. **LDST (LLaMA + LoRA).** Instruction-tuned LLM with domain-slot prompting. Reaches ChatGPT-level quality on MultiWOZ 2.4.
4. **Ontology-free (2024–26).** Skip the schema; generate slot names and values directly. Handles open domains.
5. **Prompt + structured output (2024–26).** LLM with Pydantic schema + constrained decoding. 5 lines of code, production-ready.

### The classic failure modes

- **Co-reference across turns.** "Let's stay with the first option." Needs to resolve which option.
- **Over-write vs append.** User says "add Italian." Do you replace cuisine or append?
- **Implicit confirmations.** "OK cool" — did that accept the offered booking?
- **Correction.** "Actually make it 7 pm." Must update time without clearing other slots.
- **Coreference to previous system utterance.** "Yes, that one." Which "that"?




## Build It

Reconstruct **Dialogue State Tracking** by following `extract_cuisine` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `extract_cuisine` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-dst-designer.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Budzianowski et al. (2018). MultiWOZ — A Large-Scale Multi-Domain Wizard-of-Oz](https://arxiv.org/abs/1810.00278) — the canonical benchmark.
- [Feng et al. (2023). Towards LLM-driven Dialogue State Tracking (LDST)](https://arxiv.org/abs/2310.14970) — LLaMA + LoRA instruction tuning for DST.
- [Heck et al. (2020). TripPy — A Triple Copy Strategy for Value Independent Neural Dialog State Tracking](https://arxiv.org/abs/2005.02877) — the copy-based DST workhorse.
- [King, Flanigan (2024). Unsupervised End-to-End Task-Oriented Dialogue with LLMs](https://arxiv.org/abs/2404.10753) — EM-based unsupervised TOD.
- [MultiWOZ leaderboard](https://github.com/budzianowski/multiwoz) — canonical DST results.

## Exercises

Keep two runs side by side for **Dialogue State Tracking**. The important evidence is the named field, shape, or status—not a polished paragraph about the run.

1. **Read the first result.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `extract_cuisine`, `extract_area`, `extract_price`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the core mechanism in Dialogue State Tracking and place it in an NLP pipeline**.
2. **Run a two-value comparison.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Implement the central transformation behind Dialogue State Tracking from first principles** says the other inputs should stay fixed.
3. **Try an adversarial fixture.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Inspect intermediate representations to connect the algorithm to its output** and record the exception text if the code rejects the case.
4. **Write the operator note.** Open `outputs/skill-dst-designer.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Evaluate failure cases and choose appropriate metrics for Dialogue State Tracking**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Dialogue State Tracking** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `extract_cuisine`, `extract_area`, `extract_price` traced to the value or shape that supports **Explain the core mechanism in Dialogue State Tracking and place it in an NLP pipeline**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Implement the central transformation behind Dialogue State Tracking from first principles**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Inspect intermediate representations to connect the algorithm to its output**; and
- an updated `outputs/skill-dst-designer.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate failure cases and choose appropriate metrics for Dialogue State Tracking**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
