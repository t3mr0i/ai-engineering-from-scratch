# Vision Transformer Encoder — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to implement a pre-LN transformer block with multi-head self-attention and a feed-forward sub-layer.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Stack 12 blocks with 12 heads to form a ViT-Base encoder.
- **Evidence to retain:** the input, output, and invariant needed to wire the patch front end from lesson 58 into the encoder and run a forward pass.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can verify that the CLS token aggregates information from every patch.
- Run the lesson tests after adapting the implementation to a new project.

