# Capstone 16 — GitHub Issue-to-PR Autonomous Agent

> AWS Remote SWE Agents, Cursor Background Agents, OpenAI Codex cloud, and Google Jules all ship the same 2026 product shape: label an issue, get a PR. Run an agent in a cloud sandbox, verify tests pass, and post a review-ready PR with rationale. The hard parts are reproducing the repo's build environment automatically, preventing credential leakage, enforcing per-repo budgets, and making sure the agent cannot force-push. This capstone builds the self-hosted version and compares it on cost and pass rate to the hosted alternatives.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:** P11 · P13 · P14 · P15 · P17
**Time:** 30 hours

## Learning Objectives

- Define measurable acceptance criteria for Capstone 16 — GitHub Issue-to-PR Autonomous Agent
- Integrate the required components into one self-terminating workflow
- Exercise happy paths, edge cases, and failure recovery with reproducible fixtures
- Package the verified result as a reusable curriculum artifact

## Problem

The async cloud coding agent is a separate product category from interactive coding agents (capstone 01). The UX is a GitHub label. You label an issue `@agent fix this`, a worker spins up in a cloud sandbox, clones the repo, runs tests, edits files, verifies, and opens a PR with the agent's rationale in the body. No interactive loop, no terminal. AWS Remote SWE Agents, Cursor Background Agents, OpenAI Codex cloud, Google Jules, and Factory Droids all converge on this.

The engineering challenges are concrete: environment reproduction (the agent has to build the repo from scratch without a cached dev image), flaky tests (must be re-run or isolated), credential scoping (a GitHub App with minimal fine-grained permissions), budget enforcement per repo per day, and no-force-push policy. The capstone measures pass rate, cost, and safety vs the hosted alternatives.

## Concept

The trigger is a GitHub webhook (issue label or PR comment). A dispatcher enqueues work to ECS Fargate or Lambda. The worker pulls the repo into a Daytona or E2B sandbox with a generic Dockerfile inferred from the repo (language, framework). The agent runs a mini-swe-agent or SWE-agent v2 loop against Claude Opus 4.7 or GPT-5.4-Codex. It iterates: read code, propose fix, apply patch, run tests.

Verification is the gating step. Full CI must pass in the sandbox before the PR opens. Coverage delta is computed; if negative beyond a threshold, the PR opens but gets labeled `needs-review`. The agent posts the rationale as the PR description plus an `@agent` thread the reviewer can ping for follow-ups.

Safety is scoped through two different GitHub surfaces: the App provides a short-lived installation token with `workflows: read` and narrow repo contents/PR scopes; branch protection (not app permissions) enforces "no direct writes to `main`" and "no force-push" — the app is never added to the bypass list. Path-scoped read-only access to `.github/workflows` is not a real GitHub App primitive, so the agent's allow-list on file edits has to enforce that at the worker. Budget ceilings per repo per day are enforced at the dispatcher (e.g., max 5 PRs per repo per day, $20 per PR).

## Architecture

```
GitHub issue labeled `@agent fix` or PR comment
            |
            v
    GitHub App webhook -> AWS Lambda dispatcher
            |
            v
    ECS Fargate task (or GitHub Actions self-hosted runner)
       - pull repo
       - infer Dockerfile (language, package manager)
       - Daytona / E2B sandbox with target runtime
       - clone -> git worktree -> agent branch
            |
            v
    mini-swe-agent / SWE-agent v2 loop
       Claude Opus 4.7 or GPT-5.4-Codex
       tools: ripgrep, tree-sitter, read/edit, run_tests, git
            |
            v
    verify CI passes in-sandbox + coverage delta check
            |
            v (verified)
    git push + open PR via GitHub App
       PR body = rationale + diff summary + trace URL
       label: needs-review
            |
            v
    operator reviews; can @-mention agent for follow-ups
```

## Stack

- Trigger: GitHub App with fine-grained token; webhook receiver via Lambda or Fly.io
- Worker: ECS Fargate task (or GitHub Actions self-hosted runner)
- Sandbox: Daytona devcontainer or E2B sandbox per task
- Agent loop: mini-swe-agent baseline or SWE-agent v2 over Claude Opus 4.7 / GPT-5.4-Codex
- Retrieval: tree-sitter repo-map + ripgrep
- Verification: full CI in-sandbox + coverage delta gate
- Observability: Langfuse with per-PR trace archive linked from the PR body
- Budget: per-repo daily dollar ceiling; max PRs per repo per day




## Further Reading

- [AWS Remote SWE Agents](https://github.com/aws-samples/remote-swe-agents) — the canonical async cloud agent reference
- [SWE-agent](https://github.com/SWE-agent/SWE-agent) — CLI reference
- [Cursor Background Agents](https://docs.cursor.com/background-agent) — commercial alternative
- [OpenAI Codex (cloud)](https://openai.com/codex) — hosted competitor
- [Google Jules](https://jules.google) — Google's hosted version
- [Factory Droids](https://www.factory.ai) — alternate commercial reference
- [GitHub App documentation](https://docs.github.com/en/apps) — scoped bot identity
- [Daytona cloud sandboxes](https://daytona.io) — reference sandbox
