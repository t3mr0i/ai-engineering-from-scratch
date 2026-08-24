# Classical Metrics — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to implement token-level exact-match, F1, and accuracy with explicit tokenisation rules.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Implement BLEU-4 from the ground up: modified n-gram precision, geometric mean over n equals 1 through 4, brevity penalty.
- **Evidence to retain:** the input, output, and invariant needed to implement ROUGE-L using longest common subsequence, with F-beta combination of precision and recall.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can dispatch on the metric_name field from "Task Spec Format" so the runner stays metric-agnostic.
- Run the lesson tests after adapting the implementation to a new project.

