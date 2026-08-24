# Capstone Lesson 40: Direct Preference Optimization from Scratch — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to derive the DPO loss as a sigmoid over a scaled log-ratio difference and connect it to the implicit reward.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Build a reference model + policy model pair with a frozen reference and a trainable policy.
- **Evidence to retain:** the input, output, and invariant needed to compute sequence-level log-probabilities under both models, masking prompt tokens.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can train the policy on `(prompt, chosen, rejected)` triples and watch the chosen log-prob rise relative to rejected.
- Run the lesson tests after adapting the implementation to a new project.

