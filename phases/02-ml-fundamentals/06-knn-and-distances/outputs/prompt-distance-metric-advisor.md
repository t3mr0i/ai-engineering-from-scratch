---
name: prompt-distance-metric-advisor
description: Recommend a distance metric with its units and scaling contract
phase: 2
lesson: 6
---

# Distance advisor handoff

Describe every feature's unit and range before choosing a metric.

- L2 is useful for similarly scaled numeric coordinates.
- L1 reduces the influence of one large coordinate difference.
- Cosine compares direction and returns distance one when either vector is zero in this implementation.
- Minkowski with p=2 equals L2; p=infinity is the maximum coordinate difference.
- Standardize training rows and reuse the returned means/stds for validation rows.

Record KNN's k, task, metric, weighting flag, training-row count, and validation score. For KDTree.query, preserve the returned original index and distance. The local tree collects exact distances for a transparent reference; it is not a benchmark claim. Reject empty/mismatched vectors and k outside 1..len(training).
