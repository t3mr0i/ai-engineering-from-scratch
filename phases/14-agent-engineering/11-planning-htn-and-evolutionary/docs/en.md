# Planning with HTN and Evolutionary Search

> Symbolic planning handles the cases where the plan is provably correct. Evolutionary code search handles the cases where the fitness function is machine-checkable. ChatHTN (2025) and AlphaEvolve (2025) show what each unlocks when paired with an LLM.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 14 · 02 (ReWOO and Plan-and-Execute)
**Time:** ~75 minutes

## Learning Objectives

- Explain Hierarchical Task Networks: tasks, methods, operators, preconditions, effects.
- Describe ChatHTN's hybrid loop — symbolic search with LLM fallback decomposition.
- Explain AlphaEvolve's evolutionary loop and why it only works with a programmatic evaluator.
- Implement a toy HTN planner plus a toy evolutionary search in stdlib.

## The Problem

ReWOO (Lesson 02), Plan-and-Execute, and ReAct cover most agent planning. Two cases they don't cover well:

1. **Plans with provable correctness.** Scheduling, flight pathing, compliance workflows — the plan must be sound by construction. A fluent LLM plan that sometimes hallucinates a step is unacceptable.
2. **Optimizations with a machine-checkable fitness function.** Matrix multiplication, scheduling heuristics, compiler passes — the goal is not "a correct plan" but "the best plan."

HTN planning and AlphaEvolve solve the two different problems. Both use LLMs as amplifiers, not replacements.

## The Concept

### Hierarchical Task Networks

An HTN is:

- **Tasks** — compound (to be decomposed) and primitive (directly executable).
- **Methods** — ways to decompose a compound task into subtasks, with preconditions.
- **Operators** — primitive actions with preconditions and effects.
- **State** — a set of facts.

Planning: given a goal task and an initial state, find a decomposition into primitive operators whose preconditions are satisfied in sequence.

HTN is older than LLMs and still the reference for provably-correct plans.

### ChatHTN (Gopalakrishnan et al., 2025)

ChatHTN (arXiv:2505.11814) interleaves symbolic HTN with LLM queries:

1. Try to decompose the current compound task with existing methods.
2. If no method applies, ask the LLM: "how would you decompose `task` in state `s`?"
3. Translate the LLM response into candidate subtasks.
4. Validate against the operator schema; reject invalid decompositions.
5. Recurse.

The paper's central claim: every plan produced is provably sound because LLM suggestions only enter as candidate decompositions, never as direct plan edits. The symbolic layer owns correctness; the LLM expands the method library.

Online method learning (OpenReview `gwYEDY9j2x`, 2025 follow-up) adds a learner that generalizes LLM-produced decompositions by regression — cutting LLM query frequency up to 75%.

### AlphaEvolve (Novikov et al., 2025)

AlphaEvolve (arXiv:2506.13131, DeepMind, June 2025) is a different beast: evolutionary code search orchestrated by a Gemini 2.0 Flash/Pro ensemble.

Loop:

1. Start with a seed program + a programmatic evaluator (returns a fitness score).
2. Ensemble of LLMs proposes mutations.
3. Run mutations through the evaluator.
4. Keep the best; mutate again.

Published wins:

- First improvement over Strassen for 4x4 complex matrix multiplication in 56 years (48 scalar multiplications).
- 0.7% recovered Google compute via a Borg scheduling heuristic.
- 32% FlashAttention speedup on a frontier workload.

The hard constraint: the fitness function must be machine-checkable. Evolutionary search over prose answers does not converge.

### When to use which

| Problem class | Use | Why |
|---------------|-----|-----|
| Scheduling with hard constraints | HTN + ChatHTN | Provable soundness |
| Compiler optimization | AlphaEvolve | Machine-checkable fitness |
| Multi-step task execution | ReAct / ReWOO | LLM in the loop, no formal guarantees |
| Code improvement with tests | AlphaEvolve | Tests are the evaluator |
| Policy-bound automation | HTN | Preconditions encode policy |

### Where this pattern goes wrong

- **HTN without operators.** Without precondition/effect schemas the soundness claim collapses. ChatHTN's "LLM suggests decomposition" requires the schema to reject invalid moves.
- **AlphaEvolve without a real evaluator.** "Ask the LLM if the code is better" is not a fitness function. The evaluator must be deterministic and fast.
- **Over-engineering.** Most agent tasks don't need either. Reach for ReAct or ReWOO first.




## Build It

Reconstruct **Planning with HTN and Evolutionary Search** by following `Operator` on a graph with edges (0,1) and (1,2). Run `python3 main.py` and verify that degrees, adjacency, or connectivity expose the isolated/no-edge case explicitly.

## Use It

Call `Operator` from a small caller with a graph with edges (0,1) and (1,2). Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-hybrid-planner.md` with the command `python3 main.py`, the accepted input shape (a graph with edges (0,1) and (1,2)), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Gopalakrishnan et al., ChatHTN (arXiv:2505.11814)](https://arxiv.org/abs/2505.11814) — symbolic + LLM hybrid planner
- [Novikov et al., AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) — evolutionary code search with LLM mutations
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — when to reach for a planner vs a simple loop

## Exercises

Work from the smallest fixture that the Planning with HTN and Evolutionary Search demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using a graph with edges (0,1) and (1,2). Follow `Operator`, `applicable`, `apply`. Expect degrees, adjacency, or connectivity expose the isolated/no-edge case explicitly; capture the first printed shape, metric, status, or summary field and state which part supports **Explain Hierarchical Task Networks: tasks, methods, operators, preconditions, effects.**.
2. **Perturb one field.** Repeat the command after changing only the edge list: use the same graph with an isolated node 3. Predict the direction of the change, then compare the two output values. Explain why **Describe ChatHTN's hybrid loop — symbolic search with LLM fallback decomposition.** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation a graph with no edges. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Explain AlphaEvolve's evolutionary loop and why it only works with a programmatic evaluator.** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-hybrid-planner.md` and add a worked example using a graph with edges (0,1) and (1,2). Include the input contract, one expected output field, and a named acceptance check for **Implement a toy HTN planner plus a toy evolutionary search in stdlib.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Planning with HTN and Evolutionary Search** should contain:

- the `python3 main.py` output for a graph with edges (0,1) and (1,2), with `Operator`, `applicable`, `apply` traced to the value or shape that supports **Explain Hierarchical Task Networks: tasks, methods, operators, preconditions, effects.**;
- a before/after comparison for the edge list, where the same graph with an isolated node 3 changes the observation in the direction predicted by **Describe ChatHTN's hybrid loop — symbolic search with LLM fallback decomposition.**;
- a recorded result for a graph with no edges that matches the implementation’s validation or empty-result contract and explains the evidence for **Explain AlphaEvolve's evolutionary loop and why it only works with a programmatic evaluator.**; and
- an updated `outputs/skill-hybrid-planner.md` example with a concrete input, expected output field, and acceptance check tied to **Implement a toy HTN planner plus a toy evolutionary search in stdlib.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
