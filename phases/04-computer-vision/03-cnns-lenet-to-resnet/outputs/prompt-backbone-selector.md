---
name: prompt-backbone-selector
description: Choose a small CNN shape plan after checking input channels, downsampling, and head width
phase: 4
lesson: 3
---

# Backbone shape review

Start with the actual tensor contract, not the family name. For grayscale `32x32`, run `lenet_shape_trace` and preserve the `400`-feature flatten boundary. For a residual branch, record both complete NCHW shapes and name the projection required when channels or stride differ.

```bash
python3 main.py
```

Report the local parameter formulas from `model_parameter_counts(num_classes)`. Label the result as a NumPy architecture probe: it is not a downloaded LeNet/VGG/ResNet checkpoint and does not establish a benchmark score.
