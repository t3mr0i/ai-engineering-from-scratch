# Guided demo: Evaluation & Testing LLM Applications

> **Time:** 10–15 minutes · **Question:** What observable evidence shows that you can build an evaluation dataset with input-output pairs, rubrics, and edge cases specific to your LLM application?

## Before you run

Write one predicted invariant for the baseline. Tie it to this objective: **Build an evaluation dataset with input-output pairs, rubrics, and edge cases specific to your LLM application.** Do not inspect the output first.

## Run the baseline

From the repository root:

```bash
python3 phases/11-llm-engineering/10-evaluation/code/main.py
```

The command must print a bounded result and exit with status 0. Locate the part of the output that provides evidence for **Build an evaluation dataset with input-output pairs, rubrics, and edge cases specific to your LLM application**. Record the exact input, the relevant output, and the invariant in one sentence.

## Change one variable

Change the smallest input or configuration value that helps you investigate **Implement automated scoring using LLM-as-judge, regex matching, and deterministic assertion checks**. Keep every other value fixed. Run the same command again and capture a before/after pair; a screenshot without the values is not sufficient evidence.

## Probe a failure

Choose an edge case or violated precondition related to **Set up regression testing that detects quality degradation when prompts, models, or parameters change**. Predict whether the program should reject it, degrade gracefully, or return a different valid result. Run the probe and explain any mismatch between prediction and observation. Restore the source afterward.

## Exit ticket

In three sentences, state (1) the mechanism you observed, (2) the controlled change and its effect, and (3) the acceptance check that demonstrates you can **design evaluation metrics that capture what matters for your use case (correctness, tone, format compliance, latency)**. If the evidence is ambiguous, name the next measurement rather than claiming success.

