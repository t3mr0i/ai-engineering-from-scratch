# Guided demo: Indirect Prompt Injection — Production Attack Surface

> **Time:** 10–15 minutes · **Question:** What observable evidence shows that you can define indirect prompt injection and describe three common delivery vectors?

## Before you run

Write one predicted invariant for the baseline. Tie it to this objective: **Define indirect prompt injection and describe three common delivery vectors.** Do not inspect the output first.

## Run the baseline

From the repository root:

```bash
python3 phases/18-ethics-safety-alignment/15-indirect-prompt-injection/code/main.py
```

The command must print a bounded result and exit with status 0. Locate the part of the output that provides evidence for **Define indirect prompt injection and describe three common delivery vectors**. Record the exact input, the relevant output, and the invariant in one sentence.

## Change one variable

Change the smallest input or configuration value that helps you investigate **Explain why user-input filters miss IPI entirely**. Keep every other value fixed. Run the same command again and capture a before/after pair; a screenshot without the values is not sufficient evidence.

## Probe a failure

Choose an edge case or violated precondition related to **Describe the "information flow control" framing as the 2026 defense paradigm**. Predict whether the program should reject it, degrade gracefully, or return a different valid result. Run the probe and explain any mismatch between prediction and observation. Restore the source afterward.

## Exit ticket

In three sentences, state (1) the mechanism you observed, (2) the controlled change and its effect, and (3) the acceptance check that demonstrates you can **state the finding of Nasr et al. (October 2025) on adaptive attack success against published IPI defenses**. If the evidence is ambiguous, name the next measurement rather than claiming success.

