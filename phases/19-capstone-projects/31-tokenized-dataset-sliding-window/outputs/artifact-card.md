# Tokenized Dataset with Sliding Window — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to convert a raw corpus into a stream of token ids by calling the tokenizer once.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Slice the id stream into fixed-length windows with a configurable overlap stride.
- **Evidence to retain:** the input, output, and invariant needed to build a PyTorch Dataset that returns input and target tensors for next-token prediction.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can wrap the dataset in a DataLoader with a deterministic shuffle seeded per epoch.
- Run the lesson tests after adapting the implementation to a new project.

