---
name: skill-depth-to-pointcloud
description: Convert a positive depth map and pinhole intrinsics into a checked ASCII PLY
version: 1.0.0
phase: 4
lesson: 26
tags: [depth, point-cloud, pinhole, ply]
---

# Depth to Point Cloud

Require a finite positive `HxW` depth map and `(fx,fy,cx,cy)` with positive focal lengths. Compute
`x=(u-cx)z/fx`, `y=(v-cy)z/fy`, and keep the output shape `(H,W,3)` until export. Store the input
shape and intrinsics in the handoff. The local writer emits an ASCII PLY; it does not infer color or
mesh connectivity.
