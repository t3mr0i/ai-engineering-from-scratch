# Guided demo: Model Evaluation

> **Time:** 10–15 minutes · **Question:** What observable evidence shows that you can implement K-fold and stratified K-fold cross-validation from scratch and explain why stratification matters for imbalanced data?

## Before you run

Write one predicted invariant for the baseline. Tie it to this objective: **Implement K-fold and stratified K-fold cross-validation from scratch and explain why stratification matters for imbalanced data.** Do not inspect the output first.

## Run the baseline

From the repository root:

```bash
julia phases/02-ml-fundamentals/09-model-evaluation/code/main.jl
```

The command must print a bounded result and exit with status 0. Locate the part of the output that provides evidence for **Implement K-fold and stratified K-fold cross-validation from scratch and explain why stratification matters for imbalanced data**. Record the exact input, the relevant output, and the invariant in one sentence.

## Change one variable

Change the smallest input or configuration value that helps you investigate **Compute precision, recall, F1, AUC-ROC, and regression metrics (MSE, RMSE, MAE, R-squared) from scratch**. Keep every other value fixed. Run the same command again and capture a before/after pair; a screenshot without the values is not sufficient evidence.

## Probe a failure

Choose an edge case or violated precondition related to **Interpret learning curves to diagnose whether a model suffers from high bias or high variance**. Predict whether the program should reject it, degrade gracefully, or return a different valid result. Run the probe and explain any mismatch between prediction and observation. Restore the source afterward.

## Exit ticket

In three sentences, state (1) the mechanism you observed, (2) the controlled change and its effect, and (3) the acceptance check that demonstrates you can **identify common evaluation mistakes including data leakage, wrong metric selection, and test set contamination**. If the evidence is ambiguous, name the next measurement rather than claiming success.

