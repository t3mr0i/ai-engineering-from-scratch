# Unsupervised Learning

> When labels are absent, cluster quality and density assumptions become part of the model contract.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 01 probability and norms
**Time:** ~65 minutes

## Learning Objectives

- Run K-Means and calculate inertia and silhouette on a concrete blob fixture.
- Explain why K-Means needs k and favors compact centroid regions.
- Use DBSCAN's eps and min_samples to expose dense groups and noise.
- Read GMM responsibilities as soft membership probabilities.
- Compare agglomerative linkage choices without treating an elbow as proof.

## The algorithms

kmeans(data,k) samples k initial rows, assigns each row to the nearest centroid, recomputes means, and stops when centroids move less than 1e-8 or max_iterations is reached. compute_inertia sums squared point-to-centroid distances. silhouette_score compares a point's average within-cluster distance with the nearest other cluster, returning a value in approximately [-1,1].

dbscan grows a cluster from rows with at least min_samples neighbors inside eps; rows never reached remain -1 noise. gmm uses spherical variances and EM, returning hard assignments, means, weights, and a responsibility matrix. agglomerative_clustering returns labels plus merge history for single, complete, average, or Ward linkage. All functions reject empty or ragged data and invalid parameter ranges.

## Build It

Run python3 main.py. The seeded fixture has 60 rows around [0,0], [4,0], and [0,4]; the output prints K-Means inertia, silhouette, DBSCAN cluster count, GMM weights, and the first responsibility sum. On this fixture the three cluster weights sum to one and every responsibility row sums to one. These are reproducible local observations, not an assertion that three clusters are true in an unknown dataset.

A two-blob hand fixture is produced by make_blobs([[0,0],[5,5]], n_per_cluster=8, spread=0.05, seed=4). Fit kmeans(data,2,seed=3) and inspect its assignments and centroids.

## Use It

Use an elbow or silhouette comparison to propose a k, then inspect whether the groups make sense for the domain. Prefer DBSCAN for separated density regions or explicit noise, but tune eps against the feature scale. A GMM is useful when a point can plausibly belong to more than one component. Keep the original feature scaling in the handoff.

## Ship It

outputs/skill-clustering-guide.md records the algorithm, seed, parameters, centroids or density settings, inertia/silhouette, and how noise was treated. It states that unsupervised scores do not establish semantic correctness without domain review.

## Exercises

1. Fit two clusters to the blob fixture and verify that inertia is below 1 and silhouette is above 0.8.
2. Run dbscan(data, eps=0.3, min_samples=2) and count the two non-noise labels. Explain what would happen if eps were much smaller.
3. Run gmm(data, 2) and check both sum(weights)==1 and sum(responsibilities[0])==1 within floating-point tolerance.

## Reference Solution

The two-blob K-Means run produces two centroids and low inertia; its silhouette is high because the centers are five units apart with 0.05 spread. DBSCAN discovers two dense labels on the same fixture. GMM returns normalized weights and responsibility rows. A sound answer treats these as checks on the local implementation, not as automatic evidence that the domain contains exactly two groups.
