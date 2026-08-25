---
name: skill-conv-shape-calculator
description: Calculate a local convolution output shape and receptive field from explicit integer parameters
version: 1.0.0
phase: 4
lesson: 2
tags: [computer-vision, cnn, shapes]
---

# Convolution shape calculator

Input: a finite CHW shape, kernel `(K_h,K_w)`, padding, stride, and optional dilation. Call `output_size` for each spatial axis and `receptive_field` for an ordered list of `(kernel,stride[,dilation])` layers. For `max_pool2d`, record that padded borders use a lower neutral value (`-inf` for floats, dtype minimum for integers), not zero.

Report:

- input and output `(C,H,W)`;
- effective footprint `D*(K-1)+1`;
- receptive-field side length and feature jump;
- whether `conv2d_naive` and `conv2d_im2col` agree on a seeded fixture.

Never floor an impossible output into a valid-looking tensor. The lesson's helpers raise `ValueError` for non-positive parameters, nonfinite arrays, mismatched channels, and a kernel footprint that cannot fit.
