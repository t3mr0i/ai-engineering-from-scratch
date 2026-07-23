# Hierarchical Architecture and Its Failure Mode

> Hierarchical is supervisor nested. Manager agents over sub-managers over workers. CrewAI `Process.hierarchical` is the textbook version: a `manager_llm` dynamically delegates tasks and validates outputs. The LangGraph equivalent is `create_supervisor(create_supervisor(...))`. It is the natural pattern when the task is a real org chart. It is also the pattern most likely to collapse into managerial looping — manager agents assign work poorly, misinterpret sub-outputs, or fail to reach consensus. Sequential often beats it.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 05 (Supervisor Pattern)
**Time:** ~60 minutes

## Problem

Once the supervisor pattern clicks, the natural next step is "what if the workers are themselves supervisors?" Teams have sub-teams; companies have departments of departments. Hierarchical architectures mirror that.

The issue: LLM managers are not the same as human managers. A human manager has stable priors about what their reports know. An LLM manager re-reasons the org every turn from whatever is in its context. Tiny drift in that context, and the whole tree misallocates work.

## Concept

### The shape

```
                 Manager
                 ┌─────┐
                 └──┬──┘
           ┌────────┴────────┐
           ▼                 ▼
       Sub-Mgr A         Sub-Mgr B
       ┌─────┐           ┌─────┐
       └──┬──┘           └──┬──┘
         ┌┴──┬──┐          ┌┴──┐
         ▼   ▼  ▼          ▼   ▼
       W1  W2  W3         W4  W5
```

Every internal node plans, delegates, and synthesizes. Only leaves do work.

### Where it shines

- **Clear org mapping.** If the real task is departmental ("legal review the doc, finance review the doc, engineering review the doc, then summarize for exec"), the hierarchy is explicit.
- **Local summarization.** Each sub-manager synthesizes its team's output before the top manager sees it. Top manager sees three sub-manager summaries, not fifteen worker outputs.

### Where it breaks

Three failure modes the 2026 post-mortems keep finding:

1. **Task assignment error.** The manager reads the goal, hallucinates a decomposition, and delegates to the wrong sub-manager. Because the sub-manager obediently works on what it was given, the error only surfaces at the top synthesis — one level removed from where a human could have caught it.
2. **Output misinterpretation.** Sub-manager returns "unable to verify claim X." Top manager summarizes as "claim X not confirmed." Meaning drifts at every level.
3. **Consensus loops.** Two sub-managers disagree; top manager asks them to reconcile; they re-delegate down; workers re-run; sub-managers return slightly different answers; loop. CrewAI's `Process.hierarchical` guards against this with step limits, but the limit itself is now a hyperparameter.

### The deciding question

Sequential (linear pipeline) vs hierarchical: does your task actually have independent sub-teams, or is it one linear flow pretending to be a tree? If the latter, use sequential. If the former, use hierarchical but budget explicit reconciliation rules.

### CrewAI's implementation

`Process.hierarchical` wires a manager LLM over specialist crews. The manager:

- receives the top-level task,
- assigns subtasks to crews,
- evaluates crew outputs,
- decides whether to accept, re-delegate, or iterate.

Documentation: https://docs.crewai.com/en/introduction (look for "Hierarchical Process" under Core Concepts).

### LangGraph's implementation

LangGraph uses nested `create_supervisor` calls. The inner supervisor has its own graph; the outer supervisor treats the inner graph as an opaque node. This is cleaner than CrewAI for debugging (you can step through each graph separately) but harder to express dynamic reshaping of the tree.

Reference: https://reference.langchain.com/python/langgraph-supervisor.




## Further Reading

- [CrewAI introduction — Process.hierarchical](https://docs.crewai.com/en/introduction) — textbook hierarchical with a manager LLM
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor) — nested supervisor via `create_supervisor`
- [Anthropic engineering — Research system](https://www.anthropic.com/engineering/multi-agent-research-system) — why Anthropic deliberately chose flat supervisor over hierarchical
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) — MAST taxonomy; section on coordination failures documents decomposition drift
