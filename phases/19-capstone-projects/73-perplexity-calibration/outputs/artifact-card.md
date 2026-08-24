# Perplexity and Calibration — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to compute token-level perplexity on a held-out corpus from token negative log-probabilities supplied by the model adapter.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Compute the expected calibration error (ECE) of a classifier or multiple-choice eval from binned predicted probabilities.
- **Evidence to retain:** the input, output, and invariant needed to compute the Brier score (mean squared error against the indicator of correctness) and explain when it does what ECE does not.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can build the reliability diagram data needed to plot a confidence-versus-accuracy curve.
- Run the lesson tests after adapting the implementation to a new project.

