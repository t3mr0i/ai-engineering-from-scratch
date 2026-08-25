# Anthropic's Workflow Patterns: Simple Over Complex

> Schluntz and Zhang (Anthropic, Dec 2024) distinguish workflows (predefined paths) from agents (dynamic tool-use). Five workflow patterns cover most cases. Start with direct API calls. Add agents only when steps cannot be predicted.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 14 · 01 (Agent Loop)
**Time:** ~60 minutes

## Learning Objectives

- Name Anthropic's five workflow patterns: prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer.
- Explain the agent-vs-workflow distinction and the engineering cost of each.
- Identify when to pick a workflow over an agent (and vice versa).
- Implement all five patterns in stdlib against a scripted LLM.

## The Problem

Teams reach for multi-agent frameworks for problems that want a single function call. The cost is real: frameworks add layers that obscure prompts, hide control flow, and invite premature complexity. Schluntz and Zhang's Dec 2024 post is the most-cited industry pushback: start simple, add complexity only when it earns its cost.

## The Concept

### Workflows vs agents

- **Workflow.** LLMs and tools orchestrated through predefined code paths. Engineers own the graph.
- **Agent.** LLMs dynamically direct their own tools and take their own steps. The model owns the graph.

Both have their place. Workflows are cheaper, faster, and easier to debug. Agents unlock open-ended problems but make failure modes harder to reason about.

### The augmented LLM

Foundation for all five patterns: one LLM with three capabilities wired in — search (retrieval), tools (actions), memory (persistence). Any API call can use these.

### The five patterns

1. **Prompt chaining.** Output of call 1 is input to call 2. Use when a task has a clean linear decomposition. Optional programmatic gates between steps.

2. **Routing.** A classifier LLM picks which downstream LLM or tool to invoke. Use when categorically different inputs need different handling (tier-1 support vs refund vs bug vs sales).

3. **Parallelization.** Run N LLM calls concurrently, aggregate results. Two shapes: sectioning (different chunks) and voting (same prompt, N runs, majority/synthesis).

4. **Orchestrator-workers.** An orchestrator LLM dynamically decides which workers (also LLMs) to run and synthesizes their output. Similar to agent loops but the orchestrator does not loop indefinitely.

5. **Evaluator-optimizer.** One LLM proposes an answer, another LLM evaluates it. Iterate until the evaluator passes. This is Self-Refine (Lesson 05) generalized.

### Where workflows beat agents

- **Predictable tasks.** If you can enumerate the steps, you should.
- **Cost-bound tasks.** Workflows have bounded step counts; agents can spiral.
- **Compliance-bound tasks.** Auditors want to read the graph, not infer it from trajectories.

### Where agents beat workflows

- **Open-ended research.** When the next step depends on what the last step returned.
- **Variable-length tasks.** Minutes to hours of work where step count is unknown.
- **Novel domains.** When you don't yet know the right workflow — exploration first, codify later.

### The context-engineering companion

"Effective context engineering for AI agents" (Anthropic 2025) formalizes the adjacent discipline: the 200k window is a budget, not a container. What to include, when to compact, when to let context grow. Covered in detail in Phase 14 lesson on context compression (Phase 14 earlier lesson 06 in this curriculum before the renumber).




## Build It

Reconstruct **Anthropic's Workflow Patterns: Simple Over Complex** by following `ScriptedLLM` on the text "red fox". Run `python3 main.py` and verify that the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text.

## Use It

Call `ScriptedLLM` from a small caller with the text "red fox". Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-workflow-picker.md` with the command `python3 main.py`, the accepted input shape (the text "red fox"), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Anthropic, Building Effective Agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) — the five workflow patterns
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — the companion discipline
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — when stateful graphs earn their cost
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) — the orchestrator-workers pattern, productized

## Exercises

Use `ScriptedLLM` as the trace: start from the text "red fox", keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using the text "red fox". Follow `ScriptedLLM`, `prompt_chain`, `route`. Expect the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text; capture the first printed shape, metric, status, or summary field and state which part supports **Name Anthropic's five workflow patterns: prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer.**.
2. **Vary one named input.** Repeat the command after changing only the input text: use the text "red fox runs". Predict the direction of the change, then compare the two output values. Explain why **Explain the agent-vs-workflow distinction and the engineering cost of each.** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation an empty string. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Identify when to pick a workflow over an agent (and vice versa).** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-workflow-picker.md` and add a worked example using the text "red fox". Include the input contract, one expected output field, and a named acceptance check for **Implement all five patterns in stdlib against a scripted LLM.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Anthropic's Workflow Patterns: Simple Over Complex** should contain:

- the `python3 main.py` output for the text "red fox", with `ScriptedLLM`, `prompt_chain`, `route` traced to the value or shape that supports **Name Anthropic's five workflow patterns: prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer.**;
- a before/after comparison for the input text, where the text "red fox runs" changes the observation in the direction predicted by **Explain the agent-vs-workflow distinction and the engineering cost of each.**;
- a recorded result for an empty string that matches the implementation’s validation or empty-result contract and explains the evidence for **Identify when to pick a workflow over an agent (and vice versa).**; and
- an updated `outputs/skill-workflow-picker.md` example with a concrete input, expected output field, and acceptance check tied to **Implement all five patterns in stdlib against a scripted LLM.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
