---
name: prompt-loss-function-selector
description: Select the loss whose input representation matches a local model output
phase: 3
lesson: 5
---

# Loss selection card

- Continuous paired values: use `mse` when squared residuals are intended, or `mae` when the absolute residual is the stated objective.
- Binary probabilities and 0/1 labels: use `binary_cross_entropy`.
- Class logits and one integer class index: use `categorical_cross_entropy`; its gradient is stable softmax minus one-hot.
- Unit vectors with positives and negatives: use `contrastive_loss` and state its positive temperature.

Report the reduction, label convention, and validation behavior with the choice. The lesson's label smoothing and contrastive examples are deliberately small fixtures, not tuned defaults for an unseen task.
