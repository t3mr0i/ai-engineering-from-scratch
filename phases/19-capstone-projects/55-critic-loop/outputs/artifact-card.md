# Critic Loop — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to score a paper draft across five fixed dimensions: clarity, novelty, evidence, methodology, related-work.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Apply each round's critique as a structured revision diff rather than a freeform rewrite.
- **Evidence to retain:** the input, output, and invariant needed to detect convergence by comparing scores across rounds; stop on plateau, target met, or budget exhausted.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can cap rounds with a max-iteration budget so a non-converging critic does not run forever.
- Run the lesson tests after adapting the implementation to a new project.

