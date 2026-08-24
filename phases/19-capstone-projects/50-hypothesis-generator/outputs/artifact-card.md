# Hypothesis Generator — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to drive a sampler from a seed prompt and turn its outputs into typed hypothesis records.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Ramp the sampler temperature on each pass so the next draft drifts further from the last.
- **Evidence to retain:** the input, output, and invariant needed to filter near duplicates with a small embedding model and a cosine distance threshold.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can rank the survivors with a scoring function that blends novelty, specificity, and testability.
- Run the lesson tests after adapting the implementation to a new project.

