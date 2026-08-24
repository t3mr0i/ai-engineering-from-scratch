# Multi-Head Self-Attention — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to implement a batched Query/Key/Value projection as a single linear layer split into H heads.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Compute scaled dot-product attention with the correct normalization and dtype handling.
- **Evidence to retain:** the input, output, and invariant needed to apply a causal mask that prevents a position from attending to future positions.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can inspect per-head attention weights for a fixed input and reason about what each head looks at.
- Run the lesson tests after adapting the implementation to a new project.

