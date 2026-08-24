# Guided demo: The Agent Loop: Observe, Think, Act

> **Time:** 10–15 minutes · **Question:** What observable evidence shows that you can name the three parts of the ReAct loop — Thought, Action, Observation — and explain why each one is load-bearing?

## Before you run

Write one predicted invariant for the baseline. Tie it to this objective: **Name the three parts of the ReAct loop — Thought, Action, Observation — and explain why each one is load-bearing.** Do not inspect the output first.

## Run the baseline

From the repository root:

```bash
python3 phases/14-agent-engineering/01-the-agent-loop/code/main.py
```

The command must print a bounded result and exit with status 0. Locate the part of the output that provides evidence for **Name the three parts of the ReAct loop — Thought, Action, Observation — and explain why each one is load-bearing**. Record the exact input, the relevant output, and the invariant in one sentence.

## Change one variable

Change the smallest input or configuration value that helps you investigate **Implement a stdlib agent loop with a toy LLM, tool registry, and stop condition under 200 lines**. Keep every other value fixed. Run the same command again and capture a before/after pair; a screenshot without the values is not sufficient evidence.

## Probe a failure

Choose an edge case or violated precondition related to **Identify the 2026 shift from prompt-based thought tokens to native model reasoning (Responses API, encrypted reasoning passthrough)**. Predict whether the program should reject it, degrade gracefully, or return a different valid result. Run the probe and explain any mismatch between prediction and observation. Restore the source afterward.

## Exit ticket

In three sentences, state (1) the mechanism you observed, (2) the controlled change and its effect, and (3) the acceptance check that demonstrates you can **explain why every modern harness (Claude Agent SDK, OpenAI Agents SDK, LangGraph, AutoGen v0.4) still runs this loop under the hood**. If the evidence is ambiguous, name the next measurement rather than claiming success.

