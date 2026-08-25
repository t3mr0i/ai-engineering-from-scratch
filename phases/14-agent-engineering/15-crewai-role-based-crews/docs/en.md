# CrewAI: Role-Based Crews and Flows

> CrewAI is the 2026 role-based multi-agent framework. Four primitives: Agent, Task, Crew, Process. Two top-level shapes: Crews (autonomous, role-based collaboration) and Flows (event-driven, deterministic). The docs are blunt: "for any production-ready application, start with a Flow."

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 14 · 12 (Workflow Patterns), Phase 14 · 14 (Actor Model)
**Time:** ~75 minutes

## Learning Objectives

- Name CrewAI's four primitives (Agent, Task, Crew, Process) and what each owns.
- Distinguish Sequential, Hierarchical, and the planned Consensus process; pick one per workload.
- Distinguish Crews (autonomous role-based) from Flows (event-driven deterministic), and explain the docs' production recommendation.
- Wire tools with the `@tool` decorator and `BaseTool` subclass; reason about structured outputs vs free text.
- Implement a stdlib three-agent crew (researcher, writer, editor) that produces a brief.
- Spot the three CrewAI failure modes: prompt-bloat, manager-LLM tax, brittle handoffs.

## The Problem

Teams adopting multi-agent frameworks hit the same wall. "Autonomous collaboration" sounds great in a demo. Then a customer files a bug and you need deterministic replay. Or finance asks how much an LLM-routed crew costs per run. Or on-call needs to know which agent stalled at 3 AM.

Free-form LLM-routed crews answer none of those cleanly. Pure DAGs answer them all but lose the exploratory shape a brainstorming agent needs.

CrewAI's split is honest about the trade. Crews for collaborative, role-based, exploratory work. Flows for event-driven, code-owned, auditable production. Same framework, two shapes, pick per surface.

## The Concept

### Four primitives

CrewAI's surface is small. Memorize this and the rest is config.

- **Agent.** `role + goal + backstory + tools + (optional) llm`. The backstory is load-bearing. It shapes tone, judgment, when the agent stops. Tools are functions the agent can call (more below).
- **Task.** `description + expected_output + agent + (optional) context + (optional) output_pydantic`. A reusable unit of work. `expected_output` is the contract. `context` lists upstream tasks whose outputs are passed in. `output_pydantic` forces a structured shape.
- **Crew.** Container. Owns the list of `agents`, the list of `tasks`, the `process`, and optional `memory` + `verbose` + `manager_llm` settings.
- **Process.** Execution strategy. Sequential, Hierarchical, Consensus (planned). Picks the shape of the run.

Agents do not see each other directly. Tasks reference agents. The Crew sequences tasks. The Process decides who picks the next task. That is the whole mental model.

> **Validated against** CrewAI 0.86 (2026-05). Newer versions may rename or merge process types; check the [CrewAI Processes docs](https://docs.crewai.com/concepts/processes) before relying on a specific shape.

### Sequential vs Hierarchical vs Consensus

- **Sequential.** Tasks run in declaration order. Output of task N is available as `context` to task N+1. Lowest cost. Most predictable. Use when the order is fixed.
- **Hierarchical.** A manager Agent (separate LLM call) routes between specialists. CrewAI spawns the manager either from your `manager_llm` config or a default. The manager picks the next task each round and can refuse or re-route. Use when you have four or more specialists and order genuinely depends on prior output.
- **Consensus.** Planned, not currently implemented in the public API. The docs reserve the name for a future voting-based process. Do not rely on it today.

Hierarchical adds a per-round LLM call (the manager) on top of every specialist call. Token cost can triple on a five-step run. Pay for it only when you need the routing.

### Crews vs Flows

This is the framing the docs lead with in 2026.

- **Crew.** LLM-driven autonomy. The framework picks the shape at runtime. Good for: research, brainstorming, first drafts, anywhere the path is part of the answer. Hard to replay. Hard to test. Cheap to prototype.
- **Flow.** Event-driven graph you own. `@start` marks the entry. `@listen(topic)` marks a step that fires when another step emits that topic. Each step is plain Python (can call a Crew internally). Good for: production. Observable. Testable. Deterministic.

The docs' 2026 production recommendation: start with a Flow. Fold Crews in as `Crew.kickoff()` calls from inside Flow steps when autonomy earns its cost. The Flow gives you the audit trail, the Crew gives you the exploration. Compose, do not pick.

### Tool integration

Three ways to give an Agent a tool. Pick the simplest one that fits.

1. **`@tool` decorator.** Pure functions become tools. Signature is the schema; docstring is the description the LLM sees. Best for one-off helpers.

   ```python
   from crewai.tools import tool

   @tool("Search the web")
   def search(query: str) -> str:
       """Return top results for the query."""
       return run_search(query)
   ```

2. **`BaseTool` subclass.** Class-based tool with explicit args schema, async support, retries. Use when the tool has state (a client, a cache) or needs structured args.

   ```python
   from crewai.tools import BaseTool
   from pydantic import BaseModel

   class SearchArgs(BaseModel):
       query: str
       limit: int = 10

   class SearchTool(BaseTool):
       name = "web_search"
       description = "Search the web and return top results."
       args_schema = SearchArgs

       def _run(self, query: str, limit: int = 10) -> str:
           return self.client.search(query, limit=limit)
   ```

3. **Built-in toolkits.** CrewAI ships first-party adapters: `SerperDevTool`, `FileReadTool`, `DirectoryReadTool`, `CodeInterpreterTool`, `RagTool`, `WebsiteSearchTool`. Wired with one import.

Structured outputs use Pydantic. Pass `output_pydantic=MyModel` on the Task. CrewAI validates the LLM response against the model and either coerces or retries. Pair this with a tight `expected_output` string. Free-text outputs are fine for drafts; structured outputs are what downstream Flows can consume.

### Memory hooks

CrewAI ships four memory types out of the box. They compose: a Crew can enable all four at once.

> **Validated against** CrewAI 0.86 (2026-05). Recent releases route everything through a unified `Memory` system that wraps these four stores. The conceptual model below still holds, but the public class surface may collapse to a single `Memory` entry-point in newer versions; check [CrewAI memory docs](https://docs.crewai.com/concepts/memory) for the current API.

- **Short-term.** Conversation buffer within a single run. Wiped at the end.
- **Long-term.** Persisted across runs. Stored in a vector DB (Chroma by default, swappable). Retrieved by similarity to the current task.
- **Entity.** Per-entity facts. "Customer X is on the enterprise plan." Keyed by entity, not by similarity. Survives across runs.
- **Contextual.** Assembly-time retrieval. Pulls relevant memory at the moment the Agent needs it, not preloaded.

Enable on the Crew with `memory=True` or per-type config. Backed by an embeddings provider you configure (defaults to OpenAI, swappable to local). Memory is one of the places CrewAI earns its keep against thinner frameworks; pure LangGraph requires you to wire each of these yourself.

### When CrewAI fits

- Three to six agents with named roles and a collaborative workflow. Drafting, reviewing, planning, brainstorming.
- Routing where the LLM's judgment about the next step is part of the value (Hierarchical).
- Anywhere the team is happier reading `role + goal + backstory` than reading a graph definition.

### When CrewAI does not fit

- Deterministic DAGs with strict ordering. Use LangGraph (Lesson 13). The graph shape is the right abstraction; CrewAI's role framing is friction.
- Sub-second latency budgets. Hierarchical adds round trips. Even Sequential serializes prompts that include backstories and prior outputs.
- Single-agent loops. Skip the framework; an agent loop (Lesson 1) plus a tool registry is shorter.

Lesson 17 (Agent Framework Tradeoffs) lays this out in a matrix. The short version: CrewAI sits in the "collaborative role-based" corner.

### Dependency shape

Independent of LangChain. Python 3.10 to 3.13. Uses `uv`. Star count: see [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) (snapshot as of 2026-05). AWS Bedrock integration is documented; vendor benchmarks report a substantial speedup vs LangGraph on QA workloads, but the methodology (dataset, hardware, evaluation metric) is not published, so treat framework-vendor numbers as directional only.

### Where this pattern goes wrong

- **Prompt-bloat from backstories.** A 2000-word backstory per agent and a five-agent crew burns the context budget before the first tool call. Keep backstories under 200 words. Reuse phrases across agents; do not repeat house style five times.
- **Manager-LLM token tax.** Hierarchical process adds a manager LLM call before every specialist call. On a five-task crew that is six LLM calls instead of five, and the manager call carries the full task list plus prior outputs. Switch to Sequential unless routing depends on output.
- **Brittle handoffs.** Task N's `expected_output` is "an outline". Task N+1 reads it as `context` and tries to parse three sections. The LLM produced four. The downstream Agent ad-libs. Fix with `output_pydantic` on Task N so Task N+1 reads a typed object, not free text.
- **Crew-as-prod.** Free-form Crew shipped to production without a Flow wrapper. Output variability is high; replay is impossible; on-call cannot diff a bad run against a good one. Wrap with a Flow.




## Build It

Reconstruct **CrewAI: Role-Based Crews and Flows** by following `tool` on the text "red fox". Run `python3 main.py` and verify that the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text.

## Use It

Call `tool` from a small caller with the text "red fox". Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-crew-or-flow.md` with the command `python3 main.py`, the accepted input shape (the text "red fox"), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [CrewAI docs introduction](https://docs.crewai.com/en/introduction): concepts and the recommended production path
- [CrewAI Flows guide](https://docs.crewai.com/en/concepts/flows): event-driven shape, `@start`, `@listen`
- [CrewAI tools reference](https://docs.crewai.com/en/concepts/tools): `@tool`, `BaseTool`, built-in toolkits
- [CrewAI memory](https://docs.crewai.com/en/concepts/memory): short-term, long-term, entity, contextual
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents): when multi-agent helps and when it does not
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview): the state-machine alternative

## Exercises

Work from the smallest fixture that the CrewAI: Role-Based Crews and Flows demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using the text "red fox". Follow `tool`, `as`, `decorator`. Expect the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text; capture the first printed shape, metric, status, or summary field and state which part supports **Name CrewAI's four primitives (Agent, Task, Crew, Process) and what each owns.**.
2. **Perturb one field.** Repeat the command after changing only the input text: use the text "red fox runs". Predict the direction of the change, then compare the two output values. Explain why **Distinguish Sequential, Hierarchical, and the planned Consensus process; pick one per workload.** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation an empty string. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Distinguish Crews (autonomous role-based) from Flows (event-driven deterministic), and explain the docs' production recommendation.** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-crew-or-flow.md` and add a worked example using the text "red fox". Include the input contract, one expected output field, and a named acceptance check for **Wire tools with the `@tool` decorator and `BaseTool` subclass; reason about structured outputs vs free text.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **CrewAI: Role-Based Crews and Flows** should contain:

- the `python3 main.py` output for the text "red fox", with `tool`, `as`, `decorator` traced to the value or shape that supports **Name CrewAI's four primitives (Agent, Task, Crew, Process) and what each owns.**;
- a before/after comparison for the input text, where the text "red fox runs" changes the observation in the direction predicted by **Distinguish Sequential, Hierarchical, and the planned Consensus process; pick one per workload.**;
- a recorded result for an empty string that matches the implementation’s validation or empty-result contract and explains the evidence for **Distinguish Crews (autonomous role-based) from Flows (event-driven deterministic), and explain the docs' production recommendation.**; and
- an updated `outputs/skill-crew-or-flow.md` example with a concrete input, expected output field, and acceptance check tied to **Wire tools with the `@tool` decorator and `BaseTool` subclass; reason about structured outputs vs free text.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
