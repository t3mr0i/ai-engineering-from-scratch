# Kill Switches, Circuit Breakers, and Canary Tokens

> A kill switch is a boolean held outside the agent's edit surface — a Redis key, a feature flag, a signed config — that disables the agent entirely. A circuit breaker is finer-grained: it trips on a specific pattern (five identical tool calls in a row), pauses the offending path, and escalates to a human. A canary token inherits from classical deception: a fake credential or honeypot record an agent has no legitimate reason to touch, whose access triggers an alert. eBPF-based datapaths (e.g. Cilium) can rewrite a quarantined pod's egress to a forensic honeypot at the kernel layer; published Cilium benchmarks report sub-millisecond P99 datapath latency under load (your propagation budget depends on how a policy update reaches the node, not the datapath itself). Statistical detectors (EWMA, CUSUM) that adapt to a moving baseline will quietly accept drift — layer them with hard constitutional limits that do not bend.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 15 · 13 (Cost governors), Phase 15 · 10 (Permission modes)
**Time:** ~60 minutes

## Learning Objectives

- Explain the autonomy mechanism and assumptions behind Kill Switches, Circuit Breakers, and Canary Tokens
- Model its control loop, state transitions, and stopping conditions explicitly
- Apply bounded permissions, budgets, and rollback controls
- Evaluate capability and safety claims against reproducible evidence

## The Problem

Cost governors (Lesson 13) bound what the agent can spend. They do not bound what the agent can do inside the budget. An agent with a $50 velocity limit can still exfiltrate a secret, publish the wrong post, or delete a resource — the expensive action is often the cheap one in tokens.

This lesson covers the three detectors that sit next to the cost layer:

1. **Kill switch**: boolean off-button held outside the agent's reach.
2. **Circuit breaker**: action-pattern detector that pauses a specific path.
3. **Canary token**: bait that an agent with no legitimate reason to touch will reveal itself by touching.

All three are pre-LLM engineering. Classical deception, rate-limit breakers, and feature-flag kills predate autonomous agents. What's new is the attack surface: agents read untrusted content (Lesson 11), edit their own memory, and can compose many safe-looking actions into an unsafe one. The detectors named here work because they do not trust the agent's self-report.

## The Concept

### Kill switches

A kill switch is a boolean the agent reads but cannot write. Implementation choices:

- **Feature flag in a managed service.** LaunchDarkly, Statsig, Unleash. Updates propagate in seconds.
- **Redis key the agent polls.** Simple; requires the agent process to check on every turn.
- **Signed config in object storage.** Agent verifies a signature on boot; rejects unsigned states.
- **OS-level signal or container-lifecycle kill.** Docker `kill`, Kubernetes `kubectl delete pod`, systemd stop.

Properties a correct kill switch has:

- The agent cannot set it to `off`. (Lives in a system the agent's credentials do not write.)
- It is checked on every consequential action, not just at startup.
- When it is off, the agent does nothing externally observable, including logging to systems the agent can reach.
- Re-enabling it is an explicit human action, not an automatic timeout.

### Circuit breakers

A circuit breaker pauses a specific pattern, not the whole agent. Classical shape (from the 2007 Nygard book, still current):

- **Closed**: action is allowed.
- **Open**: action is blocked.
- **Half-open**: after a cool-down, 1–3 probe attempts are allowed (default 1); success closes the breaker, any remaining failure re-opens it.

Agent-relevant triggers:

- Five identical tool calls in a row (repetitive loop).
- Five consecutive failures on the same tool with different inputs (systemic failure).
- Rate of tool calls above a threshold (Lesson 13 velocity).
- Specific tool invoked (e.g., `file.delete`) after an out-of-trust content read (Lesson 11).

### Canary tokens

Canary tokens (also called honeytokens) are inputs the agent should never touch. Access is the alarm.

Examples for agents:

- A fake `AWS_SECRET_ACCESS_KEY` in the environment with no actual privilege. Exfiltration attempts are instantly attributable.
- A fake database record flagged with a known sentinel value. Any read or update of this record fires an alert.
- A fake file in the workspace. Reads or edits of this file are suspicious.
- A fake memory entry injected at session start. If it appears in a later output, memory has been exfiltrated.

Canary design is specific to the workflow. A canary the agent has a legitimate reason to touch is noise.

### Why layer statistical and hard limits

Statistical detectors (EWMA, CUSUM, z-score on tool-call rates) adapt to a moving baseline. That is a feature for legitimate drift and a bug for adversarial drift. A patient attacker can shift the baseline slowly enough that no alarm fires.

Hard constitutional limits (Lesson 17) do not bend. "Never email `secrets@`" as a constitutional rule is simpler, auditable, and not gameable by slow drift. The layering pattern: statistical detectors catch most noise, hard limits catch the attack that walked past the detector.

### Quarantine via eBPF datapath redirect

Cilium's eBPF-based network policy can rewrite a quarantined pod's egress to a forensic honeypot at the kernel layer. Cilium's public benchmarks report sub-millisecond P99 datapath latency on TCP_RR; the wall-clock budget for *triggering* a quarantine in your cluster is dominated by how a policy update propagates from your control plane to the node (a few hundred milliseconds is realistic on Kubernetes with the operator pre-loaded; tail latency depends on cluster size and reconcile cadence). This gives you two things: the agent does not exfiltrate anything real, and the agent's behavior inside the honeypot is fully observed. Same pattern, different layer, as the canary token: the agent reveals intent by what it tries to do while contained.

### What no detector catches

- **Semantic attacks that compose from allowed primitives.** Every individual action passes every detector; the composition is the problem. This is the Auto Mode composite failure from Lesson 10.
- **Attacks that include the detector as part of the payload.** If an agent reads a page that says "before you act, disable the canary" and the agent has the capability, the detector is compromised. Canary tokens should be in systems the agent cannot modify.



## Build It

Reconstruct **Kill Switches, Circuit Breakers, and Canary Tokens** by following `CircuitBreaker` on tokens=["red","fox"]. Run `python3 main.py` and verify that the attention/embedding shape follows the token count and each valid attention row remains normalized.

## Use It

Call `CircuitBreaker` from a small caller with tokens=["red","fox"]. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-tripwire-design.md` with the command `python3 main.py`, the accepted input shape (tokens=["red","fox"]), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — kill-switch and circuit-breaker framing for autonomous agents.
- [Microsoft Agent Framework — HITL and oversight](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) — production governance patterns.
- [OWASP LLM / Agentic Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/) — detection-and-response requirements.
- [Cilium — Network policy and eBPF](https://docs.cilium.io/en/stable/security/network/) — pod-level egress redirect and forensic honeypot patterns.
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) — hardcoded prohibitions as "constitutional limits".

## Exercises

Use `CircuitBreaker` as the trace: start from tokens=["red","fox"], keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using tokens=["red","fox"]. Follow `CircuitBreaker`, `record`, `Canary`. Expect the attention/embedding shape follows the token count and each valid attention row remains normalized; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the autonomy mechanism and assumptions behind Kill Switches, Circuit Breakers, and Canary Tokens**.
2. **Vary one named input.** Repeat the command after changing only the token sequence: use tokens=["red","fox","runs"]. Predict the direction of the change, then compare the two output values. Explain why **Model its control loop, state transitions, and stopping conditions explicitly** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation tokens=[]. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Apply bounded permissions, budgets, and rollback controls** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-tripwire-design.md` and add a worked example using tokens=["red","fox"]. Include the input contract, one expected output field, and a named acceptance check for **Evaluate capability and safety claims against reproducible evidence**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Kill Switches, Circuit Breakers, and Canary Tokens** should contain:

- the `python3 main.py` output for tokens=["red","fox"], with `CircuitBreaker`, `record`, `Canary` traced to the value or shape that supports **Explain the autonomy mechanism and assumptions behind Kill Switches, Circuit Breakers, and Canary Tokens**;
- a before/after comparison for the token sequence, where tokens=["red","fox","runs"] changes the observation in the direction predicted by **Model its control loop, state transitions, and stopping conditions explicitly**;
- a recorded result for tokens=[] that matches the implementation’s validation or empty-result contract and explains the evidence for **Apply bounded permissions, budgets, and rollback controls**; and
- an updated `outputs/skill-tripwire-design.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate capability and safety claims against reproducible evidence**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
