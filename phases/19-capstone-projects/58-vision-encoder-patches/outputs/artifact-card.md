# Vision Encoder Patches — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to tokenize an image into a fixed-length sequence of patch embeddings.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Implement a `Conv2d`-based patch projection that matches the math of unfold-then-linear.
- **Evidence to retain:** the input, output, and invariant needed to build a deterministic 2D sinusoidal position embedding so token order encodes spatial position.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can verify patch count, embedding shape, and `Conv2d`/unfold equivalence on a synthetic fixture.
- Run the lesson tests after adapting the implementation to a new project.

