# Dialogue State Tracking

> "I want a cheap restaurant in the north... actually make it moderate... and add Italian." Three turns, three state updates. DST keeps the slot-value dict in sync so the booking works.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 17 (Chatbots), Phase 5 · 20 (Structured Outputs)
**Time:** ~75 minutes

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




## Further Reading

- [Budzianowski et al. (2018). MultiWOZ — A Large-Scale Multi-Domain Wizard-of-Oz](https://arxiv.org/abs/1810.00278) — the canonical benchmark.
- [Feng et al. (2023). Towards LLM-driven Dialogue State Tracking (LDST)](https://arxiv.org/abs/2310.14970) — LLaMA + LoRA instruction tuning for DST.
- [Heck et al. (2020). TripPy — A Triple Copy Strategy for Value Independent Neural Dialog State Tracking](https://arxiv.org/abs/2005.02877) — the copy-based DST workhorse.
- [King, Flanigan (2024). Unsupervised End-to-End Task-Oriented Dialogue with LLMs](https://arxiv.org/abs/2404.10753) — EM-based unsupervised TOD.
- [MultiWOZ leaderboard](https://github.com/budzianowski/multiwoz) — canonical DST results.
