# ReWOO and Plan-and-Execute: Decoupled Planning

> ReAct interleaves thought and action in one stream. ReWOO separates them: one big plan up front, then execute. 5x fewer tokens, +4% accuracy on HotpotQA, and you can distill the planner into a 7B model. Plan-and-Execute generalized it; Plan-and-Act scaled it to web navigation.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 14 · 01 (Agent Loop)
**Time:** ~60 minutes

## Learning Objectives

- Explain why ReWOO's Planner / Worker / Solver split saves tokens and improves robustness over ReAct's interleaved loop.
- Implement a plan DAG, a dependency-ordered executor, and a solver that composes worker outputs — all stdlib.
- Decide when a task should run as plan-then-execute vs interleaved ReAct, using the 2026 "five workflow patterns" framing (Anthropic).
- Recognize when Plan-and-Act's synthetic plan data is needed for long-horizon web or mobile tasks.

## The Problem

ReAct's interleaved thought-action-observation loop is simple and flexible, but each tool call has to carry the full prior context — including every previous thought. Token usage grows quadratically with depth. Worse: when a tool fails mid-loop, the model has to re-derive the whole plan from the error observation.

ReWOO (Xu et al., arXiv:2305.18323, May 2023) noticed this and made a bet: plan the whole thing up front, fetch evidence in parallel, compose the answer at the end. One LLM call to plan, N tool calls for evidence (can be parallel), one LLM call to solve. The trade is less flexibility (the plan is static) for much better token efficiency and clearer failure modes.

## The Concept

### The three roles

```
Planner:  user_question -> [plan_dag]
Workers:  [plan_dag]     -> [evidence]        (tool calls, possibly parallel)
Solver:   user_question, plan_dag, evidence -> final_answer
```

Planner produces a DAG. Each node names a tool, its arguments, and which earlier nodes it depends on (references like `#E1`, `#E2`). Workers execute nodes in topological order. Solver stitches everything together.

Every example below shares this setup — run it once, then the rest reuse `lrn_llm`. Then build a toy ReWOO agent that answers: "What is the population of the capital of France, rounded to millions?"

```python editable
import sys, json, types
lrn_llm = types.ModuleType("lrn_llm")
try:
    from pyodide.http import pyfetch as _pyfetch
    _IN_PYODIDE = True
except ImportError:
    import urllib.request as _urlreq
    _IN_PYODIDE = False
lrn_llm.API_BASE = "/api/llm"
lrn_llm.DEFAULT_MODEL = "azure/gpt-5.4-mini"
lrn_llm.API_KEY = ""

async def _lrn_call(messages, *, system=None, max_tokens=400, model=None):
    if system is not None:
        messages = [{"role": "system", "content": system}] + list(messages)
    payload = {"model": model or lrn_llm.DEFAULT_MODEL, "messages": messages,
               "max_completion_tokens": max_tokens}
    headers = {"content-type": "application/json"}
    _key = lrn_llm.API_KEY
    if _key:
        headers["Authorization"] = "Bearer " + _key
    url = lrn_llm.API_BASE.rstrip("/") + "/chat/completions"
    body = json.dumps(payload)
    if _IN_PYODIDE:
        r = await _pyfetch(url, method="POST", headers=headers, body=body)
        data = await r.json()
    else:
        req = _urlreq.Request(url, method="POST", headers=headers, data=body.encode("utf-8"))
        with _urlreq.urlopen(req, timeout=60) as r:
            data = json.loads(r.read())
    if "error" in data:
        raise RuntimeError("LLM error: " + str(data["error"]))
    return data

def _lrn_text(r):
    ch = (r or {}).get("choices") or []
    return (ch[0].get("message", {}) or {}).get("content", "") if ch else ""

async def _lrn_ping():
    r = await _lrn_call([{"role": "user", "content": "Reply with exactly: OK"}], max_tokens=5)
    return {"ok": _lrn_text(r).strip().upper().startswith("OK"), "model": r.get("model")}

lrn_llm.call = _lrn_call
lrn_llm.text = _lrn_text
lrn_llm.ping = _lrn_ping
r = await lrn_llm.ping()
print(f"LLM reachable: {r}")
```

The plan itself is a DAG: each step names a tool, its arguments, and an id other steps can reference.

```python editable
import re
from dataclasses import dataclass
from typing import Any

@dataclass
class PlanStep:
    """A single step in the plan DAG."""
    id: str          # E1, E2, E3, ...
    tool: str        # what to call (e.g., 'search')
    args: dict       # arguments, may contain #E1, #E2 references

@dataclass
class Plan:
    """A complete plan DAG."""
    steps: list[PlanStep]

print("✅ Plan classes defined")
```

The planner reads the question and emits the DAG up front, before any tool has run:

```python editable
question = "What is the population of the capital of France, rounded to millions?"

# Ask the planner to create a step-by-step plan
plan_prompt = f"""Given the question: {question}

Create a step-by-step plan using search and rounding tools. Format each step as:
E<N>: <tool>(<arg1>="<val1>", <arg2>="<val2>")

Example:
E1: search(query="capital of France")
E2: search(query="population of #E1")
E3: round_million(text="#E2")

Use #E<N> to reference earlier step outputs."""

plan_resp = await lrn_llm.call(
    [{"role": "user", "content": plan_prompt}],
    system="You are a planning expert. Emit a minimal, acyclic DAG of search and rounding steps.",
    max_tokens=200
)

plan_text = lrn_llm.text(plan_resp)
print("Planner output:")
print(plan_text)
```

Parse the planner's raw text output into the `Plan` dataclass:

```python editable
def parse_plan(text: str) -> Plan:
    """Parse planner output into a DAG."""
    steps = []
    # Match lines like: E1: search(query="...")
    pattern = r'E(\d+):\s+(\w+)\(([^)]+)\)'
    for match in re.finditer(pattern, text):
        step_num = match.group(1)
        tool = match.group(2)
        args_str = match.group(3)
        # Parse key="value" pairs (simple)
        args = {}
        for kv in re.findall(r'(\w+)="([^"]+)"', args_str):
            args[kv[0]] = kv[1]
        steps.append(PlanStep(f"E{step_num}", tool, args))
    return Plan(steps)

plan = parse_plan(plan_text)
print(f"Parsed {len(plan.steps)} steps:")
for step in plan.steps:
    print(f"  {step.id}: {step.tool}({step.args})")
```

Before execution, resolve `#E1`-style references and put the steps in topological order:

```python editable
REFERENCE_RE = re.compile(r"#E(\d+)")

def resolve_references(value: Any, evidence: dict[str, str]) -> Any:
    """Replace #E1, #E2, ... with actual values from evidence."""
    if not isinstance(value, str):
        return value
    return REFERENCE_RE.sub(lambda m: evidence.get(f"E{m.group(1)}", m.group(0)), value)

def topological(plan: Plan) -> list[PlanStep]:
    """Return steps in dependency order (no cycles)."""
    resolved = []
    known = set()
    pending = list(plan.steps)

    while pending:
        progress = False
        rest = []
        for step in pending:
            # Check if all #E<N> references are already computed
            refs = REFERENCE_RE.findall(str(step.args))
            if all(f"E{r}" in known for r in refs):
                resolved.append(step)
                known.add(step.id)
                progress = True
            else:
                rest.append(step)
        if not progress:
            raise RuntimeError("Cyclic or unresolved references in plan")
        pending = rest
    return resolved

ordered = topological(plan)
print(f"Topological order:")
for step in ordered:
    print(f"  {step.id}: {step.tool}")
```

Now the workers: each plan step dispatches to a tool implementation. These two (search, round-to-millions) happen to be LLM-backed, but the pattern — plan node in, evidence out — is the same for a real API call:

```python editable
async def worker_search(query: str) -> str:
    """Worker: search for a query."""
    resp = await lrn_llm.call(
        [{"role": "user", "content": f"Search query: {query}\nProvide a short factual answer."}],
        system="You are a search engine. Answer factually and concisely.",
        max_tokens=100
    )
    return lrn_llm.text(resp).strip()

async def worker_round_million(text: str) -> str:
    """Worker: extract a number and round to millions."""
    resp = await lrn_llm.call(
        [{"role": "user", "content": f"From this text: '{text}'\nExtract the number and round to millions. Reply only with '<N> million'."  }],
        system="Extract numbers and round them.",
        max_tokens=20
    )
    return lrn_llm.text(resp).strip()

print("✅ Worker functions defined")
```

Run all workers in topological order, resolving references from prior evidence as each step becomes ready:

```python editable
async def run_workers(plan: Plan) -> dict[str, str]:
    """Execute all plan steps in topological order."""
    evidence = {}
    for step in topological(plan):
        # Resolve references in args
        bound_args = {k: resolve_references(v, evidence) for k, v in step.args.items()}
        print(f"\n→ Executing {step.id}: {step.tool}({bound_args})")

        # Call the appropriate worker
        if step.tool == "search":
            result = await worker_search(bound_args["query"])
        elif step.tool == "round_million":
            result = await worker_round_million(bound_args["text"])
        else:
            result = f"error: unknown tool {step.tool}"

        evidence[step.id] = result
        print(f"  → {step.id} = {result}")

    return evidence

evidence = await run_workers(plan)
print("\n" + "="*50)
print("EVIDENCE COLLECTED")
for k, v in evidence.items():
    print(f"  {k}: {v}")
```

Finally, the solver reads the original question, the plan, and the collected evidence, and composes the answer:

```python editable
# Build a context for the solver
solver_context = f"""Question: {question}

Plan that was executed:
"""
for step in plan.steps:
    solver_context += f"\n  {step.id}: {step.tool}({step.args})"

solver_context += f"\n\nEvidence from execution:\n"
for k, v in evidence.items():
    solver_context += f"  {k}: {v}\n"

solver_prompt = solver_context + "\n\nCompose a clear, one-sentence final answer to the original question."

solver_resp = await lrn_llm.call(
    [{"role": "user", "content": solver_prompt}],
    system="You are a solver. Compose a final answer from evidence and the plan.",
    max_tokens=100
)

final_answer = lrn_llm.text(solver_resp).strip()
print("FINAL ANSWER:")
print(final_answer)
```

### Why 5x fewer tokens

ReAct grows prompt length linearly with step count. At step 10, the prompt contains thought 1 plus action 1 plus observation 1 plus thought 2 plus action 2 plus observation 2, and so on. Each intermediate step also redundantly includes the original prompt.

ReWOO pays one planner prompt (large), N small worker prompts (each just the tool call, no chain), and one solver prompt. On HotpotQA the paper measures ~5x fewer tokens while scoring +4 absolute accuracy.

Estimate the savings on the run above (char count as a token proxy), comparing ReWOO's actual prompts against a simulated ReAct trace that resends the growing context at every turn:

```python editable
# ReWOO token estimate (char count as proxy)
planner_tokens = len(plan_prompt) + len(plan_text)
worker_tokens = sum(
    sum(len(str(v)) for v in bound_args.values()) + len(evidence.get(step.id, ""))
    for step in plan.steps
    for bound_args in [{k: resolve_references(v, evidence) for k, v in step.args.items()}]
)
solver_tokens = len(solver_context) + len(final_answer)
rewoo_total = planner_tokens + worker_tokens + solver_tokens

# ReAct would resend the growing context (question + every prior step's tool
# call and observation) at each turn. Simulate that growth using the real
# tool-call args and evidence strings already produced above, in execution order.
history_so_far = ""
react_estimated = 0
for step in ordered:
    step_repr = f"{step.tool}({step.args})"
    react_estimated += len(question) + len(history_so_far) + len(step_repr)
    history_so_far += step_repr + evidence.get(step.id, "")
react_estimated += len(final_answer)

print(f"ReWOO token estimate (chars): {rewoo_total}")
print(f"  Planner: {planner_tokens}")
print(f"  Workers: {worker_tokens}")
print(f"  Solver: {solver_tokens}")
print(f"\nReAct estimated (chars): {react_estimated}")
print(f"Ratio (ReAct / ReWOO): {react_estimated / max(rewoo_total, 1):.1f}x")
print(f"\nNote: On HotpotQA, the ReWOO paper measured ~5x fewer tokens.")
```

### Why it is more robust

If worker 3 fails in ReAct, the loop has to reason out of the error mid-stream. In ReWOO, worker 3 returns an error string; the solver sees it in context with the original plan and can degrade gracefully. Failure localization is per-node, not per-step.

### Planner distillation

The paper's second result: because the planner does not see observations, you can fine-tune a 7B model on planner outputs from a 175B teacher. The small model handles planning; the big model is not needed at inference. This is now standard — many 2026 production agents use a small planner and a big executor or vice-versa.

### Plan-and-Execute (LangChain, 2023)

The LangChain team's August 2023 post generalized ReWOO into a pattern name: Plan-and-Execute. Up-front planner emits a step list, executor runs each step, an optional replanner can revise after observing results. This is closer to ReAct than ReWOO (the replanner brings observations back into planning) but preserves the token savings.

### Plan-and-Act (Erdogan et al., arXiv:2503.09572, ICML 2025)

Plan-and-Act scales the pattern to long-horizon web and mobile agents. The key contribution is synthetic plan data: a labeled trajectory generator produces training data where the plan is explicit. Used to fine-tune planner models that keep working past 30–50 steps on WebArena-like tasks where a single ReAct trajectory loses coherence.

### When to pick which

| Pattern | When |
|---------|------|
| ReAct | Short tasks, unknown environment, need reactive exception handling |
| ReWOO | Structured tasks with known tools, token-sensitive, parallelizable evidence |
| Plan-and-Execute | Like ReWOO but with replanning after partial execution |
| Plan-and-Act | Long-horizon (>30 steps), web/mobile/computer-use |
| Tree of Thoughts | Search is worth paying for (Lesson 04) |

Anthropic's Dec 2024 guidance: start with the simplest. If the task is one tool call plus a summary, do not build ReWOO. If the task is a 40-step research assignment, do not do ReAct alone.

## Try It Yourself

Change the question and re-run the planner to see how it adapts. Try a different domain — "What is the total GDP of Scandinavian countries?" or "Find the birth date of the inventor of the internet."

```python editable
# TODO: Edit this question and re-run the entire workflow
new_question = "What is the birth year of the inventor of the World Wide Web?"

# Re-run the planner with this new question:
plan_prompt = f"""Given the question: {new_question}

Create a step-by-step plan. Format each step as:
E<N>: <tool>(<arg1>="<val1>")

Example:
E1: search(query="inventor of the World Wide Web")
E2: search(query="birth year of #E1")

Use #E<N> to reference earlier step outputs."""

plan_resp = await lrn_llm.call(
    [{"role": "user", "content": plan_prompt}],
    system="You are a planning expert. Emit a minimal, acyclic DAG.",
    max_tokens=200
)

plan_text = lrn_llm.text(plan_resp)
print("Planner output for new question:")
print(plan_text)
```

## Further Reading

- [Xu et al., ReWOO: Decoupling Reasoning from Observations (arXiv:2305.18323)](https://arxiv.org/abs/2305.18323) — the canonical paper
- [Erdogan et al., Plan-and-Act (arXiv:2503.09572)](https://arxiv.org/abs/2503.09572) — scaled planner-executor with synthetic plans
- [LangGraph Plan-and-Execute tutorial](https://docs.langchain.com/oss/python/langgraph/overview) — the framework recipe
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — pick the simplest pattern that works
