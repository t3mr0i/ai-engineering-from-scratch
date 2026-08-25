# Dimensionality-Reduction Decision Skill

Use this artifact to record a defensible compression or visualization choice from a fitted local matrix.

## Required record

```text
input_shape: <rows, features>
centered: <yes/no and fitted mean>
method: <PCA | RBF kernel PCA | conceptual visualization comparison>
components: <integer>
projected_shape: <rows, components>
explained_variance_or_kernel: <ratios or kernel/gamma>
reconstruction_mse: <number when reconstructable>
seed: <fixture seed>
```

## Decision rules

- Use PCA when a centered linear subspace and an out-of-sample `transform` are required.
- Use kernel PCA when a specified similarity kernel is the intended nonlinear geometry; record `gamma`.
- Treat t-SNE-style neighborhood plots as local exploratory views, not calibrated global distances.
- Treat graph-based neighbor settings as a local/global trade-off and compare seeds or runs before making a structural claim.

The repository's canonical implementation is NumPy-only and uses synthetic fixtures. Do not silently substitute a downloaded dataset or report a visualization as a classifier score.
