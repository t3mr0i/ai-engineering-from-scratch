# Theory of Mind and Emergent Coordination

> Li et al. (arXiv:2310.10701) showed that LLM agents in a cooperative text game exhibit **emergent high-order Theory of Mind** (ToM) — reasoning about what another agent believes about a third agent's beliefs — but fail on long-horizon planning due to context management and hallucination. Riedl (arXiv:2510.05174) measured higher-order synergy across a population and found that **only** the ToM-prompt condition produces identity-linked differentiation and goal-directed complementarity; lower-capacity LLMs show only spurious emergence. That is, coordination emergence is prompt-conditional and model-dependent, not free. This lesson implements a minimal ToM-aware agent, runs a cooperative task with and without ToM prompting, and measures the coordination delta against the Riedl 2025 protocol.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 16 · 07 (Society of Mind and Debate), Phase 16 · 17 (Generative Agents)
**Time:** ~75 minutes

## Learning Objectives

- Explain the coordination mechanism behind Theory of Mind and Emergent Coordination
- Implement the central multi-agent interaction from first principles
- Trace messages, shared state, and verification decisions end to end
- Evaluate coordination quality, cost, and correlated failure modes

## Problem

Multi-agent coordination often looks magical: agents divide labor, anticipate each other, avoid redundancy. Usually this "emergence" is an artifact of prompt engineering — someone told the agents to "coordinate." Remove the prompt, remove the coordination.

Riedl's 2025 finding is stricter: under controlled conditions, coordination only emerges when agents are prompted to reason about **other agents' minds** (ToM). Without the ToM prompt, even strong models show coordination patterns that do not survive statistical controls. This matters for production: teams ship "multi-agent coordination" features that are prompt-dependent and brittle.

This lesson treats ToM as a specific capability (reasoning about beliefs about beliefs), builds a minimal ToM-aware agent, and measures what real coordination looks like vs. what prompt dressing looks like.

## Concept

### What ToM means

Developmental psychology: a 3-year-old thinks anyone's inner world matches theirs. A 5-year-old understands others have different beliefs. A 7-year-old reasons about beliefs about beliefs ("she thinks that I think the ball is under the cup"). These are zeroth, first, and second-order ToM.

For LLM agents, ToM orders map to:

- **Zeroth-order:** no model of others. The agent acts on its own observations only.
- **First-order:** the agent has a model of each other agent's beliefs. "Alice believes X."
- **Second-order:** the agent models recursive beliefs. "Alice believes that Bob believes X."

Li et al. 2023 found that first- and second-order ToM emerge in LLM agents in cooperative games but degrade with long horizon and unreliable communication.

### The Sally-Anne test, in brief

A 1985 false-belief test: Sally puts a marble in basket A, leaves. Anne moves it to basket B. Where will Sally look when she returns? A child with first-order ToM says basket A (Sally's belief differs from reality). A child without says basket B.

GPT-4-era LLMs pass Sally-Anne-style tests when posed plainly. They fail when the narrative is long, the scene changes several times, or the question is phrased indirectly. That is the practical 2026 state of ToM in production LLMs.

### Riedl's coordination measurement

Riedl (arXiv:2510.05174) built a population-scale test: N agents, a cooperative objective, variable prompt conditions. Measure:

1. **Identity-linked differentiation.** Do agents develop stable role distinctions over time?
2. **Goal-directed complementarity.** Do agents' actions complement each other (different subtasks) rather than duplicate?
3. **Higher-order synergy.** A statistical measure of whether the group achieves what no subset could.

Result: only under the ToM prompt condition do all three metrics produce signal above baseline. Without ToM prompting, metrics hover near chance for moderate-capacity models. Large models show some coordination without explicit ToM prompting but the effect is smaller than with explicit prompting.

### The coordination illusion

Without statistical controls, "emergent coordination" in demos often reflects:

- Prompt engineering that bakes in coordination (system prompts that say "work together").
- Observer bias (we see patterns we expect).
- Post-hoc selection of successful runs.

Production systems that market "emergent coordination" without measurable signal should be treated as marketing. Measure before claiming.

### A minimal ToM-aware agent

Structure:

```
agent state:
  own_beliefs:    {facts the agent believes}
  other_models:   {other_agent_id -> {beliefs_the_agent_attributes_to_them}}
  actions_last_N: [history of others' actions]

observation update:
  - update own_beliefs from direct observation
  - update other_models[agent_id] from their action + prior beliefs

action selection:
  - enumerate candidate actions
  - for each, predict what each other agent will do next given their modeled beliefs
  - pick action that maximizes joint outcome under those predictions
```

The `other_models` attribute is the ToM state. First-order ToM keeps just one level. Second-order adds `other_models[i][other_models_of_j]` — what I think agent i thinks agent j believes.

### Why long-horizon hurts

Li et al. document: context limits cause agents to forget which belief belongs to whom. Hallucination adds false beliefs to other-agent models. Both produce "I thought he thought X" errors that compound over time.

Mitigations documented in the paper and in 2024-2026 follow-ups:

- **Explicit ToM state in the prompt.** Structured format: `{agent_id: belief_list}`. Forces retrieval to preserve identity-belief binding.
- **Shorter reasoning chains.** Fewer ToM updates per turn reduce compounding hallucination.
- **External ToM store.** Maintain the model outside the LLM context; inject only relevant parts per turn.

### Where ToM fails in production

- **Adversarial settings.** Agents with good ToM are easier to manipulate (you can model what they model of you, then exploit).
- **Heterogeneous teams.** When models are different, the ToM model that works for one opponent does not generalize.
- **Ground-truth-dependent tasks.** ToM is about beliefs; if correctness depends on facts, ToM can be a distraction.

### The coordination you can actually measure

Three practical signals a team's coordination is real rather than prompt-dressed:

1. **Complementarity over time.** Over a multi-turn task, do agents' actions cover disjoint sub-tasks?
2. **Anticipation.** Does agent A's action at turn T+1 depend on a prediction about B's action at T+2 that turned out correct?
3. **Correction.** When A misreads B's belief at turn T, does A correct by turn T+2?

These are measurable in a logged multi-agent system. They are the substantive version of the "coordination" narrative.




## Build It

Reconstruct **Theory of Mind and Emergent Coordination** by following `World` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `World` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-tom-auditor.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Li et al. — Theory of Mind for Multi-Agent Collaboration via Large Language Models](https://arxiv.org/abs/2310.10701) — emergent ToM in cooperative games; long-horizon failure modes
- [Riedl — Emergent Coordination in Multi-Agent Language Models](https://arxiv.org/abs/2510.05174) — population-scale measurement; ToM prompting is the load-bearing condition
- [Premack & Woodruff — Does the chimpanzee have a theory of mind?](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/does-the-chimpanzee-have-a-theory-of-mind/1E96B02CD9850E69AF20F81FA7EB3595) — the 1978 origin of the ToM concept
- [Baron-Cohen, Leslie, Frith — Does the autistic child have a theory of mind?](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/does-the-autistic-child-have-a-theory-of-mind/) — the Sally-Anne paper (1985)

## Exercises

Work from the smallest fixture that the Theory of Mind and Emergent Coordination demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `World`, `new`, `Agent`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the coordination mechanism behind Theory of Mind and Emergent Coordination**.
2. **Perturb one field.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Implement the central multi-agent interaction from first principles** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Trace messages, shared state, and verification decisions end to end** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-tom-auditor.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Evaluate coordination quality, cost, and correlated failure modes**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Theory of Mind and Emergent Coordination** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `World`, `new`, `Agent` traced to the value or shape that supports **Explain the coordination mechanism behind Theory of Mind and Emergent Coordination**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Implement the central multi-agent interaction from first principles**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Trace messages, shared state, and verification decisions end to end**; and
- an updated `outputs/skill-tom-auditor.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate coordination quality, cost, and correlated failure modes**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
