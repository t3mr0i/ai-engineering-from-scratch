---
name: skill-rectified-flow-fixture
description: Specify a rectified-flow training fixture with checked path and velocity tensors
version: 1.0.0
phase: 4
lesson: 23
tags: [diffusion, rectified-flow, patches, euler]
---

# Rectified-Flow Fixture

For finite `x0`, `epsilon`, and one `t` per batch item, record
`x_t=(1-t)x0+t epsilon` and target velocity `epsilon-x0`. Verify endpoints before using a model.
For sampling, record `steps`, call the velocity function at descending times, and reject a shape or
finite-value mismatch on every step. This artifact specifies an offline seam; it does not promise a
trained generator or a particular checkpoint.
