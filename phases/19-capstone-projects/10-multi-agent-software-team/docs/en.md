# Capstone 10 — Multi-Agent Software Engineering Team

> SWE-AF's factory architecture, MetaGPT's role-based prompting, AutoGen 0.4's typed actor graph, Cognition's Devin, and Factory's Droids all converged on the same 2026 shape: an architect plans, N coders work in parallel worktrees, a reviewer gates, a tester verifies. Parallel worktrees convert wall-clock into throughput. Shared state and handoff protocols become the failure surface. The capstone is to build the team, evaluate on SWE-bench Pro, and report which handoffs break and how often.

**Type:** Capstone
**Languages:** Python / TypeScript (agents), Shell (worktree scripts)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 16 (multi-agent), Phase 17 (infrastructure)
**Phases exercised:** P11 · P13 · P14 · P15 · P16 · P17
**Time:** 40 hours

## Problem

Single-agent coding harnesses hit a ceiling on large tasks. Not because any individual agent is weak, but because a 200k-token context cannot hold an architecture plan plus four parallel codebase slices plus reviewer commentary plus test output. Multi-agent factories split the problem: an architect owns the plan, coders own implementation in parallel worktrees, a reviewer gates, a tester verifies. SWE-AF's "factory" architecture, MetaGPT's roles, AutoGen's typed actor graph — all three framings describe the same shape.

The failure surface is the handoff. Architect plans something the coders cannot implement. Coders produce conflicting diffs. Reviewer approves a hallucinated fix. Tester races a still-writing coder. You will build one of these teams, run it on 50 SWE-bench Pro issues, track every handoff, and publish the post-mortem.

## Concept

Roles are typed agents. **Architect** (Claude Opus 4.7) reads the issue, writes a plan, and breaks it into subtasks with explicit interfaces. **Coders** (Claude Sonnet 4.7, N parallel instances, each in a `git worktree` + Daytona sandbox) implement subtasks independently. **Reviewer** (GPT-5.4) reads the merged diff and either approves or requests specific changes. **Tester** (Gemini 2.5 Pro) runs the test suite in isolation and reports pass/fail with artifacts.

Communication is through a shared task board (file-backed or Redis). Each role consumes tasks it is permitted to handle. Handoffs are A2A-protocol-typed messages. Coordination concerns: merge-conflict resolution (coordinator role or automatic three-way merge), shared-state synchronization (the plan is frozen once coders start; replans are separate events), and reviewer gatekeeping (the reviewer cannot approve its own changes or changes it proposed).

Token amplification is the hidden cost. Every role boundary adds summary prompts and handoff context. A 40-turn single-agent run becomes 160 total turns across four roles. The rubric specifically weighs token efficiency vs single-agent baseline because the question is not "does multi-agent work" but "does it win per dollar."

## Architecture

```
GitHub issue URL
      |
      v
Architect (Opus 4.7)
   reads issue, produces plan with subtasks + interfaces
      |
      v
Task board (file / Redis)
      |
   +-- subtask 1 ---+-- subtask 2 ---+-- subtask 3 ---+-- subtask 4 ---+
   v                v                v                v                v
Coder A          Coder B          Coder C          Coder D          (4 parallel)
 (Sonnet)         (Sonnet)         (Sonnet)         (Sonnet)
 worktree A       worktree B       worktree C       worktree D
 Daytona          Daytona          Daytona          Daytona
      |                |                |                |
      +--------+-------+-------+--------+
               v
           merge coordinator  (three-way merge + conflict resolution)
               |
               v
           Reviewer (GPT-5.4)
               |
               v
           Tester  (Gemini 2.5 Pro)  -> passes? -> open PR
                                     -> fails?  -> route back to coder
```

## Stack

- Orchestration: LangGraph with shared state + per-agent sub-graphs
- Messaging: A2A protocol (Google 2025) for typed inter-agent messages
- Models: Opus 4.7 (architect), Sonnet 4.7 (coders), GPT-5.4 (reviewer), Gemini 2.5 Pro (tester)
- Worktree isolation: `git worktree add` per coder + Daytona sandbox
- Merge coordinator: custom three-way merge + LLM-mediated conflict resolution
- Eval: SWE-bench Pro (50 issues), SWE-AF scenarios, HumanEval++ for unit tests
- Observability: Langfuse with role-tagged spans, per-agent token accounting
- Deployment: K8s with each role as a separate Deployment + HPA on backlog


## Use It

```
$ team run --issue https://github.com/acme/widget/issues/842
[architect] plan: 4 subtasks (parser, cache, api, migration)
[board]     dispatched to 4 coders in parallel worktrees
[coder-A]   subtask parser  -> 42 lines, tests pass locally
[coder-B]   subtask cache   -> 88 lines, tests pass locally
[coder-C]   subtask api     -> 31 lines, tests pass locally
[coder-D]   subtask migration -> 19 lines, tests pass locally
[merge]     3-way merge: 0 conflicts
[reviewer]  comments on cache (thread pool sizing); routed to coder-B
[coder-B]   revision: 92 lines; submits
[reviewer]  approved
[tester]    all 412 tests pass
[pr]        opened #3382   4 coders, 1 revision, $4.90, 18m
```

## Ship It

`outputs/skill-multi-agent-team.md` is the deliverable. Given an issue URL and parallelism level, the team produces a merge-ready PR with per-role token accounting.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 | Matched 50-issue subset, pass@1 |
| 20 | Parallel speedup | Wall-clock vs single-agent baseline |
| 20 | Review quality | False-approval rate on injected-bug probe |
| 20 | Token efficiency | Total tokens per solved issue vs single-agent |
| 15 | Coordination engineering | Merge-conflict resolution, handoff-failure histogram |
| **100** | | |


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Parallel worktree | "Isolated branch" | `git worktree add` producing a fresh working tree per coder |
| Task board | "Shared message bus" | File or Redis store of typed messages agents subscribe to |
| Handoff | "Role boundary" | Any message crossing from one role's context to another's |
| Token amplification | "Multi-agent overhead" | Total tokens across roles / single-agent tokens for the same task |
| A2A protocol | "Agent-to-agent" | Google's 2025 spec for typed inter-agent messages |
| Merge coordinator | "Integrator" | Component that runs three-way merge and mediates conflicts |
| False approval | "Reviewer hallucination" | Reviewer approves a diff with known bugs |

## Further Reading

- [SWE-AF factory architecture](https://github.com/Agent-Field/SWE-AF) — the reference 2026 multi-agent factory
- [MetaGPT](https://github.com/FoundationAgents/MetaGPT) — role-based multi-agent framework
- [AutoGen v0.4](https://github.com/microsoft/autogen) — Microsoft's typed actor framework
- [Cognition AI (Devin)](https://cognition.ai) — reference product
- [Factory Droids](https://www.factory.ai) — alternate reference product
- [Google A2A protocol](https://developers.google.com/agent-to-agent) — inter-agent messaging spec
- [git worktree documentation](https://git-scm.com/docs/git-worktree) — the isolation substrate
- [SWE-bench Pro](https://www.swebench.com) — the evaluation target
