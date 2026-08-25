# Browser Agents and Long-Horizon Web Tasks

> ChatGPT agent (July 2025) merged Operator and deep research into one browser/terminal agent and set BrowseComp SOTA at 68.9%. OpenAI shut Operator down August 31, 2025 — consolidation at the product layer. Anthropic's Vercept acquisition moved Claude Sonnet on OSWorld from under 15% to 72.5%. WebArena-Verified (ServiceNow, ICLR 2026) fixed 11.3 percentage points of false-negative rate in the original WebArena and shipped the 258-task Hard subset. The numbers are real. So is the attack surface: OpenAI's head of preparedness stated publicly that indirect prompt injection into browser agents "is not a bug that can be fully patched." Documented 2025–2026 attacks: Tainted Memories (Atlas CSRF), HashJack (Cato Networks), and one-click hijacks in Perplexity Comet.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 15 · 10 (Permission modes), Phase 15 · 01 (Long-horizon agents)
**Time:** ~45 minutes

## Learning Objectives

- Explain the autonomy mechanism and assumptions behind Browser Agents and Long-Horizon Web Tasks
- Model its control loop, state transitions, and stopping conditions explicitly
- Apply bounded permissions, budgets, and rollback controls
- Evaluate capability and safety claims against reproducible evidence

## The Problem

A browser agent is a long-horizon agent that reads untrusted content and takes consequential actions. Every page the agent visits is an input the user did not write. Every form on every page is a potential command channel. The 2025–2026 attack corpus shows this is not hypothetical: Tainted Memories lets an attacker bind malicious instructions to the agent's memory via a crafted page; HashJack hides commands in URL fragments the agent visits; Perplexity Comet hijacks hit in a single click.

The defensive picture is uncomfortable. OpenAI's head of preparedness said the quiet part loud: indirect prompt injection "is not a bug that can be fully patched." This is because the attack lives in the agent's reading-vs-acting boundary, which is architecturally fuzzy — every token the model reads could, in principle, be read as an instruction.

This lesson names the attack surface, names the benchmark landscape (BrowseComp, OSWorld, WebArena-Verified), and models a minimal indirect-prompt-injection scenario so you can reason about real defenses in Lessons 14 and 18.

## The Concept

### The 2026 landscape, in one paragraph per system

**ChatGPT agent (OpenAI).** Launched July 2025. Unifies Operator (browsing) and Deep Research (multi-hour research). Shut down the standalone Operator August 31, 2025. SOTA on BrowseComp at 68.9%; strong numbers on OSWorld and WebArena-Verified.

**Claude Sonnet + Vercept (Anthropic).** Anthropic's Vercept acquisition focused on computer-use capabilities. Moved Claude Sonnet on OSWorld from <15% to 72.5%. Claude Computer Use ships as a tool API.

**Gemini 3 Pro with Browser Use (DeepMind).** Browser Use integration ships computer-use controls; FSF v3 (April 2026, Lesson 20) tracks autonomy in the ML R&D domain specifically.

**WebArena-Verified (ServiceNow, ICLR 2026).** Fixes a well-documented problem: the original WebArena had ~11.3% false-negative rate (tasks marked failed that were actually solved). The Verified release re-grades with human-curated success criteria and adds a 258-task Hard subset (ICLR 2026 paper, openreview.net/forum?id=94tlGxmqkN).

### BrowseComp vs OSWorld vs WebArena

| Benchmark | What it measures | Horizon |
|---|---|---|
| BrowseComp | Finding specific facts on the open web under time pressure | minutes |
| OSWorld | Agent operating a full desktop (mouse, keyboard, shell) | tens of minutes |
| WebArena-Verified | Transactional web tasks in simulated sites | minutes |
| Hard subset | WebArena-Verified tasks with multi-page state transitions | tens of minutes |

Different axes. A high BrowseComp score says the agent finds facts; it does not say the agent can book a flight. The OSWorld score is closer to "does it work on my desktop." WebArena-Verified is closer to "can it finish a flow." Any production decision needs the benchmark that matches the task distribution.

### The attack surface, named

1. **Indirect prompt injection.** Untrusted page content contains instructions. The agent reads them. The agent executes them. Public examples: 2024 Kai Greshake et al., 2025 Tainted Memories paper, 2026 HashJack (Cato Networks).
2. **URL fragment / query injection.** The `#fragment` or query string of a crawled URL contains commands. Never rendered visibly; still inside the agent's context.
3. **Memory-binding attacks.** Page instructs the agent to write a persistent memory (Lesson 12 covers durable state). Next session, the memory fires the payload with no visible trigger.
4. **CSRF-shaped attacks on authenticated sessions.** Tainted Memories class: agent is logged in somewhere; attacker's page issues state-changing requests the agent executes with the user's cookies.
5. **One-click hijack.** A visually innocuous button rides a payload the agent follows. Comet class.
6. **Content-Security-Policy holes in the agent's host surface.** The rendering and tool layers can themselves be attack vectors; the browser-in-a-browser-agent stack is wide.

### Why "not fully patchable"

The attack is isomorphic to the agent's capability. The agent must read untrusted content to do its job. Any content the agent reads could contain instructions. Any instructions the agent follows could be misaligned with the user's actual request. Defenses (trust boundaries, classifiers, tool allowlists, HITL on consequential actions) raise the cost of the attack and reduce its blast radius. They do not close the class.

This is the same reasoning pattern as Lob's theorem (Lesson 8): the agent cannot prove the next token is safe; it can only set up a system where unsafe tokens are more detectable.

### Defense posture that actually ships

- **Read / write boundary.** Reading is never consequential. Writing (submitting a form, posting content, calling a tool with side effects) requires fresh human approval if the initiating content came from outside the trust boundary.
- **Tool allowlist per task.** The agent can browse; it cannot initiate a wire transfer unless that tool was explicitly enabled for the task. Lesson 13 covers budgets.
- **Session isolation.** Browser agent sessions run with scoped credentials only. No production auth, no personal email. Logs of every HTTP request retained for audit.
- **Content sanitizer.** Fetched HTML is stripped of known-bad patterns before being concatenated into the model context. (Reduces the easy attacks; does not stop sophisticated payloads.)
- **HITL on consequential actions.** Propose-then-commit pattern (Lesson 15).
- **Canary tokens on memory.** If a memory entry fires, the user sees it (Lesson 14).



## Build It

Reconstruct **Browser Agents and Long-Horizon Web Tasks** by following `sanitizer` on the smallest valid record {"id": 1}. Run `python3 main.py` and verify that validation names the missing field or rejects the request; it must not silently accept an incomplete record.

## Use It

Call `sanitizer` from a small caller with the smallest valid record {"id": 1}. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-browser-agent-trust-boundary.md` with the command `python3 main.py`, the accepted input shape (the smallest valid record {"id": 1}), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [OpenAI — Introducing ChatGPT agent](https://openai.com/index/introducing-chatgpt-agent/) — merge of Operator and deep research; BrowseComp SOTA.
- [OpenAI — Computer-Using Agent](https://openai.com/index/computer-using-agent/) — the Operator lineage and the architecture that became ChatGPT agent.
- [Zhou et al. — WebArena](https://webarena.dev/) — the original benchmark.
- [WebArena-Verified (OpenReview)](https://openreview.net/forum?id=94tlGxmqkN) — ICLR 2026 fixed-subset paper.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — includes attack-surface discussion for computer-use agents.

## Exercises

This lab follows `sanitizer` and `rw_boundary_allows` on a controlled fixture; write down the value before changing the input.

1. **Trace the canonical fixture.** From `code/`, run `python3 main.py` using the smallest valid record {"id": 1}. Follow `sanitizer`, `rw_boundary_allows`, `AgentResult`. Expect validation names the missing field or rejects the request; it must not silently accept an incomplete record; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the autonomy mechanism and assumptions behind Browser Agents and Long-Horizon Web Tasks**.
2. **Change the controlled parameter.** Repeat the command after changing only the optional field: use the same record with one optional field changed. Predict the direction of the change, then compare the two output values. Explain why **Model its control loop, state transitions, and stopping conditions explicitly** says the other inputs should stay fixed.
3. **Exercise the guard.** Feed the implementation a record missing the required "id" field. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Apply bounded permissions, budgets, and rollback controls** and record the exception text if the code rejects the case.
4. **Prepare the artifact for reuse.** Open `outputs/skill-browser-agent-trust-boundary.md` and add a worked example using the smallest valid record {"id": 1}. Include the input contract, one expected output field, and a named acceptance check for **Evaluate capability and safety claims against reproducible evidence**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Browser Agents and Long-Horizon Web Tasks** should contain:

- the `python3 main.py` output for the smallest valid record {"id": 1}, with `sanitizer`, `rw_boundary_allows`, `AgentResult` traced to the value or shape that supports **Explain the autonomy mechanism and assumptions behind Browser Agents and Long-Horizon Web Tasks**;
- a before/after comparison for the optional field, where the same record with one optional field changed changes the observation in the direction predicted by **Model its control loop, state transitions, and stopping conditions explicitly**;
- a recorded result for a record missing the required "id" field that matches the implementation’s validation or empty-result contract and explains the evidence for **Apply bounded permissions, budgets, and rollback controls**; and
- an updated `outputs/skill-browser-agent-trust-boundary.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate capability and safety claims against reproducible evidence**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
