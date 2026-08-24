# Leaderboard Aggregation — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to aggregate per-task scores across multiple models and multiple tasks into a tidy per-model row.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Normalise heterogeneous scores so that pass rates and BLEU values do not over-influence the aggregate.
- **Evidence to retain:** the input, output, and invariant needed to rank models by mean and by win-rate, and explain when each is the right summary.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can compute bootstrap confidence intervals on the mean score per model and on pairwise differences.
- Run the lesson tests after adapting the implementation to a new project.

