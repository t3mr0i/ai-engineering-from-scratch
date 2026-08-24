# Cross-Attention Fusion — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to implement multi-head cross-attention where the query stream is text and the key/value stream is vision.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Compose a decoder block: causal self-attention + cross-attention + feed-forward.
- **Evidence to retain:** the input, output, and invariant needed to get the mask shapes right: causal mask for self-attention, no mask for cross-attention.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can run a forward pass with batched text tokens and a fixed pool of image tokens.
- Run the lesson tests after adapting the implementation to a new project.

