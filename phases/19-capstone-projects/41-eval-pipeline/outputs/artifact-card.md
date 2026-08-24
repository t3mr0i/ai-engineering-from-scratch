# Capstone Lesson 41: Full Evaluation Pipeline — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to compute held-out perplexity with masked-token accounting on a tiny transformer.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Run an exact-match eval on short-form factual prompts.
- **Evidence to retain:** the input, output, and invariant needed to compute token-level F1 between predicted and reference strings with normalisation.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can build a local mock LLM-as-judge that scores model outputs on a 1-5 scale.
- Run the lesson tests after adapting the implementation to a new project.

