# OpenAI Agents SDK: Handoffs, Guardrails, Tracing

> OpenAI Agents SDK is the lightweight multi-agent framework built on the Responses API. Five primitives: Agent, Handoff, Guardrail, Session, Tracing. Handoffs are tools named `transfer_to_<agent>`. Guardrails trip on input or output. Tracing is on by default.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## Learning Objectives

- Name the five primitives of the OpenAI Agents SDK.
- Explain handoffs: why they are modeled as tools, what name shape the model sees, and how context transfers.
- Distinguish input guardrails, output guardrails, and tool guardrails; explain `run_in_parallel` vs blocking mode.
- Implement a stdlib runtime with handoffs + guardrails + span-style tracing.

## The Problem

Agents that cannot delegate cleanly end up stuffing everything into one prompt. Agents without guardrails ship PII, policy-violating output, or loop forever. OpenAI's SDK codifies the three primitives that make multi-agent work tractable.

## The Concept

### Five primitives

1. **Agent.** LLM + instructions + tools + handoffs.
2. **Handoff.** Delegation to another agent. Represented to the model as a tool named `transfer_to_<agent_name>`.
3. **Guardrail.** Validation on input (first agent only), output (last agent only), or tool invocation (per function tool).
4. **Session.** Automatic conversation history across turns.
5. **Tracing.** Built-in spans for LLM generations, tool calls, handoffs, guardrails.

Every example below shares this setup — run it once, then the rest reuse `lrn_llm`. Then define the primitives themselves as stdlib types: an `Agent` bundling instructions/tools/handoffs, a `Handoff` exposing its `transfer_to_<target>` tool name, a `Tool`, and the exception a tripped guardrail raises.

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
class Agent:
    """An agent: name, instructions, and tools/handoffs it can use."""
    name: str
    instructions: str
    tools: list['Tool'] = field(default_factory=list)
    handoffs: list['Handoff'] = field(default_factory=list)

@dataclass
class Handoff:
    """Delegation to another agent. The model sees it as a tool named transfer_to_<target>."""
    target: Agent

    @property
    def tool_name(self) -> str:
        return f"transfer_to_{self.target.name}"

@dataclass
class Tool:
    """A function tool the agent can call."""
    name: str
    description: str
    fn: Callable[..., str]

@dataclass
class GuardrailTripped(Exception):
    """Raised when a guardrail blocks input or output."""
    which: str  # 'input' or 'output'
    reason: str

print("✅ Agent SDK primitives defined")
```

### Handoffs as tools

The model sees `transfer_to_billing_agent` in its tool list. Calling it signals the runtime to:

1. Copy the conversation context (or collapse it via `nest_handoff_history` beta).
2. Initialize the target agent with its instructions.
3. Continue the run with the target agent.

This is the supervisor pattern (Lesson 13 / Lesson 28) productized.

Concretely: a triage agent that hands off to a billing specialist or a support specialist.

```python editable
# Create the specialized agents (no tools for now, just handoffs/instructions)
billing_agent = Agent(
    name="billing",
    instructions="You handle refunds, invoices, and billing questions. Be helpful and professional."
)

support_agent = Agent(
    name="support",
    instructions="You handle bug reports, crashes, and technical errors. Be clear and supportive."
)

# Triage agent can handoff to both
triage_agent = Agent(
    name="triage",
    instructions="You are a customer service triage agent. Route queries to the right specialist. If the customer asks about refunds, invoices, or billing, handoff to billing. If they ask about bugs, crashes, or technical errors, handoff to support. Otherwise, try to help.",
    handoffs=[
        Handoff(target=billing_agent),
        Handoff(target=support_agent)
    ]
)

print("✅ Three agents created (triage, billing, support)")
print(f"   Triage can handoff to: {[h.tool_name for h in triage_agent.handoffs]}")
```

### Guardrails

Three flavors:

- **Input guardrails.** Run on the first agent's input. Reject unsafe or out-of-scope requests before any LLM call.
- **Output guardrails.** Run on the last agent's output. Catch PII leaks, policy violations, malformed responses.
- **Tool guardrails.** Run per-function-tool. Validate arguments, check permissions, audit execution.

Mode:

- **Parallel** (default). Guardrail LLM runs alongside the main LLM. Lower tail latency. If tripped, the main LLM's work is discarded (token waste).
- **Blocking** (`run_in_parallel=False`). Guardrail LLM runs first. If tripped, no tokens wasted on the main call.

Tripwires raise `InputGuardrailTripwireTriggered` / `OutputGuardrailTripwireTriggered`.

Wrap each flavor as a checkable type, and add a `Span` type alongside them — the runner needs both to check guardrails and to emit a trace tree.

```python editable
@dataclass
class InputGuardrail:
    """Validates user input before passing to the first agent."""
    name: str
    check: Callable[[str], tuple[bool, str]]  # returns (passed, reason)

@dataclass
class OutputGuardrail:
    """Validates the final output before returning to the user."""
    name: str
    check: Callable[[str], tuple[bool, str]]

@dataclass
class Span:
    """A trace span (LLM call, tool, handoff, guardrail)."""
    name: str
    attributes: dict[str, Any] = field(default_factory=dict)
    children: list['Span'] = field(default_factory=list)

print("✅ Guardrails and tracing types defined")
```

Concrete guardrails: block inputs mentioning PII keywords, and cap output length.

```python editable
def check_pii_input(text: str) -> tuple[bool, str]:
    """Block inputs that mention sensitive info (SSN, credit card)."""
    dangerous = ["ssn", "social security", "credit card", "ccn"]
    if any(d in text.lower() for d in dangerous):
        return False, "refuses: input contains PII keywords"
    return True, "ok"

def check_output_length(text: str) -> tuple[bool, str]:
    """Ensure output doesn't exceed 300 characters."""
    if len(text) > 300:
        return False, f"output too long: {len(text)} > 300 chars"
    return True, f"ok: {len(text)} chars"

print("✅ Guardrails defined")
```

### Tracing

On by default. Every LLM generation, tool call, handoff, and guardrail emits a span. `OPENAI_AGENTS_DISABLE_TRACING=1` opts out. `add_trace_processor(processor)` fans spans to your own backend alongside OpenAI's.

The `Runner` ties all of it together: input guardrails, the handoff loop (calling the LLM to decide final answer vs. handoff), output guardrails, and a span tree recording every step.

```python editable
@dataclass
class Runner:
    """Orchestrates the multi-agent handoff loop with guardrails and tracing."""
    input_guardrails: list[InputGuardrail] = field(default_factory=list)
    output_guardrails: list[OutputGuardrail] = field(default_factory=list)
    max_hops: int = 3
    trace: Span = field(default_factory=lambda: Span(name="run"))

    async def run(self, agent: Agent, user_input: str) -> str:
        """Run an agent with handoff support, guardrails, and tracing."""
        # Check input guardrails
        for guard in self.input_guardrails:
            ok, reason = guard.check(user_input)
            span = Span(name=f"input_guardrail.{guard.name}",
                        attributes={"passed": ok, "reason": reason})
            self.trace.children.append(span)
            if not ok:
                raise GuardrailTripped(which="input", reason=reason)

        current_agent = agent
        current_input = user_input
        final_output = ""

        # Agent loop with handoff support
        for hop in range(self.max_hops):
            agent_span = Span(name=f"agent.{current_agent.name}",
                              attributes={"hop": hop,
                                          "instructions": current_agent.instructions[:50]})
            self.trace.children.append(agent_span)

            # Call the LLM to decide: final answer, tool call, or handoff?
            decision = await self._get_agent_decision(current_agent, current_input)
            kind = decision.get("kind")

            if kind == "final":
                final_output = decision["text"]
                agent_span.children.append(
                    Span(name="llm_generation",
                         attributes={"output": final_output[:80]})
                )
                break
            elif kind == "handoff":
                target_name = decision["to"]
                handoff = next((h for h in current_agent.handoffs
                                if h.target.name == target_name), None)
                if handoff is None:
                    final_output = f"error: no handoff to {target_name}"
                    break
                agent_span.children.append(
                    Span(name=f"handoff.{handoff.tool_name}",
                         attributes={"from": current_agent.name, "to": target_name})
                )
                current_agent = handoff.target
                current_input = decision.get("input", current_input)
                continue
            else:
                final_output = f"error: unexpected decision kind {kind}"
                break

        # Check output guardrails
        for guard in self.output_guardrails:
            ok, reason = guard.check(final_output)
            span = Span(name=f"output_guardrail.{guard.name}",
                        attributes={"passed": ok, "reason": reason})
            self.trace.children.append(span)
            if not ok:
                raise GuardrailTripped(which="output", reason=reason)

        return final_output

    async def _get_agent_decision(self, agent: Agent, user_input: str) -> dict[str, Any]:
        """Ask the LLM: final answer, tool call, or handoff?"""
        # Build the tool list from handoffs
        handoff_tools = [
            {"type": "function", "function": {"name": h.tool_name,
                                                 "description": f"Transfer to {h.target.name} agent"}}
            for h in agent.handoffs
        ]

        system = agent.instructions + "\n\nRespond with exactly one JSON line: {\"kind\": \"final\", \"text\": \"..\"} for a final answer, or {\"kind\": \"handoff\", \"to\": \"<agent_name>\", \"input\": \"..\"} to transfer."

        r = await lrn_llm.call(
            [{"role": "user", "content": user_input}],
            system=system,
            max_tokens=200
        )
        text = lrn_llm.text(r).strip()

        # Parse the LLM's JSON decision
        try:
            decision = json.loads(text)
            return decision
        except json.JSONDecodeError:
            # Fallback: treat as final answer
            return {"kind": "final", "text": text}

print("✅ Runner with LLM-based decision-making defined")
```

Wire it up with the guardrails from above, and run it on a billing query — watch it decide whether to handoff or answer directly:

```python editable
runner = Runner(
    input_guardrails=[
        InputGuardrail("pii_block", check_pii_input)
    ],
    output_guardrails=[
        OutputGuardrail("length_cap", check_output_length)
    ],
    max_hops=3
)

print("✅ Runner created with:")
print(f"   Input guardrails: {[g.name for g in runner.input_guardrails]}")
print(f"   Output guardrails: {[g.name for g in runner.output_guardrails]}")
print(f"   Max hops: {runner.max_hops}")
```

```python editable
test_input = "I need a refund for invoice 4711 from last month."
print(f"User: {test_input}\n")

runner.trace = Span(name="run", attributes={"user_input": test_input[:60]})

try:
    output = await runner.run(triage_agent, test_input)
    print(f"✅ Final response:")
    print(f"{output}")
except GuardrailTripped as e:
    print(f"❌ GUARDRAIL TRIPPED ({e.which}): {e.reason}")
```

The span tree shows every LLM call, handoff, and guardrail check — the observability foundation:

```python editable
def print_trace(span: Span, indent: int = 0) -> None:
    """Pretty-print the trace tree."""
    prefix = "  " * indent + "┣ " if indent > 0 else ""
    attrs = " | ".join(f"{k}={v!r}" for k, v in span.attributes.items())
    attr_str = f" ({attrs})" if attrs else ""
    print(f"{prefix}{span.name}{attr_str}")
    for child in span.children:
        print_trace(child, indent + 1)

print("Trace tree:")
print_trace(runner.trace)
```

### Sessions

`Session` stores conversation history in a backend (SQLite, Redis, custom). `Runner.run(agent, input, session=session)` auto-loads and appends.

### Where this pattern goes wrong

- **Handoff drift.** Agent A hands off to Agent B which hands back to Agent A. Add a hop counter.
- **Guardrail bypass.** Tool guardrails only fire on function tools; built-in tools (file reader, web fetch) need separate policy.
- **Over-tracing.** Sensitive content in spans. Pair with OTel GenAI content-capture rules (Lesson 23) — store externally, reference by ID.

## Try It Yourself

First, a query that trips the PII input guardrail before any LLM call happens:

```python editable
bad_input = "can you confirm my ssn for my account?"
print(f"User: {bad_input}\n")

runner.trace = Span(name="run", attributes={"user_input": bad_input[:60]})

try:
    output = await runner.run(triage_agent, bad_input)
    print(f"Final response: {output}")
except GuardrailTripped as e:
    print(f"❌ GUARDRAIL TRIPPED ({e.which}): {e.reason}")
    print("\nTrace (showing the blocked guardrail):")
    print_trace(runner.trace)
```

Now a technical query, which should handoff to the support agent instead of billing:

```python editable
support_input = "The app keeps crashing when I open the settings menu. Any fix?"
print(f"User: {support_input}\n")

runner.trace = Span(name="run", attributes={"user_input": support_input[:60]})

try:
    output = await runner.run(triage_agent, support_input)
    print(f"✅ Final response:")
    print(f"{output}")
    print("\nTrace:")
    print_trace(runner.trace)
except GuardrailTripped as e:
    print(f"❌ GUARDRAIL TRIPPED ({e.which}): {e.reason}")
```

Now change the scenario yourself — try a billing question, a support issue, or something out of scope, and watch the trace:

```python editable
# TODO: Change this to test a different customer query
# Try variations: billing questions, support issues, out-of-scope requests
custom_input = "I can't log in to my account. I've tried resetting my password but it's not working."

print(f"Testing custom input: {custom_input}\n")
runner.trace = Span(name="run", attributes={"user_input": custom_input[:60]})

try:
    result = await runner.run(triage_agent, custom_input)
    print(f"✅ Result:\n{result}")
    print("\nTrace:")
    print_trace(runner.trace)
except GuardrailTripped as e:
    print(f"❌ Guardrail blocked ({e.which}): {e.reason}")
```

## Further Reading

- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) — primitives, handoffs, guardrails, tracing
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) — Claude-flavored counterpart
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — when to reach for handoffs at all
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — the standard Agents SDK spans map to

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Name the five primitives of the OpenAI Agents SDK.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Explain handoffs: why they are modeled as tools, what name shape the model sees, and how context transfers.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Distinguish input guardrails, output guardrails, and tool guardrails; explain `run_in_parallel` vs blocking mode.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Name the five primitives of the OpenAI Agents SDK,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Distinguish input guardrails, output guardrails, and tool guardrails; explain `run_in_parallel` vs blocking mode,” and cite a repeatable check rather than relying on visual inspection alone.
