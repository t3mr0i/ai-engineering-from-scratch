# Reflexion: Verbal Reinforcement Learning

> Gradient-based RL needs thousands of trials and a GPU cluster to fix a failure mode. Reflexion (Shinn et al., NeurIPS 2023) does it in natural language: after each failed trial, the agent writes a reflection, stores it in episodic memory, and conditions the next trial on that memory. This is the pattern behind Letta's sleep-time compute, Claude Code's CLAUDE.md learnings, and pro-workflow's learn-rule.

**Type:** Build
**Languages:** Python (stdlib)
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


## Use It

LangGraph ships reflection as a node pattern. Claude Code's `/memory` command and pro-workflow's `/learn-rule` externalize the episodic buffer as a markdown file. Letta's sleep-time compute runs the Self-Reflector on downtime so the primary agent stays latency-bound. OpenAI Agents SDK does not ship Reflexion directly; you build it with a custom Guardrail that rejects trajectories by score and a memory `Session` that survives across runs.

## Ship It

`outputs/skill-reflexion-buffer.md` creates and maintains an episodic buffer with reflection capture, TTL, and deduplication. Given a task class and a failure, it emits a reflection that actually helps the next trial (not a generic "be more careful").


## Key Terms

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Reflexion | "Self-correction" | Shinn et al. 2023 — Actor, Evaluator, Self-Reflector plus episodic memory |
| Verbal reinforcement | "Learning without gradients" | Natural-language reflection prepended to the next trial's prompt |
| Episodic memory | "Per-task reflections" | Bounded buffer of prior reflections for one task class |
| Scalar evaluator | "Binary success signal" | Pass/fail or numeric score from ground truth |
| Heuristic evaluator | "Pattern-based detector" | Predefined failure signatures (e.g. stuck-loop, too-many-steps) |
| Self-evaluator | "LLM-as-judge on own trace" | Lower-signal fallback when no ground truth — pair with tool-grounded verification |
| Memory rot | "Stale reflections" | Episodic buffer fills with obsolete entries; fix with compaction/TTL |
| Sleep-time reflection | "Async self-reflection" | Run Self-Reflector off the hot path so primary agent stays fast |

## Further Reading

- [Shinn et al., Reflexion: Language Agents with Verbal Reinforcement Learning (arXiv:2303.11366)](https://arxiv.org/abs/2303.11366) — the canonical paper
- [Letta, Sleep-time Compute](https://www.letta.com/blog/sleep-time-compute) — async reflection in production
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — managing the episodic buffer as part of context
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — reflection node pattern
