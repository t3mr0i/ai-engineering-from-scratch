# Capstone Lesson 39: Instruction Tuning by Supervised Fine-Tuning — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to format paired instruction-response data into a single causal sequence with explicit boundary tokens.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Build a collate function that masks instruction tokens so cross-entropy only counts response tokens.
- **Evidence to retain:** the input, output, and invariant needed to train a tiny transformer body under the SFT objective and watch the eval metric move.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can implement greedy and temperature-sampled generation that respects the response-start boundary.
- Run the lesson tests after adapting the implementation to a new project.

