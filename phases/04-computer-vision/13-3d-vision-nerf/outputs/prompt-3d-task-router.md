---
name: prompt-3d-task-router
description: Choose a local ray representation and renderer for a bounded 3D experiment
phase: 4
lesson: 13
---

# Local 3D task router

Use this prompt with the lesson artifact when the input is a small set of posed
rays and the next step is to decide whether density rendering is appropriate.
It deliberately makes no claim about a trained NeRF, a checkpoint, or a point-
cloud library; the companion demo only validates ray geometry and rendering.

## Request format

```text
task: render_novel_view | inspect_density | compare_sampling
rays: integer number of rays, at least 1
samples_per_ray: integer, at least 2
representation: radiance_field | point_cloud | mesh
latency_budget_ms: finite non-negative number
```

## Decision rules

1. Choose `radiance_field` only when each ray has ordered samples with
   `near < far` and a density/color value for every sample.
2. Use the lesson's `volume_render` contract for a small, inspectable fixture:
   densities must be non-negative, colors lie in `[0, 1]`, and depths increase
   along each ray.
3. Choose a point cloud or mesh for a task that needs explicit surfaces or
   established geometry. Do not infer that choice from this NumPy-only demo.
4. Treat `latency_budget_ms` as a project constraint, not as a benchmark. The
   lesson does not measure a renderer's production throughput.

## Handoff

Record the selected representation, the ray/sample shapes, the sum of the
rendering weights, and whether the fixture passed the input checks. A useful
handoff says which observable led to the choice; it does not claim that a
training run or novel-view quality was established.
