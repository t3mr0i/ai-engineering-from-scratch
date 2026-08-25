---
name: skill-clustering-guide
description: Choose a clustering method and retain its assumptions
phase: 2
lesson: 7
tags: [clustering, kmeans, dbscan, gmm, agglomerative]
---

# Clustering handoff

Record the feature scaling, seed, algorithm, and parameters before comparing scores.

- K-Means requires k and is a compact-centroid baseline. Keep assignments, centroids, and inertia.
- DBSCAN uses eps and min_samples and labels unvisited sparse rows -1. Report the number of non-noise clusters.
- GMM returns means, normalized component weights, and one responsibility row per input. Keep the spherical-variance assumption visible.
- Agglomerative output includes labels and merge history; name the linkage.

Use inertia and silhouette to compare local K-Means candidates, but treat an elbow as a heuristic. Domain review is required before naming a cluster or calling a point anomalous. Reject empty/ragged data and invalid parameter ranges. The lesson's seeded blobs are a reproducible unit fixture, not evidence that a real dataset has a fixed number of groups.
