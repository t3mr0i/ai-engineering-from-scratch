# Reflexion: Verbal Reinforcement Learning

> Gradient-based RL needs thousands of trials and a GPU cluster to fix a failure mode. Reflexion (Shinn et al., NeurIPS 2023) does it in natural language: after each failed trial, the agent writes a reflection, stores it in episodic memory, and conditions the next trial on that memory. This is the pattern behind Letta's sleep-time compute, Claude Code's CLAUDE.md learnings, and pro-workflow's learn-rule.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 02 (ReWOO)
**Time:** ~60 minutes

## Learning Objectives

- Name the three components of Reflexion (Actor, Evaluator, Self-Reflector) and the role of episodic memory.
- Implement a stdlib Reflexion loop with binary evaluator, reflection buffer, and fresh re-attempts.
- Choose between scalar, heuristic, and self-evaluated feedback sources for a given task.
- Explain why verbal reinforcement catches errors that gradient-based RL would need thousands of trials to fix.

## The Problem

An agent fails a task. In standard RL you would run thousands more trials, compute gradients, update weights. Expensive, slow, and most production agents do not have a training budget for every failure.

Reflexion (Shinn et al., arXiv:2303.11366) asks a different question: what if the agent just thought about why it failed and tried again with that thought in its prompt? No weight updates. No gradient. Just natural language stored between trials.

The result: on ALFWorld it beats ReAct and other non-fine-tuned baselines. On HotpotQA it improves over ReAct. On code generation (HumanEval/MBPP) it sets state of the art at the time. All without a single gradient step.

## The Concept

### The three components

```
Actor         : generates a trajectory (ReAct-style loop)
Evaluator     : scores the trajectory — binary, heuristic, or self-eval
Self-Reflector: writes a natural-language reflection on the failure
```

Plus one data structure:

```
Episodic memory: list of prior reflections, prepended to the next trial's prompt
```

One trial runs the Actor. Evaluator scores it. If the score is low, Self-Reflector produces a reflection ("I picked the wrong tool because I misread the question as asking about X when it was asking about Y"). The reflection goes into episodic memory. Next trial starts fresh but sees the reflection.

Every example below shares this setup — run it once, then the rest reuse `lrn_llm`. The toy task: pick three integers from 1–9 that sum to a target (20). The Actor (LLM) must learn from reflections to converge.

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

Episodic memory is a bounded buffer of reflections; older ones are evicted when it fills:

```python editable
from dataclasses import dataclass, field

@dataclass
class Reflection:
    trial: int
    text: str

@dataclass
class EpisodicMemory:
    items: list[Reflection] = field(default_factory=list)
    max_len: int = 6

    def add(self, r: Reflection) -> None:
        self.items.append(r)
        if len(self.items) > self.max_len:
            self.items.pop(0)

    def as_prompt(self) -> str:
        if not self.items:
            return "(no prior reflections)"
        lines = [f"- trial {r.trial}: {r.text}" for r in self.items]
        return "\n".join(lines)

memory = EpisodicMemory()
print("✅ Episodic memory initialized")
```

The Evaluator here is the scalar kind: it checks if the sum equals the target and reports how far off the attempt is.

```python editable
TARGET = 20

def binary_evaluator(attempt: list[int], target: int) -> tuple[bool, int]:
    """Check if list sums to target. Return (success, delta)."""
    total = sum(attempt)
    return total == target, total - target

# Test
test_attempt = [6, 7, 7]  # sums to 20
success, delta = binary_evaluator(test_attempt, TARGET)
print(f"Test: {test_attempt} → sum={sum(test_attempt)}, success={success}, delta={delta}")
```

The Actor generates three integers. On the first trial it gets a generic prompt; on later trials, it sees reflections from prior failures:

```python editable
async def actor(memory: EpisodicMemory, trial: int, target: int = TARGET) -> list[int]:
    """LLM generates three integers in [1..9] that should sum to target."""
    reflection_context = memory.as_prompt()
    prompt = f"""You are solving a puzzle: pick three integers from 1 to 9 (inclusive) that sum to {target}.
Return ONLY a valid JSON array of exactly 3 integers, e.g. [3, 5, 7]

Prior trial reflections (if any):
{reflection_context}

Trial {trial}: generate your three integers."""

    r = await lrn_llm.call(
        [{"role": "user", "content": prompt}],
        max_tokens=50
    )
    text = lrn_llm.text(r).strip()
    # Parse JSON array from response
    try:
        attempt = json.loads(text)
        # Clamp to [1..9]
        attempt = [max(1, min(9, x)) for x in attempt[:3]]
        if len(attempt) < 3:
            attempt.extend([5] * (3 - len(attempt)))
        return attempt
    except:
        return [5, 5, 5]  # fallback

# Test actor on trial 1 with empty memory
attempt = await actor(memory, trial=1)
print(f"Trial 1 attempt: {attempt}, sum={sum(attempt)}")
```

If the trial fails, the Self-Reflector writes a one-line diagnosis of why:

```python editable
async def self_reflector(attempt: list[int], delta: int, trial: int, target: int = TARGET) -> str:
    """LLM writes a one-line reflection on why the attempt failed."""
    prompt = f"""You just tried {attempt}, which sums to {sum(attempt)}.
Target is {target}. Delta (actual - target) = {delta}.

Write ONE SHORT LINE explaining what went wrong and how to fix it next time.
Be specific: e.g. 'sum was too low by 3; need larger integers' or 'tried [8,9,9] which overshoots by 6; need smaller'.
Do NOT say 'I should try harder' or generic advice.
Reply with ONLY the reflection, no markdown."""

    r = await lrn_llm.call(
        [{"role": "user", "content": prompt}],
        max_tokens=40
    )
    return lrn_llm.text(r).strip()

# Test reflector
test_delta = 5  # sum was 15, target is 20
reflection = await self_reflector([5, 5, 5], test_delta, trial=1)
print(f"Reflection: {reflection}")
```

Now the full loop: actor → evaluator → reflector → memory → repeat, up to 4 trials:

```python editable
@dataclass
class TrialResult:
    trial: int
    attempt: list[int]
    success: bool
    delta: int
    reflection: str

async def run_reflexion(max_trials: int, target: int = TARGET) -> list[TrialResult]:
    """Run reflexion loop: actor → evaluator → reflector → memory → repeat."""
    global memory
    memory = EpisodicMemory()  # Fresh memory for this run
    trials: list[TrialResult] = []

    for t in range(1, max_trials + 1):
        print(f"\n--- Trial {t} ---")
        attempt = await actor(memory, trial=t, target=target)
        success, delta = binary_evaluator(attempt, target)

        print(f"Attempt: {attempt}, sum={sum(attempt)}, delta={delta:+d}", end="")

        if success:
            reflection_text = "success!"
            print(" ✅")
            trials.append(TrialResult(t, attempt, success, delta, reflection_text))
            break
        else:
            print(" ❌")
            reflection_text = await self_reflector(attempt, delta, t, target=target)
            print(f"Reflection: {reflection_text}")
            memory.add(Reflection(trial=t, text=reflection_text))
            trials.append(TrialResult(t, attempt, success, delta, reflection_text))

    return trials

trials = await run_reflexion(max_trials=4)
print(f"\n=== Final: {'✅ Success' if trials[-1].success else '❌ Failed'} in {len(trials)} trials ===")
```

Reflexion succeeds when the LLM uses reflections to adapt trial over trial:

```python editable
def summarize(trials: list[TrialResult], name: str) -> None:
    print(f"\n{name}")
    print("-" * 70)
    for r in trials:
        mark = "✅" if r.success else "❌"
        print(f"  trial {r.trial}: {r.attempt} → sum={sum(r.attempt):2d}, "
              f"delta={r.delta:+3d} {mark}")
        if not r.success:
            print(f"           reflection: {r.reflection}")
    last = trials[-1]
    print(f"\n  Result: {'✅ converged' if last.success else '❌ stuck'} "
          f"in {len(trials)} trials")

summarize(trials, "REFLEXION RUN (with episodic memory)")
print(f"\n💡 The LLM adapted based on reflections, improving each trial.")
```

### Three evaluator types

1. **Scalar** — an external binary signal. ALFWorld succeeds or fails. HumanEval tests pass or fail. Simplest, highest-signal.
2. **Heuristic** — predefined failure signatures. "If the agent produced the same action twice in a row, mark as stuck." "If the trajectory exceeds 50 steps, mark as inefficient."
3. **Self-evaluated** — the LLM scores its own trajectory. Needed when no ground truth is available. Weaker signal; pairs well with tool-grounded verification (Lesson 05 — CRITIC).

The 2026 default is a mix: scalar when available, self-eval when not, heuristics as safety rails.

### Why this generalizes

Reflexion is not a new algorithm so much as a named pattern. Almost every production "self-healing" agent runs some variant:

- Letta's sleep-time compute (Lesson 08): a separate agent reflects on past conversations and writes to memory blocks.
- Claude Code's `CLAUDE.md` / "save memory" pattern: reflections captured as learnings, prepended to future sessions.
- pro-workflow's `/learn-rule` command: corrections captured as explicit rules.
- LangGraph's reflection nodes: a node that scores output and routes to refine if needed.

All derive from the same insight: natural language is a rich-enough medium to carry "what I learned from failure" between runs.

### When it works and when it does not

Reflexion works when:

- There is a clear failure signal (test failure, tool error, wrong answer).
- The task class is reproducible (the same type of question can be asked again).
- The reflection has room to improve on the trajectory (enough action budget).

Reflexion does not help when:

- The agent already succeeds on the first try.
- The failure is external (network down, tool broken) — reflection on "the network was down" does not help future runs.
- The reflection turns into superstition — storing a narrative about a one-off flaky run.

2026 pitfall: memory rot. Reflections accumulate; some are obsolete or wrong; re-runs get slower as the episodic buffer grows. Mitigation: periodic compaction (Lesson 06), TTL on reflections, or a separate sleep-time cleanup agent (Letta).

## Try It Yourself

Try a different target, or modify the actor prompt above to be more or less explicit, or add a heuristic evaluator (e.g., mark stuck if the same attempt repeats twice).

```python editable
# TODO: Experiment!
# 1. Try changing TARGET to a different value (e.g., 15 or 25)
# 2. Or modify the actor prompt above to be more or less explicit
# 3. Or add a heuristic evaluator (e.g., mark stuck if same attempt twice)

# Re-run the loop with a different target
TARGET_EXPERIMENT = 18  # Change this
print(f"Running reflexion with TARGET = {TARGET_EXPERIMENT}")

trials_exp = await run_reflexion(max_trials=4, target=TARGET_EXPERIMENT)
summarize(trials_exp, f"EXPERIMENT (TARGET={TARGET_EXPERIMENT})")
print(f"\n=== Final: {'✅ Success' if trials_exp[-1].success else '❌ Failed'} in {len(trials_exp)} trials (target={TARGET_EXPERIMENT}) ===")
```

## Further Reading

- [Shinn et al., Reflexion: Language Agents with Verbal Reinforcement Learning (arXiv:2303.11366)](https://arxiv.org/abs/2303.11366) — the canonical paper
- [Letta, Sleep-time Compute](https://www.letta.com/blog/sleep-time-compute) — async reflection in production
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — managing the episodic buffer as part of context
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — reflection node pattern

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Name the three components of Reflexion (Actor, Evaluator, Self-Reflector) and the role of episodic memory.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement a stdlib Reflexion loop with binary evaluator, reflection buffer, and fresh re-attempts.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Choose between scalar, heuristic, and self-evaluated feedback sources for a given task.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Name the three components of Reflexion (Actor, Evaluator, Self-Reflector) and the role of episodic memory,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Choose between scalar, heuristic, and self-evaluated feedback sources for a given task,” and cite a repeatable check rather than relying on visual inspection alone.
