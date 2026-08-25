---
name: skill-residual-block-reviewer
description: Check the shape and addition contract of a residual block
version: 1.0.0
phase: 4
lesson: 3
tags: [computer-vision, residuals, shapes]
---

# Residual block reviewer

Record the main and shortcut shapes immediately before addition. `residual_add` accepts only matching non-empty NCHW arrays. If the main branch changes channel count or spatial stride, require a projection that produces the exact main shape; do not rely on broadcasting.

Also record whether the block's local operations are finite and whether a final activation is applied after the addition. The lesson's NumPy code checks shape identity and parameter formulas; it does not claim to implement batch normalization, autograd, or a framework residual checkpoint.
