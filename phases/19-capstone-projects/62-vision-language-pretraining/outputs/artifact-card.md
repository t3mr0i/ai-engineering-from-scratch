# Vision-Language Pretraining — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to implement InfoNCE contrastive loss across a batch of image-caption pairs.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Compose contrastive loss with autoregressive language modeling loss.
- **Evidence to retain:** the input, output, and invariant needed to synthesize a 200-pair mock image-caption corpus with no real dataset download.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can run a 50-step demo training loop and observe both losses decreasing.
- Run the lesson tests after adapting the implementation to a new project.

