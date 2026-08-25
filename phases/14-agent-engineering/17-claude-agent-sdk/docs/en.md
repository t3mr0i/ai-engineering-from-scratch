# Claude Agent SDK: Subagents and Session Store

> The Claude Agent SDK is the library form of the Claude Code harness. Built-in tools, subagents for context isolation, hooks, W3C trace propagation, session store parity. Claude Managed Agents is the hosted alternative for long-running async work.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 10 (Skill Libraries)
**Time:** ~75 minutes

## Learning Objectives

- Explain the difference between the Anthropic Client SDK (raw API) and the Claude Agent SDK (harness shape).
- Describe subagents — parallelization and context isolation — and when to reach for them.
- Name the Python SDK's session store surface (`append`, `load`, `list_sessions`, `delete`, `list_subkeys`) and how to capture a session transcript to a file for debugging.
- Implement a stdlib harness with built-in tools, subagent spawning with isolated context, lifecycle hooks, and a session store.

## The Problem

A raw LLM API gets you one round-trip. A production agent needs tool execution, MCP servers, lifecycle hooks, subagent spawning, session persistence, trace propagation. Claude Agent SDK ships this shape as a library — the same harness Claude Code uses, exposed for custom agents.

## The Concept

### Client SDK vs Agent SDK

- **Client SDK (`anthropic`).** Raw Messages API. You own the loop, the tools, the state.
- **Agent SDK (`claude-agent-sdk`).** Built-in tool execution, MCP connections, hooks, subagent spawning, session store. The Claude Code loop as a library.

### Built-in tools

The SDK ships 10+ tools out of the box: file read/write, shell, grep, glob, web fetch, more. Custom tools register via the standard tool-schema interface.

Every example below shares this setup — run it once, then the rest reuse `lrn_llm`. Then build the harness's foundational types: a `Tool`/`ToolRegistry` for built-in tools, a `Turn`/`SessionStore` for conversation history (used by the session store below), `Hooks` for lifecycle callbacks, and `AgentRun` to record one run.

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
from dataclasses import dataclass, field
from typing import Any, Callable

@dataclass
class Tool:
    name: str
    description: str
    fn: Callable[..., str]

class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool) -> None:
        self._tools[tool.name] = tool

    def get(self, name: str) -> Tool | None:
        return self._tools.get(name)

    def names(self) -> list[str]:
        return sorted(self._tools)

@dataclass
class Turn:
    role: str  # "user", "assistant", "tool"
    content: str

class SessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, list[Turn]] = {}
        self._subkeys: dict[str, list[str]] = {}

    def append(self, session_id: str, turn: Turn) -> None:
        self._sessions.setdefault(session_id, []).append(turn)

    def load(self, session_id: str) -> list[Turn]:
        return list(self._sessions.get(session_id, []))

    def list_sessions(self) -> list[str]:
        return sorted(self._sessions)

    def list_subkeys(self, session_id: str) -> list[str]:
        return list(self._subkeys.get(session_id, []))

    def link_sub(self, parent: str, sub: str) -> None:
        self._subkeys.setdefault(parent, []).append(sub)

    def delete(self, session_id: str) -> list[str]:
        """Cascade delete a session and its linked subagent sessions."""
        removed: list[str] = []
        for sub in self._subkeys.get(session_id, []):
            removed.extend(self.delete(sub))
        self._subkeys.pop(session_id, None)
        if self._sessions.pop(session_id, None) is not None:
            removed.append(session_id)
        return removed

print("✅ Core components (Tool, ToolRegistry, Turn, SessionStore) defined")
```

Two built-in tools the agent can call: read a file, list a directory.

```python editable
def read_file(path: str) -> str:
    """Mock: simulate reading a file and returning its code summary."""
    summaries = {
        "a.py": "Module A: utility functions for data validation (120 lines)",
        "b.py": "Module B: HTTP request handlers (150 lines, needs refactor)",
        "c.py": "Module C: cache layer with TTL support (90 lines)"
    }
    return summaries.get(path, f"File {path} not found")

def list_dir(path: str) -> str:
    """Mock: list files in a directory."""
    if path == "/project":
        return "a.py, b.py, c.py, tests/, README.md"
    return f"Directory {path} not found"

tools = ToolRegistry()
tools.register(Tool("read_file", "Read and summarize a Python file", read_file))
tools.register(Tool("list_dir", "List files in a directory", list_dir))

print(f"✅ Tools registered: {tools.names()}")
```

Lifecycle hooks audit tool calls and session events — the mechanism for cross-cutting behavior like logging, rate-limiting, and auditing:

```python editable
@dataclass
class Hooks:
    pre_tool_use: list[Callable[[str, dict[str, Any]], None]] = field(default_factory=list)
    post_tool_use: list[Callable[[str, str], None]] = field(default_factory=list)
    session_start: list[Callable[[str], None]] = field(default_factory=list)
    session_end: list[Callable[[str], None]] = field(default_factory=list)

@dataclass
class AgentRun:
    session_id: str
    tool_calls: list[tuple[str, str]] = field(default_factory=list)
    output: str = ""

hook_log: list[str] = []

hooks = Hooks(
    pre_tool_use=[lambda name, args: hook_log.append(f"▸ pre[{name}]: {args}")],
    post_tool_use=[lambda name, result: hook_log.append(f"▸ post[{name}]: {result[:40]}...")],
    session_start=[lambda s: hook_log.append(f"→ session_start[{s}]")],
    session_end=[lambda s: hook_log.append(f"← session_end[{s}]")],
)

print("✅ Hooks configured (pre_tool_use, post_tool_use, session lifecycle)")
```

### Subagents

Two purposes documented by Anthropic:

1. **Parallelization.** Run independent work concurrently. "Find the test file for each of these 20 modules" is 20 parallel subagent tasks.
2. **Context isolation.** Subagents use their own context window; only results return to the orchestrator. The orchestrator's budget is preserved.

Python SDK recent additions: `list_subagents()`, `get_subagent_messages()` for reading subagent transcripts.

The `Harness` ties the pieces together: it dispatches tool calls through the hooks, runs one agent (orchestrator or subagent), and spawns subagents with their own session — context isolation, since only results return to the caller.

```python editable
class Harness:
    def __init__(self, tools: ToolRegistry, hooks: Hooks, store: SessionStore) -> None:
        self.tools = tools
        self.hooks = hooks
        self.store = store
        self._sub_counter = 0

    def _dispatch(self, tool_name: str, args: dict[str, Any]) -> str:
        """Execute a tool call with hook lifecycle."""
        for hook in self.hooks.pre_tool_use:
            hook(tool_name, args)
        tool = self.tools.get(tool_name)
        if tool is None:
            result = f"error: unknown tool {tool_name!r}"
        else:
            try:
                result = tool.fn(**args)
            except Exception as e:
                result = f"error: {type(e).__name__}: {e}"
        for hook in self.hooks.post_tool_use:
            hook(tool_name, result)
        return result

    def run_agent(self, session_id: str, prompt: str,
                  tool_calls: list[tuple[str, dict[str, Any]]],
                  parent_session: str | None = None) -> AgentRun:
        """Run an agent (orchestrator or subagent) with a prompt and tool calls."""
        for hook in self.hooks.session_start:
            hook(session_id)
        if parent_session is not None:
            self.store.link_sub(parent_session, session_id)

        run = AgentRun(session_id=session_id)
        self.store.append(session_id, Turn("user", prompt))

        for tool_name, args in tool_calls:
            result = self._dispatch(tool_name, args)
            run.tool_calls.append((tool_name, result))
            self.store.append(session_id, Turn("tool", f"{tool_name}: {result}"))

        output = f"processed {len(tool_calls)} tools for {session_id}"
        run.output = output
        self.store.append(session_id, Turn("assistant", output))

        for hook in self.hooks.session_end:
            hook(session_id)
        return run

    def spawn_subagents(self, parent_session: str,
                        tasks: list[tuple[str, list[tuple[str, dict[str, Any]]]]]
                        ) -> list[AgentRun]:
        """Spawn multiple subagents in parallel (context isolation)."""
        runs: list[AgentRun] = []
        for prompt, tool_calls in tasks:
            self._sub_counter += 1
            sub_session = f"{parent_session}.sub{self._sub_counter:02d}"
            run = self.run_agent(sub_session, prompt, tool_calls,
                                 parent_session=parent_session)
            runs.append(run)
        return runs

store = SessionStore()
harness = Harness(tools, hooks, store)
print("✅ Harness ready (dispatch, run_agent, spawn_subagents)")
```

The orchestrator starts by calling `list_dir` to see what's available:

```python editable
# Orchestrator: list the project directory
parent = "session_main"
print("🚀 Orchestrator starts")

orchestrator_run = harness.run_agent(
    parent,
    "List the Python files in /project",
    [("list_dir", {"path": "/project"})],
)
print(f"  session: {orchestrator_run.session_id}")
print(f"  tool_calls: {len(orchestrator_run.tool_calls)}")
print(f"  output: {orchestrator_run.output}")
```

Now spawn 3 subagents to review each module independently. Each gets its own session ID (`session_main.sub01`, ...), its own context budget not charged to the orchestrator, and reads one file with the `read_file` tool:

```python editable
print("\n🔀 Spawn 3 subagents (context isolation)")
sub_runs = harness.spawn_subagents(parent, [
    ("Review module a", [("read_file", {"path": "a.py"})]),
    ("Review module b", [("read_file", {"path": "b.py"})]),
    ("Review module c", [("read_file", {"path": "c.py"})]),
])

for run in sub_runs:
    print(f"  {run.session_id:20} tool_calls={len(run.tool_calls)}  output={run.output[:30]}")
```

Gather each subagent's result from the session store, then ask the LLM to synthesize them into one report — only the results cross back to the orchestrator, not the subagents' full context:

```python editable
# Gather subagent results
reviews = []
for run in sub_runs:
    turns = store.load(run.session_id)
    tool_result = next((t.content for t in turns if t.role == "tool"), "(no result)")
    reviews.append(f"- {run.session_id}: {tool_result}")

reviews_text = "\n".join(reviews)
print("📋 Subagent results:")
print(reviews_text)
```

```python editable
prompt = f"""You have reviewed 3 Python modules. Here are the summaries from each review:

{reviews_text}

Provide a brief technical summary (2-3 sentences) of the codebase quality and any recommendations."""

response = await lrn_llm.call(
    [{"role": "user", "content": prompt}],
    max_tokens=200
)

summary = lrn_llm.text(response)
print("\n📊 LLM Synthesis:")
print(summary)
```

### Session store

Protocol parity with TypeScript:

- `append(session_id, message)` — add a turn.
- `load(session_id)` — restore conversation.
- `list_sessions()` — enumerate.
- `delete(session_id)` — with cascade to subagent sessions.
- `list_subkeys(session_id)` — list subagent keys.

There is no dedicated "mirror transcript" flag; `--output-format stream-json` redirected to a file captures the transcript as it streams, and `--debug-file` writes diagnostic logs to a file.

The store persists every turn across the orchestrator and its subagents. `list_sessions()` shows all sessions, `list_subkeys()` shows the subagent tree, and deleting the parent cascades to its subagents:

```python editable
print("📚 Session Store")
print(f"  Total sessions: {len(store.list_sessions())}")
for sid in store.list_sessions():
    turns = store.load(sid)
    print(f"  {sid:25} turns={len(turns)}")

print(f"\n  Subagents of {parent}: {store.list_subkeys(parent)}")

print("\n  Cascade delete parent...")
store.delete(parent)
print(f"  Remaining sessions: {store.list_sessions()}")
```

### Hooks

Lifecycle hooks you can register:

- `PreToolUse`, `PostToolUse` — gate or audit tool calls.
- `SessionStart`, `SessionEnd` — set up and tear down.
- `UserPromptSubmit` — act on user input before the model sees it.
- `PreCompact` — run before context compaction.
- `Stop` — cleanup on agent exit.
- `Notification` — side-channel alerts.

Hooks are how pro-workflow (Phase 14 curriculum reference) and similar systems add cross-cutting behavior.

Every `pre_tool_use`/`post_tool_use`/`session_start`/`session_end` call above landed in `hook_log` — the audit trail for compliance, performance debugging, and cost tracking:

```python editable
print("🪝 Hook Events (first 15):")
for i, event in enumerate(hook_log[:15], 1):
    print(f"  {i:2}. {event}")
if len(hook_log) > 15:
    print(f"  ... {len(hook_log) - 15} more events")
print(f"\n  Total hook events: {len(hook_log)}")
```

### W3C trace context

OTel spans active on the caller propagate into the CLI subprocess via W3C trace context headers. The whole multi-process trace shows up as one trace in your backend.

### Claude Managed Agents

The hosted alternative (beta header `managed-agents-2026-04-01`). Long-running async work, built-in prompt caching, built-in compaction. Trade control for managed infrastructure.

### Where this pattern goes wrong

- **Subagent over-spawn.** Spawning 100 subagents for 100 tiny tasks. Overhead dominates. Batch instead.
- **Hook creep.** Every team adds hooks; startup time balloons. Review hooks quarterly.
- **Session bloat.** Sessions accumulate; size grows. Use `list_sessions` + expiry policy.

## Try It Yourself

Modify the prompt below to ask the LLM a different question about the three modules — try changing the number of subagents, or asking which module needs the most test coverage.

```python editable
custom_prompt = """Given modules for data validation (a.py), HTTP handlers (b.py), and caching (c.py),
which module is most critical to test first? Explain your reasoning in 2 sentences."""

response = await lrn_llm.call(
    [{"role": "user", "content": custom_prompt}],
    max_tokens=150
)

result = lrn_llm.text(response)
print("🎯 Custom Query Result:")
print(result)
```

## Build It

Reconstruct **Claude Agent SDK: Subagents and Session Store** by following `call` on the text "red fox". Run `python3 main.py` and verify that the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text.

## Use It

Call `call` from a small caller with the text "red fox". Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-claude-agent-scaffold.md` with the command `python3 main.py`, the accepted input shape (the text "red fox"), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) — the library form of Claude Code
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) — production patterns
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) — hosted alternative
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) — counterpart

## Exercises

This lab follows `call` and `text` on a controlled fixture; write down the value before changing the input.

1. **Trace the canonical fixture.** From `code/`, run `python3 main.py` using the text "red fox". Follow `call`, `text`, `usage`. Expect the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the difference between the Anthropic Client SDK (raw API) and the Claude Agent SDK (harness shape).**.
2. **Change the controlled parameter.** Repeat the command after changing only the input text: use the text "red fox runs". Predict the direction of the change, then compare the two output values. Explain why **Describe subagents — parallelization and context isolation — and when to reach for them.** says the other inputs should stay fixed.
3. **Exercise the guard.** Feed the implementation an empty string. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Name the Python SDK's session store surface (`append`, `load`, `list_sessions`, `delete`, `list_subkeys`) and how to capture a session transcript to a file for debugging.** and record the exception text if the code rejects the case.
4. **Prepare the artifact for reuse.** Open `outputs/skill-claude-agent-scaffold.md` and add a worked example using the text "red fox". Include the input contract, one expected output field, and a named acceptance check for **Implement a stdlib harness with built-in tools, subagent spawning with isolated context, lifecycle hooks, and a session store.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Claude Agent SDK: Subagents and Session Store** should contain:

- the `python3 main.py` output for the text "red fox", with `call`, `text`, `usage` traced to the value or shape that supports **Explain the difference between the Anthropic Client SDK (raw API) and the Claude Agent SDK (harness shape).**;
- a before/after comparison for the input text, where the text "red fox runs" changes the observation in the direction predicted by **Describe subagents — parallelization and context isolation — and when to reach for them.**;
- a recorded result for an empty string that matches the implementation’s validation or empty-result contract and explains the evidence for **Name the Python SDK's session store surface (`append`, `load`, `list_sessions`, `delete`, `list_subkeys`) and how to capture a session transcript to a file for debugging.**; and
- an updated `outputs/skill-claude-agent-scaffold.md` example with a concrete input, expected output field, and acceptance check tied to **Implement a stdlib harness with built-in tools, subagent spawning with isolated context, lifecycle hooks, and a session store.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
