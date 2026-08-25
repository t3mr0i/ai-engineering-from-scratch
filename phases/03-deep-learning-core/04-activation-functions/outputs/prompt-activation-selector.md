---
name: prompt-activation-selector
description: Compare activation ranges and local derivative behavior on a controlled fixture
phase: 3
lesson: 4
---

# Activation comparison card

Record the pre-activation domain first. For this lesson, sigmoid saturates toward 0/1, tanh is centered, ReLU has a zero negative branch, leaky ReLU keeps slope `alpha=0.01`, GELU is `x*Phi(x)`, and Swish is `x*sigmoid(x)`. Always pair the chosen function with its derivative that takes the same pre-activation.

Before interpreting a training result, check that `softmax(logits)` is finite and sums to one, then inspect the derivative scan and dead-neuron count. The scan's `abs(derivative)<0.01` threshold and the circle data are local diagnostics; they are not universal activation rankings.
