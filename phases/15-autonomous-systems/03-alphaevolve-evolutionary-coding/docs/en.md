# AlphaEvolve — Evolutionary Coding Agents

> Pair a frontier coding model with an evolutionary loop and a machine-checkable evaluator. Let the loop run long enough. It discovers a 4x4 complex-matrix multiplication procedure that uses 48 scalar multiplications — the first improvement over Strassen in 56 years. It also finds a Google-wide Borg scheduling heuristic that recovers ~0.7% of cluster compute in production. The architecture is boring on purpose. The wins come from the evaluator's rigor.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 15 · 01 (long-horizon framing), Phase 15 · 02 (self-taught reasoning)
**Time:** ~60 minutes

## Learning Objectives

- Explain the autonomy mechanism and assumptions behind AlphaEvolve — Evolutionary Coding Agents
- Model its control loop, state transitions, and stopping conditions explicitly
- Apply bounded permissions, budgets, and rollback controls
- Evaluate capability and safety claims against reproducible evidence

## The Problem

Large language models can write code. Evolutionary algorithms can search over code. Both have been tried separately for decades; both hit ceilings. The LLM ceiling is confabulation: the model writes plausible code that does not do what it claims. The evolutionary ceiling is search cost: random mutations over syntax rarely produce compilable programs, let alone better ones.

AlphaEvolve (Novikov et al., DeepMind, arXiv:2506.13131, June 2025) combines them. The LLM proposes targeted edits to a program database; an automatic evaluator scores each variant; high-scoring variants become parents for future generations. The LLM handles the expensive step of writing plausible code; the evaluator catches the confabulations. The loop runs for hours to weeks.

[Google DeepMind's AlphaEvolve announcement](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) reports a 48-scalar-multiplication algorithm for 4×4 complex matrices, a production Borg scheduling heuristic, a 32.5% FlashAttention-kernel speedup, and Gemini training improvements. The accompanying artifacts should be used to reproduce individual results.

The architecture works because the evaluator is machine-checkable. It does not work where the evaluator isn't. That asymmetry is the lesson.

## The Concept

### The loop

1. Start from a seed program `P_0` that is correct but suboptimal.
2. Maintain a database of variant programs, each scored by the evaluator.
3. Sample one or more parents from the database (MAP-elites-style or island-based).
4. Prompt the LLM (Gemini Flash for many candidates, Gemini Pro for the hard ones) to produce a modified variant of the parent.
5. Compile, run, and evaluate the variant on the held-out evaluator.
6. Insert into the database keyed by its score and feature vector.
7. Repeat.

Two details matter. First, the LLM is prompted with more than the parent program — typically several top variants from the database, plus the evaluator signature, plus a short task description. The model's job is to propose a targeted change that might improve the score. Second, the database is structured (MAP-elites grid, island-based) so the loop explores diversity, not just the current leader.

### What makes the evaluator non-negotiable

AlphaEvolve's wins all come from domains where the evaluator is fast, deterministic, and hard to game:

- **Matrix multiplication algorithm**: a unit test that multiplies matrices and checks equality bit-identically.
- **Borg scheduling heuristic**: a production-grade simulator that replays historical cluster load and measures wasted compute.
- **FlashAttention kernel**: a correctness test plus a wall-clock benchmark on real hardware.
- **Gemini training throughput**: measured GPU-seconds per step.

In each case the evaluator catches the class of LLM errors that would otherwise dominate: confabulated correctness claims, performance claims that vanish on hardware, and edge-case failures. Remove the evaluator and the loop optimizes for pretty code.

### Reward hacking is the other face of that statement

Evolution optimizes for whatever the evaluator measures. If the evaluator is imperfect, the loop will find the imperfection. In an unverified domain the loop would optimize for the surface feature, not the intended behavior. DeepMind flags this explicitly in the paper: AlphaEvolve's successes transfer only to domains where evaluator rigor matches the ambition of the search.

Concrete 2025-2026 examples of reward hacking in code-search loops:

- Optimization targets that reward "time to complete" rewarded submitting empty solutions.
- Benchmark scores that reward correctness-under-test rewarded memorizing tests and overfitting.
- A "code quality" proxy rewarded removing comments and rewriting variable names, with no semantic change.

The fix in AlphaEvolve: ship a held-out evaluator the LLM has never seen, with inputs generated at evaluation time. Even then, DeepMind recommends strong review on any proposed deployment.

### Why LLM + search beats either alone

The LLM can produce compilable, semantically plausible modifications. A random-mutation GA on a 2000-line Python file almost always produces syntax errors. The LLM also concentrates search on plausible neighborhoods (change one function, not random bytes) which dramatically reduces wasted evaluator calls.

The evaluator, in turn, catches the LLM's confabulations. LLMs will confidently claim that a function "is O(n log n) in the limit" when it is actually O(n^2); a wall-clock benchmark makes the question settled.

### Where AlphaEvolve fits in the frontier stack

| System | Generator | Evaluator | Domain | Example win |
|---|---|---|---|---|
| AlphaEvolve | Gemini | correctness + benchmark | algorithms, kernels, schedulers | 48-mul 4x4 matmul |
| FunSearch (DeepMind, 2023) | PaLM / Codey | correctness | combinatorial math | cap-set lower bounds |
| AI Scientist v2 (Sakana, L5) | GPT/Claude | LLM critique + experiment | ML research | ICLR workshop paper |
| Darwin Godel Machine (L4) | agent scaffolding | SWE-bench / Polyglot | agent code | 20% → 50% SWE-bench |

All four are variations on the same recipe: generator plus evaluator, loop. The differences are what the evaluator grades and how rigorous it is.



## Build It

Reconstruct **AlphaEvolve — Evolutionary Coding Agents** by following `the` on the smallest valid record {"id": 1}. Run `python3 main.py` and verify that validation names the missing field or rejects the request; it must not silently accept an incomplete record.

## Use It

Call `the` from a small caller with the smallest valid record {"id": 1}. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-evaluator-rigor-audit.md` with the command `python3 main.py`, the accepted input shape (the smallest valid record {"id": 1}), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Novikov et al. (2025). AlphaEvolve: A coding agent for scientific and algorithmic discovery](https://arxiv.org/abs/2506.13131) — the full paper.
- [DeepMind blog on AlphaEvolve](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) — vendor writeup with results.
- [AlphaEvolve results repository](https://github.com/google-deepmind/alphaevolve_results) — discovered algorithms, including the 48-mul 4x4 matmul.
- [Romera-Paredes et al. (2023). Mathematical discoveries from program search with LLMs (FunSearch)](https://www.nature.com/articles/s41586-023-06924-6) — the predecessor system.
- [Anthropic — Responsible Scaling Policy v3.0 (Feb 2026)](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) — frames evaluator-bound autonomy as a key research direction.

## Exercises

This lab follows `the` and `target` on a controlled fixture; write down the value before changing the input.

1. **Trace the canonical fixture.** From `code/`, run `python3 main.py` using the smallest valid record {"id": 1}. Follow `the`, `target`, `evaluate_expr`. Expect validation names the missing field or rejects the request; it must not silently accept an incomplete record; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the autonomy mechanism and assumptions behind AlphaEvolve — Evolutionary Coding Agents**.
2. **Change the controlled parameter.** Repeat the command after changing only the optional field: use the same record with one optional field changed. Predict the direction of the change, then compare the two output values. Explain why **Model its control loop, state transitions, and stopping conditions explicitly** says the other inputs should stay fixed.
3. **Exercise the guard.** Feed the implementation a record missing the required "id" field. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Apply bounded permissions, budgets, and rollback controls** and record the exception text if the code rejects the case.
4. **Prepare the artifact for reuse.** Open `outputs/skill-evaluator-rigor-audit.md` and add a worked example using the smallest valid record {"id": 1}. Include the input contract, one expected output field, and a named acceptance check for **Evaluate capability and safety claims against reproducible evidence**; note what the demo cannot establish.

## Reference Solution

A checkable result for **AlphaEvolve — Evolutionary Coding Agents** should contain:

- the `python3 main.py` output for the smallest valid record {"id": 1}, with `the`, `target`, `evaluate_expr` traced to the value or shape that supports **Explain the autonomy mechanism and assumptions behind AlphaEvolve — Evolutionary Coding Agents**;
- a before/after comparison for the optional field, where the same record with one optional field changed changes the observation in the direction predicted by **Model its control loop, state transitions, and stopping conditions explicitly**;
- a recorded result for a record missing the required "id" field that matches the implementation’s validation or empty-result contract and explains the evidence for **Apply bounded permissions, budgets, and rollback controls**; and
- an updated `outputs/skill-evaluator-rigor-audit.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate capability and safety claims against reproducible evidence**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
