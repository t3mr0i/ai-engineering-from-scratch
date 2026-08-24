# Capstone Lesson 38: Classifier Fine-Tuning by Head Swap — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to replace a language-model head with a classification head without re-initialising the body.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Implement two training regimes: frozen body (head-only) and full fine-tuning, sharing one training loop.
- **Evidence to retain:** the input, output, and invariant needed to build a tokeniser-aware data pipeline that pads, masks padding, and pools attention output.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can compute precision, recall, F1, and a confusion matrix from raw logits.
- Run the lesson tests after adapting the implementation to a new project.

