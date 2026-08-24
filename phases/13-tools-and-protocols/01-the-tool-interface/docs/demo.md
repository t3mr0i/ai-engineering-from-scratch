# Guided demo: The Tool Interface — Why Agents Need Structured I/O

> **Time:** 10–15 minutes · **Question:** What observable evidence shows that you can explain why an LLM that can only generate text cannot, on its own, take actions against the real world?

## Before you run

Write one predicted invariant for the baseline. Tie it to this objective: **Explain why an LLM that can only generate text cannot, on its own, take actions against the real world.** Do not inspect the output first.

## Run the baseline

From the repository root:

```bash
python3 phases/13-tools-and-protocols/01-the-tool-interface/code/main.py
```

The command must print a bounded result and exit with status 0. Locate the part of the output that provides evidence for **Explain why an LLM that can only generate text cannot, on its own, take actions against the real world**. Record the exact input, the relevant output, and the invariant in one sentence.

## Change one variable

Change the smallest input or configuration value that helps you investigate **Draw the four-step tool-call loop (describe → decide → execute → observe) and name who owns each step**. Keep every other value fixed. Run the same command again and capture a before/after pair; a screenshot without the values is not sufficient evidence.

## Probe a failure

Choose an edge case or violated precondition related to **Write a tool description as three parts: name, JSON Schema input, and a deterministic executor function**. Predict whether the program should reject it, degrade gracefully, or return a different valid result. Run the probe and explain any mismatch between prediction and observation. Restore the source afterward.

## Exit ticket

In three sentences, state (1) the mechanism you observed, (2) the controlled change and its effect, and (3) the acceptance check that demonstrates you can **distinguish pure and side-effecting tools and state why the split matters for safety**. If the evidence is ambiguous, name the next measurement rather than claiming success.

