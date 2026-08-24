# Projection Layer for Modality Alignment — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to build a two-layer MLP projection that maps image features into the text embedding space.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Construct a mock text embedding table (no pretrained tokenizer, no real corpus).
- **Evidence to retain:** the input, output, and invariant needed to compute a cosine alignment loss between projected image tokens and a paired caption embedding.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can train the projection alone with a frozen vision encoder and a frozen text table.
- Run the lesson tests after adapting the implementation to a new project.

