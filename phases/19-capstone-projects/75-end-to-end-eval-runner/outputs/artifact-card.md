# End-to-End Eval Runner — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to define a `ModelAdapter` interface that any model (mock, local, API) can satisfy with a small method surface.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Run the eval over a fixture JSONL file with parallel task execution across a worker pool.
- **Evidence to retain:** the input, output, and invariant needed to compose the metric layer (exact_match, F1, BLEU-4, ROUGE-L, code_exec) with the calibration layer in one pass.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can emit per-model `EvalRun` records and feed them straight into the leaderboard aggregator.
- Run the lesson tests after adapting the implementation to a new project.

