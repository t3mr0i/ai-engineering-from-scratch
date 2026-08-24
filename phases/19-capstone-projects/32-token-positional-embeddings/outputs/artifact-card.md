# Token and Positional Embeddings — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to build a token-embedding lookup table that maps vocabulary ids to dense vectors.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Build a learned positional-embedding lookup table indexed by position.
- **Evidence to retain:** the input, output, and invariant needed to build a fixed sinusoidal positional embedding indexed by position with no parameters.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can compose token and positional embeddings into a single input for a transformer block.
- Run the lesson tests after adapting the implementation to a new project.

