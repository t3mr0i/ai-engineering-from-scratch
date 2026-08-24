# Role Specialization — Planner, Critic, Executor, Verifier

> A common multi-agent decomposition assigns planning, execution, and verification to separate roles. [MetaGPT](https://arxiv.org/abs/2308.00352) encodes software SOPs into role prompts; [ChatDev](https://arxiv.org/abs/2307.07924) chains designer, programmer, reviewer, and tester through a chat chain; [MAST](https://arxiv.org/abs/2503.13657) provides an empirical taxonomy that includes verification failures. These papers motivate the verifier role without implying a universal accuracy multiplier.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 16 · 04 (Primitive Model), Phase 16 · 05 (Supervisor)
**Time:** ~60 minutes

## Learning Objectives

- Explain the coordination mechanism behind Role Specialization — Planner, Critic, Executor, Verifier
- Implement the central multi-agent interaction from first principles
- Trace messages, shared state, and verification decisions end to end
- Evaluate coordination quality, cost, and correlated failure modes

## Problem

Generic multi-agent systems produce generic output. Three coders in a group chat write three flavors of the same mediocre code. You can add more agents, add more rounds, and still not cross the quality threshold.

The fix is not more agents — it is *different* agents. Assign distinct roles. Give the critic tools the planner does not have. Give the verifier an objective test suite. Now the system has internal disagreement with grounded correction, not just parallel guessing.

## Concept

### The four canonical roles

**Planner.** Reads the goal, produces a step list or a spec. Tools: knowledge retrieval, docs. Output: structured plan.

**Executor.** Reads one plan step at a time, produces the artifact. Tools: the actual work tools (code compiler, shell, API client). Output: the artifact.

**Critic.** Reads the executor's output against the planner's intent. Tools: read-only access to the artifact, static analysis. Output: accept/reject with reasons.

**Verifier.** Reads the artifact and runs a deterministic check. Tools: test runner, type checker, schema validator. Output: pass/fail with evidence.

Critic is subjective, opinionated, often LLM-based. Verifier is objective, deterministic, often code-based. They are not the same role.

Every example below shares this setup — run it once, then the rest reuse `lrn_llm`. Build a 4-role pipeline that turns a user wish into Python code: the types that flow planner → executor → critic → verifier first.

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
import json

@dataclass
class Spec:
    task_name: str
    signature: str
    description: str
    tests: list

@dataclass
class CriticReport:
    approved: bool
    notes: list = field(default_factory=list)

@dataclass
class VerifierReport:
    passed: bool
    failures: list = field(default_factory=list)

print("✅ Role data structures defined")
```

The planner reads a user's wish and produces a structured spec — name, signature, description, and test cases — using the LLM to interpret intent:

```python editable
async def planner_llm(user_wish: str) -> Spec:
    """Planner uses LLM to produce a structured spec from a user wish."""
    prompt = f"""You are a code specification writer. Given a user wish, produce a JSON spec with:
- task_name: a Python-friendly function name
- signature: Python function signature (with type hints)
- description: one-sentence summary
- tests: array of [inputs_array, expected_output] pairs (2-3 test cases)

User wish: {user_wish}

Reply with only valid JSON, no markdown, no explanation."""

    r = await lrn_llm.call([{"role": "user", "content": prompt}], max_tokens=200)
    text = lrn_llm.text(r)
    spec_dict = json.loads(text)
    return Spec(
        task_name=spec_dict["task_name"],
        signature=spec_dict["signature"],
        description=spec_dict["description"],
        tests=spec_dict["tests"]
    )

# Demo: planner interprets "add two numbers"
spec = await planner_llm("Write a function that returns the sum of two integers.")
print(f"Spec produced:")
print(f"  task_name: {spec.task_name}")
print(f"  signature: {spec.signature}")
print(f"  description: {spec.description}")
print(f"  tests: {spec.tests}")
```

The executor reads the spec and generates Python code matching the signature:

```python editable
def _signature_tail(signature: str) -> str:
    """Extract the "(...) -> ret" tail of a signature structurally (from the
    first "(" onward), rather than splitting on task_name — the planner LLM
    generates task_name and signature independently, so the name is not
    guaranteed to appear verbatim inside the signature string."""
    sig_tail = signature[signature.find("("):].strip()
    if sig_tail.endswith(":"):
        sig_tail = sig_tail[:-1]
    return sig_tail

async def executor_llm(spec: Spec) -> str:
    """Executor uses LLM to generate Python code matching the spec."""
    prompt = f"""You are a Python code generator. Write ONLY the function body, matching this spec:

Function signature: {spec.signature}
Description: {spec.description}
Test cases (inputs → expected): {spec.tests}

Reply with ONLY the code (no markdown, no explanation, no def line), just the function body.
Example output:
    return a + b

Now generate code for this spec:"""

    r = await lrn_llm.call([{"role": "user", "content": prompt}], max_tokens=150)
    code_body = lrn_llm.text(r).strip()
    # Wrap in function definition using the shared signature-tail helper.
    sig_tail = _signature_tail(spec.signature)
    code = f"def {spec.task_name}{sig_tail}:\n    {code_body.replace(chr(10), chr(10)+'    ')}"
    return code

# Demo: executor generates code for our spec
code = await executor_llm(spec)
print("Generated code:")
print(code)
```

The critic reviews the code for style and obvious structural issues — fast and opinionated, but it can be fooled by plausible-looking code that is semantically wrong:

```python editable
async def critic_llm(spec: Spec, code: str) -> CriticReport:
    """Critic uses LLM to review code for style and obvious issues."""
    prompt = f"""You are a code reviewer. Review this code against the spec:

Spec: {spec.signature}
Description: {spec.description}

Code:
{code}

List any issues (e.g., style, missing edge cases, syntax, clarity). Be brief. Reply JSON:
{{
  "approved": true/false,
  "notes": ["issue1", "issue2", ...]
}}

Reply with ONLY JSON, no explanation."""

    r = await lrn_llm.call([{"role": "user", "content": prompt}], max_tokens=100)
    text = lrn_llm.text(r)
    review = json.loads(text)
    return CriticReport(approved=review["approved"], notes=review.get("notes", []))

# Demo: critic reviews the generated code
critic_report = await critic_llm(spec, code)
print(f"Critic report:")
print(f"  approved: {critic_report.approved}")
print(f"  notes: {critic_report.notes}")
```

The verifier runs the code in a sandbox against the test cases — slow, but it cannot be fooled: if a test fails, it fails objectively:

```python editable
def verifier_deterministic(spec: Spec, code: str) -> VerifierReport:
    """Verifier runs the code in a sandbox and executes the tests."""
    ns = {}
    try:
        exec(code, ns, ns)
    except Exception as e:
        return VerifierReport(passed=False, failures=[f"exec error: {e}"])

    fn = ns.get(spec.task_name)
    if not callable(fn):
        return VerifierReport(passed=False, failures=[f"no callable '{spec.task_name}' produced"])

    failures = []
    for test_case in spec.tests:
        # Test cases may arrive as [inputs, expected] pairs (the spec format)
        # or as {"inputs": ..., "expected": ...} dicts, depending on the LLM.
        # Normalize both so indexing never raises KeyError.
        if isinstance(test_case, dict):
            args = test_case.get("inputs", test_case.get("input", test_case.get("args")))
            expected = test_case.get("expected", test_case.get("output", test_case.get("expected_output")))
        else:
            args, expected = test_case[0], test_case[1]
        try:
            got = fn(*args) if isinstance(args, list) else fn(args)
        except Exception as e:
            failures.append(f"call {args} raised {type(e).__name__}: {e}")
            continue
        if got != expected:
            failures.append(f"call {args}: expected {expected}, got {got}")

    return VerifierReport(passed=not failures, failures=failures)

# Demo: verifier tests the generated code
verifier_report = verifier_deterministic(spec, code)
print(f"Verifier report:")
print(f"  passed: {verifier_report.passed}")
print(f"  failures: {verifier_report.failures}")
```

Now the full pipeline, end to end:

```python editable
async def run_pipeline(user_wish: str, label: str):
    """Run the full planner → executor → critic → verifier pipeline."""
    print(f"\n=== {label} ===")

    # Planner
    spec = await planner_llm(user_wish)
    print(f"[planner] spec: {spec.signature}")
    print(f"           tests: {spec.tests}")

    # Executor
    code = await executor_llm(spec)
    print(f"[executor] code:")
    for line in code.split('\n'):
        print(f"           {line}")

    # Critic
    critic_report = await critic_llm(spec, code)
    print(f"[critic] approved={critic_report.approved}, notes={critic_report.notes}")

    # Verifier
    verifier_report = verifier_deterministic(spec, code)
    print(f"[verifier] passed={verifier_report.passed}, failures={verifier_report.failures}")

    # Decision
    if critic_report.approved and verifier_report.passed:
        result = "✅ SHIP IT."
    elif not verifier_report.passed:
        result = "❌ VERIFIER BLOCKED (deterministic test failure)."
    else:
        result = "⚠️  CRITIC BLOCKED (style/structure issue)."
    print(f"[result] {result}")
    return spec, code, critic_report, verifier_report

# Run pipeline on the user wish
spec, code, cr, vr = await run_pipeline(
    "Write a function that returns the sum of two integers.",
    "Correct Executor Output"
)
```

### MetaGPT's SOP pattern

MetaGPT (arXiv:2308.00352) encodes software engineering SOPs as role prompts:

- **Product Manager** writes the PRD.
- **Architect** produces the system design.
- **Project Manager** splits tasks.
- **Engineer** implements.
- **QA Engineer** runs tests.

Each role has a strict input/output schema. The role prompt says what the role *is* and what it *must produce*. The `Code = SOP(Team)` formulation — deterministic SOPs turn a team of LLMs into a predictable pipeline.

### ChatDev's communicative dehallucination

ChatDev adds a key move: when an executor needs a specific detail that was not in the plan, it explicitly asks the designer before continuing. This prevents the classic LLM failure of plausibly inventing the detail.

Implementation: the role prompt includes "when you need specific information you were not given, ask the relevant role by name before producing output."

### Why verifier matters most

Cemri et al. (MAST) traced 1642 multi-agent execution failures. 21.3% were verification gaps — the system shipped an answer no one had checked. The remaining 79% often trace back to "there was a check that failed silently or was never run." Verification is the load-bearing role.

A separate verifier can catch errors before they propagate, but its benefit depends on task, model independence, and the verification oracle. Measure the gain against a single-agent baseline instead of assuming a fixed multiplier.

### Critic vs verifier

- A critic is an LLM reviewing an artifact for quality. Subjective. Can be fooled by plausible prose.
- A verifier is a deterministic program running on the artifact. Objective. Gives pass/fail with evidence.

Use both. Critic catches taste issues the verifier cannot articulate. Verifier catches bugs the critic cannot see because they show up only at runtime.

See it directly: inject buggy code by hand — multiplication instead of addition — and watch the critic get fooled while the verifier catches it immediately. The code is syntactically correct and has a return statement, so a purely textual review has nothing obvious to flag.

```python editable
# Manually inject buggy code (multiply instead of add)
buggy_code = f"def {spec.task_name}{_signature_tail(spec.signature)}:\n    return a * b"

print(f"Testing buggy code:")
print(buggy_code)
print()

# Critic reviews it
critic_report_buggy = await critic_llm(spec, buggy_code)
print(f"[critic] approved={critic_report_buggy.approved}, notes={critic_report_buggy.notes}")

# Verifier tests it
verifier_report_buggy = verifier_deterministic(spec, buggy_code)
print(f"[verifier] passed={verifier_report_buggy.passed}, failures={verifier_report_buggy.failures}")

if not verifier_report_buggy.passed and critic_report_buggy.approved:
    print("\n🎯 KEY INSIGHT: Critic passed, verifier failed. This is the MAST failure mode.")
    print("All-LLM pipelines (no verifier) would ship this bug.")
```

### The anti-pattern

Every role in your system is an LLM and every role's output is "looks good to me." Classic MAST failure mode. Add at least one verifier whose pass/fail is decided by code, not by an LLM.

### Framework mappings

- **CrewAI** — `Agent(role, goal, backstory)` is the textbook specialization surface.
- **LangGraph** — nodes can have specialized prompts; edges enforce the pipeline.
- **AutoGen** — role-specific ConversableAgents with one-word names in a GroupChat.
- **OpenAI Agents SDK** — handoff tools between role-specialized Agents.

## Try It Yourself

Edit the user wish below and run the full pipeline. Watch how the planner, executor, critic, and verifier each do their part. Can you craft a user wish that the critic misses but the verifier catches?

```python editable
# TODO: Change this user wish to test the pipeline with different functions
user_wish = "Write a function that returns the maximum of two numbers."

# Run the full pipeline
print(f"Your user wish: {user_wish}")
print()

spec2, code2, cr2, vr2 = await run_pipeline(user_wish, "Custom Wish")

# Self-check: confirm the pipeline actually ran all four roles (planner → executor → critic → verifier)
if code2 and cr2 is not None and vr2 is not None:
    print("\n✅ Self-check: pipeline ran all four roles successfully.")
else:
    print("\n❌ Self-check failed: pipeline did not produce output for all roles.")
```

## Further Reading

- [Hong et al. — MetaGPT: Meta Programming for Multi-Agent Collaboration](https://arxiv.org/abs/2308.00352) — the SOP-as-role-prompt reference paper
- [Qian et al. — Communicative Agents for Software Development (ChatDev)](https://arxiv.org/abs/2307.07924) — chat chain + communicative dehallucination
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) — MAST taxonomy; verification gaps are 21.3% of failures
- [CrewAI docs — Agent roles](https://docs.crewai.com/en/introduction) — production role specification surface
