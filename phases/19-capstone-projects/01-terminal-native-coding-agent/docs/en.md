# Capstone 01 — Terminal-Native Coding Agent

> By 2026 the shape of a coding agent is settled. A TUI harness, a stateful plan, a sandboxed tool surface, a loop that plans, acts, observes, recovers. Claude Code, Cursor 3, and OpenCode all look the same from 50 feet. This capstone asks you to build one end to end — CLI in, pull request out — and measure it against mini-swe-agent and Live-SWE-agent on SWE-bench Pro. You will learn why the hard part is not the model call but the tool loop, the sandbox, and the cost ceiling on a 50-turn run.

**Type:** Capstone
**Languages:** TypeScript / Bun (harness), Python (eval scripts)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools and protocols), Phase 14 (agents), Phase 15 (autonomous systems), Phase 17 (infrastructure)
**Phases exercised:** P0 · P5 · P7 · P10 · P11 · P13 · P14 · P15 · P17 · P18
**Time:** 35 hours

## Problem

Coding agents became the dominant AI application category in 2026. Claude Code (Anthropic), Cursor 3 with Composer 2 and Agent Tabs (Cursor), Amp (Sourcegraph), OpenCode (112k stars), Factory Droids, and Google Jules all ship variations of the same architecture: a terminal harness, a permissioned tool surface, a sandbox, and a plan-act-observe loop built around a frontier model. The frontier is narrow — Live-SWE-agent reached 79.2% on SWE-bench Verified with Opus 4.5 — but the engineering craft is wide. Most failure modes are not model mistakes. They are tool-loop instability, context poisoning, runaway token cost, and destructive filesystem operations.

You cannot reason about these agents from the outside. You have to build one, watch the loop crash on turn 47 when ripgrep returns 8MB of matches, and rebuild the truncation layer. That is the point of this capstone.

## Concept

The harness has four surfaces. **Plan** maintains a TodoWrite-style state object that the model rewrites each turn. **Act** dispatches tool calls (read, edit, run, search, git). **Observe** captures stdout / stderr / exit codes, truncates, and feeds the summary back. **Recover** handles tool errors without blowing the context window or looping forever. The 2026 shape adds one more thing: **hooks**. `PreToolUse`, `PostToolUse`, `SessionStart`, `SessionEnd`, `UserPromptSubmit`, `Notification`, `Stop`, and `PreCompact` — configurable extension points where the operator injects policy, telemetry, and guardrails.

The sandbox is E2B or Daytona. Each task runs in a fresh devcontainer with a git worktree mounted read-write. The harness never touches the host filesystem. The worktree gets torn down on success or failure. Cost control is enforced at three layers: a per-turn token ceiling, a per-session dollar budget, and a hard turn limit (typically 50). The observability layer is OpenTelemetry spans with GenAI semantic conventions, shipped to a self-hosted Langfuse.

## Architecture

```
  user CLI  ->  harness (Bun + Ink TUI)
                  |
                  v
           plan / act / observe loop  <--->  Claude Sonnet 4.7 / GPT-5.4-Codex / Gemini 3 Pro
                  |                          (via OpenRouter, model-agnostic)
                  v
           tool dispatcher (MCP StreamableHTTP client)
                  |
     +------------+------------+----------+
     v            v            v          v
  read/edit    ripgrep     tree-sitter   git/run
     |            |            |          |
     +------------+------------+----------+
                  |
                  v
           E2B / Daytona sandbox  (worktree isolated)
                  |
                  v
           hooks: Pre/Post, Session, Prompt, Compact
                  |
                  v
           OpenTelemetry -> Langfuse (spans, tokens, $)
                  |
                  v
           PR via GitHub app
```

## Stack

- Harness runtime: Bun 1.2 + Ink 5 (React-in-terminal)
- Model access: OpenRouter unified API with Claude Sonnet 4.7, GPT-5.4-Codex, Gemini 3 Pro, Opus 4.5 (for hardest tasks)
- Tool transport: Model Context Protocol StreamableHTTP (MCP 2026 revision)
- Sandbox: E2B sandboxes (JS SDK) or Daytona devcontainers
- Code search: ripgrep subprocess, tree-sitter parsers for 17 languages (pre-compiled)
- Isolation: `git worktree add` per task, cleanup on success / failure
- Eval harness: SWE-bench Pro (verified subset) + Terminal-Bench 2.0 + your own 30-task holdout
- Observability: OpenTelemetry SDK with `gen_ai.*` semconv → self-hosted Langfuse
- PR posting: GitHub App with fine-grained token, scope limited to the target repo


## Use It

```
$ agent run ./my-repo "Fix the race condition in worker.rs"
[plan]  1 locate worker.rs and enumerate mutex uses
        2 identify shared state under contention
        3 propose fix, verify tests
[tool]  ripgrep mutex.*lock -t rust           (44 matches, truncated)
[tool]  read_file src/worker.rs 120..180
[tool]  edit_file src/worker.rs (+8 -3)
[tool]  run_shell cargo test worker::          (passed)
[plan]  1 done · 2 done · 3 done
[done]  PR opened: #482   turns=9   tokens=38k   cost=$0.41
```

## Ship It

The deliverable skill lives in `outputs/skill-terminal-coding-agent.md`. Given a repo path and a task description, it runs the full plan-act-observe loop in a sandbox and returns a PR URL plus a trace bundle. The rubric for this capstone:

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 vs baseline | Your harness vs mini-swe-agent on 30 matched Python tasks |
| 20 | Architecture clarity | Plan/act/observe separation, hook surface, tool schema — reviewed against Live-SWE-agent layout |
| 20 | Safety | Sandbox escape tests, permission prompts, destructive-command guard passes red-team |
| 20 | Observability | Trace completeness (100% of tool calls spanned), token accounting per turn |
| 15 | Developer UX | Cold-start < 2s, crash recovery resumes plan, Ctrl-C cancels mid-tool cleanly |
| **100** | | |


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Harness | "The agent loop" | The code surrounding the model that dispatches tools, maintains plan state, and enforces budgets |
| Hook | "Agent event listener" | A user-authored script run on one of eight lifecycle events by the harness |
| Worktree | "Git sandbox" | A linked git checkout at a separate path; disposable without touching the main clone |
| TodoWrite | "Plan state" | A typed list of pending/in-progress/done items the model rewrites each turn |
| StreamableHTTP | "MCP transport" | 2026 MCP revision: long-lived HTTP connection with bidirectional streaming; replaces SSE |
| Token ceiling | "Context budget" | Per-turn or per-session cap on input+output tokens; triggers compaction or termination |
| pass@1 | "Single-attempt pass rate" | Fraction of SWE-bench tasks solved on the first run without retry or test-set peeking |

## Further Reading

- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code) — reference harness from Anthropic
- [Cursor 3 changelog](https://cursor.com/changelog) — Agent Tabs and Composer 2 product notes
- [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) — minimal baseline for SWE-bench harness comparison
- [Live-SWE-agent](https://github.com/OpenAutoCoder/live-swe-agent) — 79.2% SWE-bench Verified with Opus 4.5
- [OpenCode](https://opencode.ai) — open harness, 112k stars
- [SWE-bench Pro leaderboard](https://www.swebench.com) — the evaluation this capstone targets
- [Model Context Protocol 2026 roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) — StreamableHTTP, capability metadata
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — span schema for tool calls and token usage
