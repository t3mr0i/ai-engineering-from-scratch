# Guided demo: Prompt Engineering: Techniques & Patterns

> **Time:** 10–15 minutes · **Question:** What observable evidence shows that you can apply the core prompt engineering patterns (role, context, constraints, output format) to transform vague requests into precise instructions?

## Before you run

Write one predicted invariant for the baseline. Tie it to this objective: **Apply the core prompt engineering patterns (role, context, constraints, output format) to transform vague requests into precise instructions.** Do not inspect the output first.

## Run the baseline

From the repository root:

```bash
npx --no-install tsx phases/11-llm-engineering/01-prompt-engineering/code/main.ts
```

The command must print a bounded result and exit with status 0. Locate the part of the output that provides evidence for **Apply the core prompt engineering patterns (role, context, constraints, output format) to transform vague requests into precise instructions**. Record the exact input, the relevant output, and the invariant in one sentence.

## Change one variable

Change the smallest input or configuration value that helps you investigate **Construct system prompts with explicit behavioral rules that produce consistent, high-quality outputs**. Keep every other value fixed. Run the same command again and capture a before/after pair; a screenshot without the values is not sufficient evidence.

## Probe a failure

Choose an edge case or violated precondition related to **Diagnose prompt failures (hallucination, refusal, format violations) and fix them with targeted prompt modifications**. Predict whether the program should reject it, degrade gracefully, or return a different valid result. Run the probe and explain any mismatch between prediction and observation. Restore the source afterward.

## Exit ticket

In three sentences, state (1) the mechanism you observed, (2) the controlled change and its effect, and (3) the acceptance check that demonstrates you can **implement a prompt testing harness that evaluates prompt changes against a set of expected outputs**. If the evidence is ambiguous, name the next measurement rather than claiming success.

