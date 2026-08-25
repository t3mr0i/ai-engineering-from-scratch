# Benchmarks: WebArena and OSWorld

> WebArena tests web-agent capability across four self-hosted apps. OSWorld tests desktop-agent capability across Ubuntu, Windows, macOS. At release (2023–2024) both showed a big gap between best-in-class agents and humans. The gap is narrowing; the failure modes haven't changed.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 14 · 19 (SWE-bench, GAIA)
**Time:** ~60 minutes

## Learning Objectives

- Describe WebArena's four self-hosted apps and why execution-based evaluation matters.
- Explain why OSWorld uses real OS screenshots instead of accessibility APIs.
- Name the two primary OSWorld failure modes: GUI grounding and operational knowledge.
- Summarize what OSWorld-G and OSWorld-Human add on top of the base benchmark.

## The Problem

Generalist agents can call tools. Can they drive a browser across 20 clicks to complete a shopping checkout? Can they configure a Linux box using only keyboard and mouse? These are the questions WebArena and OSWorld answer.

## The Concept

### WebArena (Zhou et al., ICLR 2024)

- 812 long-horizon tasks across four self-hosted web apps: a shopping site, a forum, a GitLab-like dev tool, a business CMS.
- Plus utilities: map, calculator, scratchpad.
- Evaluation is execution-based via gym APIs — was the order placed, was the issue closed, was the CMS page updated?
- At release: best GPT-4 agent hit 14.41% success vs human 78.24%.

The self-hosted framing matters — the benchmark is not flaky because the target apps are pinned and reproducible.

### Extensions

- **VisualWebArena** — visually grounded tasks where success depends on interpreting images (screenshots as first-class observations).
- **TheAgentCompany** (Dec 2024) — adds terminal + coding; more like a real remote-work environment.

### OSWorld (Xie et al., NeurIPS 2024)

- 369 real computer tasks across Ubuntu, Windows, macOS.
- Free-form keyboard and mouse control of real applications.
- 1920×1080 screenshots as the observation.
- At release: best model 12.24% vs human 72.36%.

### Primary failure modes

1. **GUI grounding.** Pixel → element mapping. Models struggle to localize UI elements reliably in 1920×1080.
2. **Operational knowledge.** Which menu has the setting, which keyboard shortcut, which preference pane. Knowledge tail that humans build over years.

### Follow-ups

- **OSWorld-G** — 564-sample grounding suite + Jedi training set. Decomposes grounding from planning so you can measure them separately.
- **OSWorld-Human** — manually curated gold action trajectories. Shows top agents use 1.4-2.7x more steps than necessary (the trajectory-efficiency gap).

### Why this matters

Claude computer use, OpenAI CUA, Gemini 2.5 Computer Use (Lesson 21) all train on workloads shaped by WebArena and OSWorld. The benchmarks are the target; the production models are the shipped answer.

### Where benchmarking goes wrong

- **Screenshot-only evals.** OSWorld is screenshot-driven; evaluating an agent that uses DOM or accessibility APIs on OSWorld misses the grounding challenge.
- **Ignoring trajectory length.** Scoring only success-rate misses the 1.4-2.7x step inefficiency OSWorld-Human surfaces.
- **Stale self-hosted apps.** WebArena's apps pin specific versions; update without re-curation breaks comparability.




## Build It

Reconstruct **Benchmarks: WebArena and OSWorld** by following `ShoppingApp` on a graph with edges (0,1) and (1,2). Run `python3 main.py` and verify that degrees, adjacency, or connectivity expose the isolated/no-edge case explicitly.

## Use It

Call `ShoppingApp` from a small caller with a graph with edges (0,1) and (1,2). Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-web-desktop-harness.md` with the command `python3 main.py`, the accepted input shape (a graph with edges (0,1) and (1,2)), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Zhou et al., WebArena (arXiv:2307.13854)](https://arxiv.org/abs/2307.13854) — four-app web benchmark
- [Xie et al., OSWorld (arXiv:2404.07972)](https://arxiv.org/abs/2404.07972) — cross-OS desktop benchmark
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use) — Claude's benchmark-shaped capability
- [OpenAI, Computer-Using Agent](https://openai.com/index/computer-using-agent/) — OSWorld and WebArena numbers

## Exercises

Use `ShoppingApp` as the trace: start from a graph with edges (0,1) and (1,2), keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using a graph with edges (0,1) and (1,2). Follow `ShoppingApp`, `list_items`, `add_to_cart`. Expect degrees, adjacency, or connectivity expose the isolated/no-edge case explicitly; capture the first printed shape, metric, status, or summary field and state which part supports **Describe WebArena's four self-hosted apps and why execution-based evaluation matters.**.
2. **Vary one named input.** Repeat the command after changing only the edge list: use the same graph with an isolated node 3. Predict the direction of the change, then compare the two output values. Explain why **Explain why OSWorld uses real OS screenshots instead of accessibility APIs.** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation a graph with no edges. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Name the two primary OSWorld failure modes: GUI grounding and operational knowledge.** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-web-desktop-harness.md` and add a worked example using a graph with edges (0,1) and (1,2). Include the input contract, one expected output field, and a named acceptance check for **Summarize what OSWorld-G and OSWorld-Human add on top of the base benchmark.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Benchmarks: WebArena and OSWorld** should contain:

- the `python3 main.py` output for a graph with edges (0,1) and (1,2), with `ShoppingApp`, `list_items`, `add_to_cart` traced to the value or shape that supports **Describe WebArena's four self-hosted apps and why execution-based evaluation matters.**;
- a before/after comparison for the edge list, where the same graph with an isolated node 3 changes the observation in the direction predicted by **Explain why OSWorld uses real OS screenshots instead of accessibility APIs.**;
- a recorded result for a graph with no edges that matches the implementation’s validation or empty-result contract and explains the evidence for **Name the two primary OSWorld failure modes: GUI grounding and operational knowledge.**; and
- an updated `outputs/skill-web-desktop-harness.md` example with a concrete input, expected output field, and acceptance check tied to **Summarize what OSWorld-G and OSWorld-Human add on top of the base benchmark.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
