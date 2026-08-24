# LangGraph: Stateful Graphs and Durable Execution

> LangGraph is the 2026 reference for low-level stateful orchestration. Agent is a state machine; nodes are functions; edges are transitions; state is immutable and checkpointed after every step. Resume from any failure exactly where it left off.

**Type:** Build
**Languages:** Python, TypeScript
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~75 minutes

## Learning Objectives

- Describe LangGraph's core model: state machine with immutable state, function nodes, conditional edges, and post-step checkpoints.
- Name the four capabilities the docs highlight: durable execution, streaming, human-in-the-loop, comprehensive memory.
- Explain the three orchestration topologies LangGraph supports: supervisor, peer-to-peer (swarm), hierarchical (nested subgraphs).
- Implement a stdlib state graph with immutable state, conditional edges, and a checkpoint/resume cycle.

## The Problem

Agents and workflows share a problem: when a 40-step run fails at step 38, you want to resume from step 38, not start over. Second-class state models leave operators hacking retries around a library that assumes fresh runs.

LangGraph's design answer: state is a first-class typed object, mutations are explicit, and checkpoints persist after every node. Resume means re-invoking the graph with the same `thread_id` in its config; the checkpointer loads the last snapshot for that thread and `graph.get_state(config)` reads it back.

## The Concept

### The graph

A graph is defined by:

- **State type.** A typed dict (or Pydantic model) that every node reads and mutates.
- **Nodes.** Pure functions `(state) -> state_update`. Updates are merged into state after return.
- **Edges.** Conditional or direct transitions between nodes.
- **Entry and exit.** `START` and `END` sentinel nodes mark the boundary.

Example: an agent with `classify`, `refund`, `bug`, `sales`, `done` nodes — a routing workflow as a graph.

Every example below shares this setup — run it once, then the rest reuse `lrn_llm`. Build the routing example itself: four nodes (`classify`, `create_ticket`, `human_gate`, `send`) as pure functions that take state and return an update dict.

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

```python editable
import copy
from typing import Any

# State is a typed dict with all info the agent needs
State = dict[str, Any]

# Node function: takes state, returns an update dict
# The runner merges updates into state after each node
def classify_node(state: State) -> dict:
    """Mark that classify ran (real classify happens next)."""
    return {"step": state.get("step", 0) + 1}

def create_ticket_node(state: State) -> dict:
    """Create a ticket ID based on the route."""
    route = state.get("route", "unknown")
    ticket_id = f"{route[:3].upper()}-{abs(hash(state['input']))%1000}"
    return {"ticket_id": ticket_id, "step": state.get("step", 0) + 1}

def human_gate_node(state: State) -> dict:
    """Check if human approved; if not, pause execution."""
    if not state.get("human_approved", False):
        # Signal the runner to pause and await external input
        return {"_pause_reason": "awaiting human approval",
                "step": state.get("step", 0) + 1}
    return {"step": state.get("step", 0) + 1}

def send_node(state: State) -> dict:
    """Finalize and produce output."""
    output = f"Sent ticket {state.get('ticket_id')} ({state.get('route')}) to queue"
    return {"output": output, "step": state.get("step", 0) + 1}

print("✅ Nodes defined")
```

The `classify` node above is a stub — the real routing decision comes from the LLM. Ask it to classify customer input into exactly one of three routes:

```python editable
async def classify_with_llm(customer_input: str) -> str:
    """Use LLM to classify customer input into a route."""
    messages = [
        {"role": "user", "content": customer_input}
    ]
    system_prompt = (
        "You are a support ticket router. Classify the customer input into EXACTLY ONE category: "
        "refund, bug, or sales. Reply with only the word (e.g., 'refund'). "
        "refund: money back, charges, billing. "
        "bug: crash, error, broken. "
        "sales: pricing, quote, features."
    )
    resp = await lrn_llm.call(messages, system=system_prompt, max_tokens=10)
    route = lrn_llm.text(resp).strip().lower()
    # Validate the response
    if route not in ["refund", "bug", "sales"]:
        route = "sales"  # default fallback
    return route

# Test with a single example
test_input = "The app crashes when I try to export a PDF"
test_route = await classify_with_llm(test_input)
print(f"Input: {test_input}")
print(f"Route: {test_route}")
```

### Durable execution

After each node returns, the runtime serializes the state and writes it to a checkpointer (SQLite, Postgres, Redis, custom). On failure at step N, invoking the graph again with the same `thread_id` picks up from step N+1 with exact state.

The LangGraph docs explicitly highlight production users where this matters: Klarna, Uber, J.P. Morgan. The claim isn't the graph shape; it's that the graph shape plus checkpointing makes recovery cheap.

Concretely: a checkpointer that saves the entire state after every node.

```python editable
class InMemoryCheckpointer:
    """Simple checkpoint store: saves state after every node."""
    def __init__(self):
        self._store = {}

    def save(self, session_id: str, node_name: str, state: State) -> None:
        """Save state snapshot after node execution."""
        if session_id not in self._store:
            self._store[session_id] = []
        self._store[session_id].append((node_name, copy.deepcopy(state)))

    def load_latest(self, session_id: str) -> tuple[str, State] | None:
        """Load the most recent checkpoint for a session."""
        history = self._store.get(session_id, [])
        return history[-1] if history else None

    def history(self, session_id: str) -> list:
        """Show all checkpoints for debugging."""
        return list(self._store.get(session_id, []))

ckpt = InMemoryCheckpointer()
print("✅ Checkpointer ready")
```

### Streaming

Every node can yield partial output. The graph streams per-node-delta events to the caller so UIs update as the graph runs.

### Human-in-the-loop

Inspect and modify state between nodes. Implementations: pause before a critical node, surface state to a human, accept modifications, resume. The checkpointer makes this easy because state is already serialized.

Wire it together: a `Runner` that executes nodes in order, checkpoints after each one, and raises when a node signals it needs a human decision.

```python editable
class PausedAtNode(Exception):
    """Raised when graph pauses waiting for human input."""
    def __init__(self, node: str, state: State):
        super().__init__(node)
        self.node = node
        self.state = state

class Runner:
    """Executes the graph with checkpoint and pause/resume."""
    def __init__(self, checkpointer: InMemoryCheckpointer):
        self.checkpointer = checkpointer

    async def run(self, session_id: str, initial_state: State,
                  resume_from: str | None = None,
                  llm_classify: bool = True) -> State:
        """Run the graph: classify -> create_ticket -> human_gate -> send."""
        state = copy.deepcopy(initial_state)

        # Determine where to start
        nodes_order = ["classify", "create_ticket", "human_gate", "send"]
        start_idx = 0
        if resume_from:
            try:
                start_idx = nodes_order.index(resume_from)
            except ValueError:
                raise RuntimeError(f"Unknown node: {resume_from}")

        for node_name in nodes_order[start_idx:]:
            # Run the appropriate node
            if node_name == "classify":
                if llm_classify and "route" not in state:
                    route = await classify_with_llm(state["input"])
                    update = {"route": route, "step": state.get("step", 0) + 1}
                else:
                    update = classify_node(state)
            elif node_name == "create_ticket":
                update = create_ticket_node(state)
            elif node_name == "human_gate":
                update = human_gate_node(state)
            elif node_name == "send":
                update = send_node(state)

            # Merge update into state
            state = {**state, **update}

            # Check for pause signal and clear it before checkpointing, so a
            # resumed run that reloads this checkpoint doesn't see a stale
            # _pause_reason and immediately re-pause on the next node.
            paused = state.pop("_pause_reason", None)

            # Checkpoint after node
            self.checkpointer.save(session_id, node_name, state)

            if paused:
                raise PausedAtNode(node_name, state)

        return state

print("✅ Runner ready")
```

Run it on a real support ticket. It classifies via the LLM, creates a ticket, then pauses at the human gate because no approval is set yet:

```python editable
runner = Runner(ckpt)

session_id = "s001"
initial_state = {
    "input": "I was charged twice for my subscription last month, please refund",
    "step": 0,
    "human_approved": False
}

print("=" * 70)
print("FIRST RUN (will pause at human_gate)")
print("=" * 70)

try:
    final = await runner.run(session_id, initial_state, llm_classify=True)
    print(f"Completed: {final}")
except PausedAtNode as paused:
    print(f"\n🛑 PAUSED at node: {paused.node}")
    print(f"\nState at pause:")
    for key, value in paused.state.items():
        print(f"  {key}: {value}")
```

Every node saved a checkpoint on the way — inspect the history:

```python editable
print("\nCheckpoint history (every node saves state):")
print("-" * 70)
for i, (node_name, snap) in enumerate(ckpt.history(session_id), 1):
    print(f"Step {i}: {node_name}")
    print(f"  route={snap.get('route')} ticket_id={snap.get('ticket_id')} step={snap.get('step')}")
```

A human reviews the paused state and approves it. Resume from the checkpointed state — not the original `initial_state` — since the `Runner` doesn't reload checkpoints itself:

```python editable
print("\nHuman approves the refund ticket. Running the final step...")
print("=" * 70)

# Resume must start from the *checkpointed* state, not the original initial_state —
# the Runner doesn't reload checkpoints itself, so we load(session_id) to get the
# state as of the pause, then hand it back to the Runner to continue the pipeline.
latest_node, paused_state = ckpt.load_latest(session_id)
print(f"Last checkpoint was at: {latest_node}")

approved_state = copy.deepcopy(paused_state)
approved_state["human_approved"] = True

# Resume through the Runner itself: resume_from="send" tells it to continue the
# pipeline at the node right after human_gate, instead of restarting from classify.
approved_state = await runner.run(session_id, approved_state, resume_from="send")

print(f"\n✅ Final output: {approved_state.get('output')}")
print(f"\nFinal state summary:")
print(f"  Input: {approved_state.get('input')}")
print(f"  Route (via LLM): {approved_state.get('route')}")
print(f"  Ticket ID: {approved_state.get('ticket_id')}")
print(f"  Human approved: {approved_state.get('human_approved')}")
print(f"  Final output: {approved_state.get('output')}")
```

The full trace shows the property that matters: state serialized after every node means resume is exact — no fresh re-runs when step 38 fails, pick up at step 39.

```python editable
print("\nFull execution trace with checkpoints:")
print("=" * 70)
all_history = ckpt.history(session_id)
for i, (node_name, snap) in enumerate(all_history, 1):
    print(f"{i}. {node_name}")
    print(f"   step count: {snap.get('step')}")
    print(f"   pause? {snap.get('_pause_reason', 'no')}")

print("\n" + "=" * 70)
print("PROPERTY: State checkpoint after every node → resume is exact.")
print("No fresh re-runs when step 38 fails; pick up at step 39.")
print("=" * 70)
```

### Memory

Short-term (within a run — conversation history in state) and long-term (across runs — persistent via the checkpointer plus a separate long-term store). LangGraph integrates with external memory systems (Mem0, custom) via tools.

### Three topologies

1. **Supervisor.** Central router LLM dispatches to specialist subagents. `create_supervisor()` in `langgraph-supervisor` (though the LangChain team in 2026 recommends doing this through tool calls directly for more context control).
2. **Swarm / peer-to-peer.** Agents hand off directly via a shared tool surface. No central router.
3. **Hierarchical.** Supervisors managing sub-supervisors, implemented as nested subgraphs.

### Where this pattern goes wrong

- **Checkpoints too small.** Only checkpointing conversation turns leaves tool state and memory writes unrecoverable. Full state must serialize.
- **Non-deterministic nodes.** Resume assumes node inputs produce the same state update. Random seeds, wall-clock, external APIs must be captured.
- **Over-use of conditional edges.** A graph with every edge conditional is a state machine that cannot be reasoned about. Prefer linear chains with occasional branches.

## Try It Yourself

Change the customer input below and run the graph. Watch how the LLM classifies it differently.

```python editable
test_input = "Can you send me a quote for 50 licenses?"
print(f"Classifying: {test_input}")
test_route = await classify_with_llm(test_input)
print(f"Route: {test_route}")
print(f"\nTry changing test_input to see different classifications.")
```

## Further Reading

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — the reference docs
- [langgraph-supervisor reference](https://reference.langchain.com/python/langgraph/supervisor/) — supervisor pattern API
- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) — actor-model alternative
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) — session store and subagents

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Describe LangGraph's core model: state machine with immutable state, function nodes, conditional edges, and post-step checkpoints.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Name the four capabilities the docs highlight: durable execution, streaming, human-in-the-loop, comprehensive memory.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Explain the three orchestration topologies LangGraph supports: supervisor, peer-to-peer (swarm), hierarchical (nested subgraphs).

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Describe LangGraph's core model: state machine with immutable state, function nodes, conditional edges, and post-step checkpoints,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Explain the three orchestration topologies LangGraph supports: supervisor, peer-to-peer (swarm), hierarchical (nested subgraphs),” and cite a repeatable check rather than relying on visual inspection alone.
