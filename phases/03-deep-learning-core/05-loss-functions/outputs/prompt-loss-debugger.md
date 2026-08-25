---
name: prompt-loss-debugger
description: Diagnose loss-domain, reduction, and numerical-stability mistakes
phase: 3
lesson: 5
---

# Loss debugger

State whether the model supplies probabilities, logits, embeddings, or regression values. Check paired lengths and finite values before examining the curve. For BCE/CCE/label smoothing, verify probabilities or logits, exact labels/class indices, and a positive finite `eps` below `0.5`; for contrastive loss, check nonzero vector norms and a positive finite temperature.

Use the max-shifted softmax for logits near 1000 and compare one analytical gradient with a finite difference. Keep the mean reduction visible: `mse([1,3],[0,2])=1` and its gradient is `[1,1]`. Do not hide a wrong domain behind clipping or `zip` truncation.
