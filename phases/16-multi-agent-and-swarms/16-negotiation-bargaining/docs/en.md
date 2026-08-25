# Negotiation and Bargaining

> Agents negotiate resources, prices, task allocations, and terms. [NegotiationArena](https://arxiv.org/abs/2402.05863) studies persona effects on payoffs; [Measuring Bargaining Abilities](https://arxiv.org/abs/2402.15813) reports its OG-Narrator decomposition moving deal rate from 26.67% to 88.88%; the [Large-Scale Autonomous Negotiation Competition](https://arxiv.org/abs/2503.06416) analyzes roughly 180,000 negotiations. This lesson implements the underlying decomposition and measures it locally instead of treating benchmark rankings as universal agent traits.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 16 · 02 (FIPA-ACL Heritage), Phase 16 · 09 (Parallel Swarm Networks)
**Time:** ~75 minutes

## Learning Objectives

- Explain the coordination mechanism behind Negotiation and Bargaining
- Implement the central multi-agent interaction from first principles
- Trace messages, shared state, and verification decisions end to end
- Evaluate coordination quality, cost, and correlated failure modes

## Problem

Two agents need to agree on a price. Left to themselves with pure language prompts, 2024-2026 LLMs close deals at surprisingly low rates (~27% on tightly-parameterized bargains in arXiv:2402.15813). Scale does not fix it: GPT-4 is not structurally better at bargaining than GPT-3.5; it is better at the *language* of bargaining.

The root issue is that LLMs conflate two jobs — deciding the offer and narrating the offer. OG-Narrator separated these: a deterministic offer generator computes numeric moves; the LLM only narrates. Deal rate jumps to ~89%.

This mirrors a classical multi-agent finding: decoupling the mechanism from the communication layer wins. Contract Net Protocol (FIPA, 1996; Smith, 1980) is the reference task-market mechanism. Plug an LLM into the narration slot and you get a modern LLM-powered task market.

## Concept

### Contract Net, in one paragraph

Smith's 1980 Contract Net Protocol: a **manager** broadcasts a **call for proposals (cfp)**; **bidders** respond with **propose** messages containing their offers; the manager picks a winner and sends **accept-proposal** to the winner and **reject-proposal** to the losers. The winner performs the work. Optional message: **refuse** (bidder declines to propose). FIPA codified this as `fipa-contract-net` interaction protocol.

### Why OG-Narrator wins

"Measuring Bargaining Abilities of Language Models" (arXiv:2402.15813) observed that:

- LLMs often break the bargaining rules (offer at nonsensical prices, ignore the other side's ZOPA).
- They anchor poorly (accept bad first offers; counter-offer at symbolic rather than strategic amounts).
- Scale alone does not fix these. Larger models make more-plausible language with similar strategic error.

The OG-Narrator decomposition:

```
           ┌──────────────────┐        ┌──────────────────┐
  state  → │ offer generator  │ price → │  LLM narrator    │ → message
           │  (deterministic) │        │  (writes the     │
           │                  │        │   human-style    │
           └──────────────────┘        │   accompaniment) │
                                       └──────────────────┘
```

The offer generator is a classical negotiation strategy: a Rubinstein bargaining model, a Zeuthen strategy, or a simple tit-for-tat over price. The LLM narrates. The message contains the deterministic price and the natural-language framing.

Deal rate jumps because:
- Prices stay in the bargaining zone.
- Anchors are strategic, not emotional.
- The LLM does what it is good at: writing.

### NegotiationArena findings

arXiv:2402.05863 provides the canonical benchmark. Headline findings:

- LLMs can improve payoffs ~20% by adopting personas ("I am desperate to sell this by Friday") — persona manipulation is a real tactic.
- Fair/cooperative agents are exploited by adversarial ones; defense requires explicit counter-posturing.
- Symmetric pair-ups converge to inequitable outcomes on about 40% of the benchmark scenarios.

This is not "LLMs are bad negotiators." It is "LLMs negotiate too much like humans, including the exploitable parts."

### Chain-of-thought concealment

The Large-Scale Autonomous Negotiation Competition (arXiv:2503.06416) ran ~180k negotiations across many LLM strategies. Winners concealed their reasoning from counterparts:

- If an agent prints "I will only go to $75; my reservation price is $70" into a publicly visible scratchpad, the opponent reads it.
- Winners compute strategy privately; the output channel contains only the offer and minimum required narration.

This is a 2026 echo of classical game theory (Aumann 1976 on rationality and information): revealing your private valuation costs payoff. LLMs do not intuit this and happily type their reservations in reasoning traces that become visible to the counterpart.

Engineering takeaway: separate private-scratchpad context from public-message context. Not optional.

### Bhattacharya et al. 2025 — model rankings

On Harvard Negotiation Project metrics (principled negotiation, BATNA respect, interest reciprocity):

- **Llama-3** was most-effective at striking bargains (deal rate + payoff).
- **Claude-3** was the most-aggressive negotiator (high anchors, late concessions).
- **GPT-4** was the fairest (smallest variance in payoff across pairings).

This is a 2025 snapshot. The point is not which model wins in April 2026 — it is that different base models have persistent negotiation styles. Heterogeneous ensembles (Lesson 15) include this as a diversity source.

### Task allocation via Contract Net + LLM

The modern re-use of Contract Net for LLM multi-agent:

1. Manager agent decomposes a task into units.
2. Broadcasts `cfp` with task description to worker agents.
3. Each worker returns an offer: `(price, eta, confidence)` where price could be tokens, compute units, or dollars.
4. Manager picks winners (single or multiple, depending on task) and awards.
5. Rejected workers are free to bid on other tasks.

This scales well past 100 workers because coordination is broadcast-and-respond, not synchronous chat. Used in production: Microsoft Agent Framework's orchestration patterns, some LangGraph implementations.

### LLM-Stakeholders Interactive Negotiation

NeurIPS 2024 (https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf) introduces multi-party scorable games with **secret scores** and **minimum-acceptance thresholds**. Each stakeholder has private utilities; the LLM must infer them from messages. This is the generalization of two-party bargaining to N-party coalition formation. Relevant for production task markets with heterogeneous worker capabilities.

### The narration-vs-mechanism rule

Across all 2024-2026 negotiation benchmarks, the consistent engineering rule is:

> Let the LLM narrate. Do not let the LLM compute the offer.

If the offer needs to be a number (price, ETA, quantity), generate it deterministically from the negotiation state and have the LLM produce the framing. If the offer needs to be a proposal structure (task decomposition, role assignment), let the LLM draft it, but validate it against a schema and constraint-check before sending.




## Build It

Reconstruct **Negotiation and Bargaining** by following `BargainState` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `BargainState` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-bargainer-designer.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [NegotiationArena](https://arxiv.org/abs/2402.05863) — the benchmark; persona manipulation and exploitation findings
- [Measuring Bargaining Abilities of Language Models](https://arxiv.org/abs/2402.15813) — OG-Narrator and the buyer-harder-than-seller result
- [Large-Scale Autonomous Negotiation Competition](https://arxiv.org/abs/2503.06416) — ~180k negotiations; chain-of-thought concealment wins
- [LLM-Stakeholders Interactive Negotiation (NeurIPS 2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf) — multi-party scorable games with secret utilities
- [Smith 1980 — The Contract Net Protocol](https://ieeexplore.ieee.org/document/1675516) — the classical mechanism, IEEE Transactions on Computers

## Exercises

This lab follows `BargainState` and `naive_llm_bargain` on a controlled fixture; write down the value before changing the input.

1. **Trace the canonical fixture.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `BargainState`, `naive_llm_bargain`, `og_narrator_bargain`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the coordination mechanism behind Negotiation and Bargaining**.
2. **Change the controlled parameter.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Implement the central multi-agent interaction from first principles** says the other inputs should stay fixed.
3. **Exercise the guard.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Trace messages, shared state, and verification decisions end to end** and record the exception text if the code rejects the case.
4. **Prepare the artifact for reuse.** Open `outputs/skill-bargainer-designer.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Evaluate coordination quality, cost, and correlated failure modes**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Negotiation and Bargaining** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `BargainState`, `naive_llm_bargain`, `og_narrator_bargain` traced to the value or shape that supports **Explain the coordination mechanism behind Negotiation and Bargaining**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Implement the central multi-agent interaction from first principles**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Trace messages, shared state, and verification decisions end to end**; and
- an updated `outputs/skill-bargainer-designer.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate coordination quality, cost, and correlated failure modes**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
