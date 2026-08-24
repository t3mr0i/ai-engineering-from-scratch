# Multimodal Evaluation — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to compute Recall@K from a similarity matrix between image and caption embeddings.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Compute exact-match VQA accuracy from a model that maps (image, question) pairs to a fixed answer vocabulary.
- **Evidence to retain:** the input, output, and invariant needed to compute BLEU-4 from generated and reference token sequences without any external library.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can run all three evals against a synthetic suite built on top of the trained model from lesson 62.
- Run the lesson tests after adapting the implementation to a new project.

