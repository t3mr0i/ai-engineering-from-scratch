# Initialization Scripts for Agents

> Every session that starts cold pays a tax. The agent reads the same files, retries the same probes, and rediscovers the same paths. An init script pays the tax once and writes the answers into state.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 14 · 32 (Minimal Workbench), Phase 14 · 34 (Repo Memory)
**Time:** ~45 minutes

## Learning Objectives

- Identify the work an agent should never have to redo per session.
- Build a deterministic init script that probes runtime, dependencies, and repo health.
- Persist the probe result so the agent reads it instead of re-running checks.
- Fail loud, fast, and with one place to look when initialization fails.

## The Problem

Open a session. The agent guesses the Python version. Guesses the test command. Lists the repo root five times to find the entry point. Tries to import a package that is not installed. Asks the user where the config file lives. By the time it makes a real edit, ten thousand tokens have gone to setup work that should have been a single script.

The fix is one initialization script that runs before the agent does anything else and writes a `init_report.json` the agent reads at startup.

## The Concept

```mermaid
flowchart TD
  Start[Session Start] --> Init[init_agent.py]
  Init --> Probes[probe runtime / deps / paths / env / tests]
  Probes --> Report[init_report.json]
  Report --> Decision{healthy?}
  Decision -- yes --> Agent[Agent Loop]
  Decision -- no --> Halt[fail loud, halt, surface to human]
```

### What the init script probes

| Probe | Why it matters |
|-------|----------------|
| Runtime versions | Wrong Python or Node version means silent wrong-version bugs |
| Dependency availability | A missing package later costs ten times the cost of catching it now |
| Test command | The agent must know how to verify; if the command is missing the workbench is broken |
| Repo paths | Hard-coded paths drift; resolve them once and pin |
| Environment variables | Missing `OPENAI_API_KEY` is a failure surface, not a runtime mystery |
| State + board freshness | Stale state from a crashed session is a footgun |
| Last-known-good commit | Anchor for the handoff diff at the end of the session |

### Fail loud, fail fast, fail in one place

A probe failure means halt and surface to the human. No "the agent will figure it out." The whole point of init is to refuse to start when the workbench is broken.

### Idempotent

Run it twice in a row. The second run should be a no-op except for a fresh timestamp. Idempotency is what lets you wire the script into CI, hooks, or a pre-task slash command.

### Init versus startup rules

Rules (Phase 14 · 33) describe what must be true to act. Init is the script that establishes that those rules can be checked. Rules without init become "be careful." Init without rules becomes a polished failure.




## Further Reading

- [Anthropic, Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [GitHub Actions, composite actions for setup](https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-composite-action)
- [microservices.io, GenAI dev platform: guardrails](https://microservices.io/post/architecture/2026/03/09/genai-development-platform-part-1-development-guardrails.html) — pre-commit + CI checks as init
- [Augment Code, How to Build Your AGENTS.md (2026)](https://www.augmentcode.com/guides/how-to-build-agents-md) — init expectations
- [Codex Blog, Codex CLI Context Compaction](https://codex.danielvaughan.com/2026/03/31/codex-cli-context-compaction-architecture/) — session start as compaction-aware init
- Phase 14 · 33 — the rule set this script enables
- Phase 14 · 34 — the state file this script seeds
- Phase 14 · 38 — the verification gate the init script feeds
- Phase 14 · 40 — the handoff that consumes the init report's last-known-good

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Identify the work an agent should never have to redo per session.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Build a deterministic init script that probes runtime, dependencies, and repo health.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Persist the probe result so the agent reads it instead of re-running checks.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Identify the work an agent should never have to redo per session,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Persist the probe result so the agent reads it instead of re-running checks,” and cite a repeatable check rather than relying on visual inspection alone.
